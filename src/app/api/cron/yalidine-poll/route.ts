import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  fetchParcelStatus,
  YALIDINE_STATUS_MAP,
  STATUS_RANK,
} from "@/lib/yalidine";
import { fetchEcotrackStatus, ECOTRACK_STATUS_MAP, ECOTRACK_SLUG_BASE_URL } from "@/lib/ecotrack";
import { sendWhatsAppNotification, sendWhatsAppTemplate } from "@/lib/whatsapp";
import { vendorMessage, TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";

// ─── POLLING ENDPOINT ─────────────────────────────────────────
// Appelé par Vercel Cron toutes les 5 minutes.
// Récupère toutes les commandes "shipped" qui ont un tracking number,
// interroge Yalidine pour le statut actuel, met à jour si changement,
// et envoie les notifications WhatsApp au vendeur + acheteur.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 secondes max sur Vercel Hobby/Pro

interface PollResult {
  tracking: string;
  oldStatus: string;
  newStatus: string;
  vendorNotified: boolean;
  clientNotified: boolean;
  error?: string;
}

export async function GET(req: NextRequest) {
  // ─── Auth : vérifier le secret cron ─────────────────────────
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: PollResult[] = [];

  try {
    // ─── 1. Récupérer toutes les commandes "shipped" ─────────
    // On polle uniquement les commandes en transit (status = shipped)
    // pour minimiser les appels API Yalidine.
    const { data: orders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, status, reference, tracking_number, user_id, client_id, delivery_mode")
      .eq("status", "shipped")
      .not("tracking_number", "is", null);

    if (fetchErr) {
      console.error("[Cron Poll] Erreur fetch orders:", fetchErr);
      return NextResponse.json({ error: "Fetch orders failed" }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ ok: true, polled: 0, results: [] });
    }

    console.log(`[Cron Poll] ${orders.length} commande(s) à vérifier`);

    // ─── 2. Pour chaque commande, vérifier le statut Yalidine ─
    for (const order of orders) {
      const result: PollResult = {
        tracking: order.tracking_number!,
        oldStatus: order.status,
        newStatus: order.status,
        vendorNotified: false,
        clientNotified: false,
      };

      try {
        // Récupérer les credentials Yalidine du vendeur
        const { data: profile } = await supabase
          .from("profiles")
          .select("yalidine_api_id, yalidine_api_token, phone, store_name")
          .eq("id", order.user_id)
          .single();

        // Brancher selon le transporteur de la commande.
        let status: { tracking: string; last_status: string } | null = null;
        let livraStatus: string | undefined;

        if (order.delivery_mode && order.delivery_mode in ECOTRACK_SLUG_BASE_URL) {
          // Famille Ecotrack (dhd, anderson, …) — token dans carrier_tokens.
          const { data: ct } = await supabase
            .from("carrier_tokens")
            .select("token")
            .eq("user_id", order.user_id)
            .eq("carrier_slug", order.delivery_mode)
            .maybeSingle();
          if (!ct?.token) {
            result.error = `Token ${order.delivery_mode} manquant`;
            results.push(result);
            continue;
          }
          status = await fetchEcotrackStatus(order.delivery_mode, order.tracking_number!, ct.token);
          if (!status) {
            result.error = `Pas de réponse ${order.delivery_mode}`;
            results.push(result);
            continue;
          }
          livraStatus = ECOTRACK_STATUS_MAP[status.last_status];
        } else {
          if (!profile?.yalidine_api_id || !profile?.yalidine_api_token) {
            result.error = "Credentials Yalidine manquants";
            results.push(result);
            continue;
          }
          status = await fetchParcelStatus(order.tracking_number!, {
            centerId: profile.yalidine_api_id,
            token: profile.yalidine_api_token,
          });
          if (!status) {
            result.error = "Pas de réponse Yalidine";
            results.push(result);
            continue;
          }
          livraStatus = YALIDINE_STATUS_MAP[status.last_status];
        }

        // Libellé transporteur inconnu → on garde le statut courant.
        if (!livraStatus) {
          result.error = `Statut transporteur inconnu: ${status.last_status}`;
          results.push(result);
          continue;
        }

        // Pas de régression de statut
        const currentRank = STATUS_RANK[order.status] ?? 0;
        const newRank = STATUS_RANK[livraStatus] ?? 0;
        if (newRank <= currentRank) {
          results.push(result);
          continue;
        }

        // ─── 3. Update DB ─────────────────────────────────────
        const { error: updateErr } = await supabase
          .from("orders")
          .update({
            status: livraStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateErr) {
          result.error = `Update failed: ${updateErr.message}`;
          results.push(result);
          continue;
        }

        result.newStatus = livraStatus;

        // ─── 4. Notifications WhatsApp ────────────────────────
        const { data: client } = await supabase
          .from("clients")
          .select("phone")
          .eq("id", order.client_id)
          .single();

        const shopName = profile?.store_name ?? "LIVRA";

        const vMsg = vendorMessage(livraStatus, order.reference, order.tracking_number);
        // clientMessage supprimé → templates acheteur. shipped déjà annoncé à la
        // création du bon (MSG 9), donc ici on ne re-notifie que les états terminaux.
        if (profile?.phone && vMsg) {
          const r = await sendWhatsAppNotification(profile.phone, vMsg);
          result.vendorNotified = r.success;
        }

        // Acheteur : delivered = template APPROUVÉ delivery_completed ; returned =
        // delivery_failed encore en review → texte libre (échoue proprement).
        if (client?.phone) {
          if (livraStatus === "delivered") {
            const r = await sendWhatsAppTemplate(client.phone, TEMPLATES.delivery_completed, [shopName]);
            result.clientNotified = r.success;
          } else if (livraStatus === "returned") {
            const r = await sendWhatsAppNotification(
              client.phone,
              renderTemplateText(TEMPLATES.delivery_failed, [shopName])
            );
            result.clientNotified = r.success;
          }
        }

        results.push(result);
      } catch (err) {
        result.error = err instanceof Error ? err.message : "Unknown error";
        results.push(result);
      }
    }

    return NextResponse.json({
      ok: true,
      polled: orders.length,
      updated: results.filter((r) => r.oldStatus !== r.newStatus).length,
      results,
    });
  } catch (err) {
    console.error("[Cron Poll] Erreur:", err);
    return NextResponse.json(
      { error: "Erreur serveur", detail: String(err) },
      { status: 500 }
    );
  }
}
