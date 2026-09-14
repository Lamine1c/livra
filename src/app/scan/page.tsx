export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ScanClient from "./client";

// Page /scan — aperçu d'une commande scannée (QR livreur), SANS PII + deep link.
// CONTRAT (src/app/api/scan/route.ts en-tête) : cette page n'appelle JAMAIS /api/scan côté
// serveur — /api/scan exige un driver résolu via `d` (deviceId) et ne sort de PII qu'à lui.
// Ici on ne montre AUCUNE donnée de commande : juste un relais vers l'app (qui, elle, scanne
// avec le deviceId). Patron : oauth/meta-callback.
export default function ScanPage() {
  return (
    <Suspense>
      <ScanClient />
    </Suspense>
  );
}
