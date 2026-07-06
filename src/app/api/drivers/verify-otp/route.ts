import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { generateDriverToken } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { whatsapp, otp, device_id } = body as {
    whatsapp?: string;
    otp?: string;
    device_id?: string;
  };

  // 1. Validation
  if (!whatsapp?.trim() || !otp?.trim() || !device_id?.trim()) {
    return NextResponse.json(
      { error: "Tous les champs sont requis (whatsapp, otp, device_id)" },
      { status: 400 }
    );
  }

  // 2. Normaliser le numéro
  const normalizedPhone = normalizePhoneNumber(whatsapp);

  const supabase = createServiceClient();

  // 3. Chercher le record non expiré
  const { data: record, error: fetchError } = await supabase
    .from("driver_otps")
    .select("id, prenom, wilaya, couleur_casque, device_id, otp_hash")
    .eq("whatsapp", normalizedPhone)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (fetchError) {
    console.error("[verify-otp] fetch error:", fetchError.message);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }

  // 4. Absent ou expiré
  if (!record) {
    return NextResponse.json(
      { error: "OTP invalide ou expiré" },
      { status: 401 }
    );
  }

  // 5. Recalculer le hash
  const computedHash = crypto
    .createHash("sha256")
    .update(otp.trim() + normalizedPhone)
    .digest("hex");

  // 6. Comparer (même longueur — SHA-256 hex = 64 chars toujours)
  if (computedHash !== record.otp_hash) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  // 8a. Supprimer le record (single-use)
  await supabase.from("driver_otps").delete().eq("id", record.id);

  // 8b. Écriture dans drivers — résolution d'identité AVANT d'écrire.
  // drivers a DEUX uniques : device_id (contrainte) ET idx_drivers_whatsapp (index unique).
  // whatsapp = identité stable du livreur ; device_id change (réinstall/nouveau tel).
  // Même whatsapp + nouveau device = même livreur qui a réinstallé → UPDATE de sa ligne.
  // Un seul onConflict ne peut pas couvrir les deux contraintes → on résout à la main.
  const now = new Date().toISOString();
  const driverFields = {
    prenom: record.prenom,
    whatsapp: normalizedPhone,
    couleur_casque: record.couleur_casque,
    wilaya: record.wilaya,
    device_id: record.device_id,
    whatsapp_verified: true,
    whatsapp_verified_at: now,
    last_scan_at: now,
  };

  // Chercher un livreur existant : par whatsapp (identité stable) d'abord, sinon par device_id.
  let existingId: string | null = null;
  const { data: byPhone } = await supabase
    .from("drivers")
    .select("id")
    .eq("whatsapp", normalizedPhone)
    .maybeSingle();
  if (byPhone?.id) {
    existingId = byPhone.id as string;
  } else {
    const { data: byDevice } = await supabase
      .from("drivers")
      .select("id")
      .eq("device_id", record.device_id)
      .maybeSingle();
    if (byDevice?.id) existingId = byDevice.id as string;
  }

  let driverId: string;
  if (existingId) {
    const { data: updated, error: updateError } = await supabase
      .from("drivers")
      .update(driverFields)
      .eq("id", existingId)
      .select("id")
      .single();
    if (updateError || !updated) {
      console.error("[verify-otp] driver update error:", updateError?.message);
      return NextResponse.json({ error: "Erreur enregistrement livreur." }, { status: 500 });
    }
    driverId = updated.id as string;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("drivers")
      .insert(driverFields)
      .select("id")
      .single();
    if (insertError || !inserted) {
      console.error("[verify-otp] driver insert error:", insertError?.message);
      return NextResponse.json({ error: "Erreur enregistrement livreur." }, { status: 500 });
    }
    driverId = inserted.id as string;
  }

  // 8c / 8d. Générer le device token signé 24h
  const deviceToken = generateDriverToken(driverId);

  // 8e. Retourner le résultat
  return NextResponse.json(
    { success: true, driverId, deviceToken },
    { status: 200 }
  );
}
