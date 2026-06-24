import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deleteEcotrackOrder } from "@/lib/ecotrack";
import { deleteYalidineParcel } from "@/lib/yalidine";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// Annule le bon transporteur (Yalidine / DHD / Anderson) pour permettre au vendeur
// de re-choisir un mode SANS re-créer la commande. Livreur perso n'est PAS géré ici.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, client:clients(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const mode = order.delivery_mode as string | null;
  if (!order.tracking_number || !mode || !["yalidine", "dhd", "anderson"].includes(mode)) {
    return NextResponse.json({ error: "Aucun bon transporteur à annuler." }, { status: 400 });
  }

  // 1) Tenter l'annulation côté transporteur (best-effort).
  let warning: string | undefined;
  if (mode === "dhd" || mode === "anderson") {
    const { data: ct } = await supabase
      .from("carrier_tokens")
      .select("token")
      .eq("user_id", user.id)
      .eq("carrier_slug", mode)
      .maybeSingle();
    if (ct?.token) {
      const r = await deleteEcotrackOrder(mode, order.tracking_number, ct.token);
      if (!r.ok) warning = `Le bon ${mode} n'a peut-être pas été annulé côté transporteur — vérifiez dans votre espace.`;
    } else {
      warning = "Token transporteur introuvable — annulez le bon dans votre espace transporteur.";
    }
  } else if (mode === "yalidine") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("yalidine_api_id, yalidine_api_token")
      .eq("id", user.id)
      .single();
    if (profile?.yalidine_api_id && profile?.yalidine_api_token) {
      const r = await deleteYalidineParcel(order.tracking_number, {
        centerId: profile.yalidine_api_id,
        token: profile.yalidine_api_token,
      });
      if (!r.ok) warning = r.warning;
    } else {
      warning = "Annulation à faire dans l'espace Yalidine.";
    }
  }

  // 2) Rollback DB — TOUJOURS (même si le transporteur a échoué), pour permettre la re-sélection.
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ tracking_number: null, delivery_mode: null, status: "confirmed", updated_at: now })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur lors du rollback de la commande." }, { status: 500 });
  }

  // 3) Notifier l'acheteur (best-effort).
  try {
    const clientData = Array.isArray(order.client) ? order.client[0] : order.client;
    if (clientData?.phone) {
      await sendWhatsAppNotification(clientData.phone, "Le mode de livraison de votre commande a été modifié.");
    }
  } catch (err) {
    console.error("[cancel-carrier] buyer WA failed:", err);
  }

  return NextResponse.json({ ok: true, warning });
}
