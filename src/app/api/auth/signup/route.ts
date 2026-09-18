import { NextResponse } from "next/server";

// [N35W.2 — 18 sept 2026 · GO 18SEPT-2315-W] ROUTE NEUTRALISÉE (404).
// Le tunnel signup email → OTP → mot de passe est retiré (le front = waitlist, cf. SignupModal.tsx:9 :
// « routes /api/auth/* conservées, mais plus appelées côté front »).
// Dormance CONFIRMÉE des deux côtés avant neutralisation :
//   · web  : grep exhaustif src/content → 0 appelant (cc, tour N35W).
//   · mobile : grep ~/livra-mobile → 0 occurrence de api/auth/set-password/signup/verify-otp ; le mobile
//     s'authentifie EN DIRECT via Supabase (lib/supabase.ts) — il n'appelle jamais le web pour l'auth (Claudy, N35W.2).
// Conservée en 404 explicite (plutôt que supprimée) pour tracer la décision ; réactivation = restaurer depuis git.
// Effet de bord voulu : l'OTP vendeur-email plaintext (table otp_codes) meurt ici — plus aucun chemin ne l'émet/vérifie.
const GONE = () => NextResponse.json({ error: "Endpoint retiré" }, { status: 404 });

export const POST = GONE;
export const GET = GONE;
export const OPTIONS = GONE;
