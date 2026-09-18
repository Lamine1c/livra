import { NextResponse } from "next/server";

// [N35W.2 — 18 sept 2026 · GO 18SEPT-2315-W] ROUTE NEUTRALISÉE (404).
// Étape 3 du tunnel signup email → OTP → mot de passe, retiré (front = waitlist, cf. SignupModal.tsx:9).
// Dormance confirmée : 0 appelant web (grep cc) + 0 appelant mobile (grep ~/livra-mobile ; le mobile
// s'auth en DIRECT via Supabase, jamais via /api/auth/*). Détails : tasks/RAPPORT.md (N35W / N35W.2).
// Conservée en 404 explicite pour tracer la décision ; réactivation = restaurer depuis git.
const GONE = () => NextResponse.json({ error: "Endpoint retiré" }, { status: 404 });

export const POST = GONE;
export const GET = GONE;
export const OPTIONS = GONE;
