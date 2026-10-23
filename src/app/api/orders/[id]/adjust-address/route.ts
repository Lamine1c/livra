import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";

// POST /api/orders/[id]/adjust-address — [G8W-S3] corriger l'adresse de livraison de CETTE commande
// (« livre chez la sœur »), SANS réécrire le client partagé. Écrit un SNAPSHOT sur orders.ship_*
// (migration 050) ; la lecture (helper orderDeliveryAddress) prend le snapshot sinon le client.
// Auth : JWT vendeur + ownership.
//
// ⚠️ TÉLÉPHONE EXCLU (STOP G8W ④) : le routage WhatsApp entrant retrouve le client via
// clients.phone_normalized → snapshoter le tél casserait la reconnaissance de l'acheteur. Adresse seule.
// BORNE : pré-expédition ET aucune étiquette générée (tracking_number / qr_token) — sinon un colis
// partirait à la mauvaise adresse avec un bon qui dit le contraire. Pas de notif acheteur (il connaît
// SA nouvelle adresse — c'est lui qui l'a donnée). Tant que 050 n'est pas appliquée → 503 propre.

export const dynamic = "force-dynamic";

const PRE_SHIP_STATUSES = ["pending", "pending_confirmation", "confirmed", "processing"];

const bodySchema = z
  .object({
    wilaya: z.string().trim().min(1).max(100).optional(),
    commune: z.string().trim().min(1).max(150).optional(),
    address: z.string().trim().max(300).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((b) => b.wilaya != null || b.commune != null || b.address != null, {
    message: "au moins un champ (wilaya/commune/address) requis",
  });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, status, tracking_number, qr_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const status = order.status as string | null;
  if (status == null || !PRE_SHIP_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, reason: "shipped_locked", status }, { status: 409 });
  }
  if (order.tracking_number != null || order.qr_token != null) {
    return NextResponse.json({ ok: false, reason: "label_generated" }, { status: 409 });
  }

  // On n'écrit QUE les champs fournis (les autres restent → repli client par champ).
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.wilaya != null) updateFields.ship_wilaya = parsed.wilaya;
  if (parsed.commune != null) updateFields.ship_commune = parsed.commune;
  if (parsed.address != null) updateFields.ship_address = parsed.address;

  // UPDATE atomique BORNÉ (re-gardé contre expédition / étiquette concurrente).
  const { data: rows, error: updErr } = await supabase
    .from("orders")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", PRE_SHIP_STATUSES)
    .is("tracking_number", null)
    .is("qr_token", null)
    .select("id");

  if (updErr) {
    if (/42703|PGRST204|column .* does not exist|Could not find the .* column/i.test(`${updErr.code ?? ""} ${updErr.message ?? ""}`)) {
      return NextResponse.json({ error: "Fonction indisponible (migration 050 non appliquée)" }, { status: 503 });
    }
    console.error("[orders/adjust-address] update échouée:", updErr.message);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: false, reason: "shipped_locked" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, ship_wilaya: parsed.wilaya ?? null, ship_commune: parsed.commune ?? null, ship_address: parsed.address ?? null });
}
