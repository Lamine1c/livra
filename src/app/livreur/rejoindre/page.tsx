export const dynamic = "force-dynamic";

import { Suspense } from "react";
import RejoindreClient from "./client";

// Page /livreur/rejoindre — canal de recrutement livreur (était 404 = canal mort).
// Patron : src/app/oauth/meta-callback. AUCUN formulaire web (inscription 100% in-app) :
// on rebondit vers l'app (livramobile://) + secours /telecharger. Ne touche NI la constante
// mobile NI la sentinelle scan.tsx — la page doit juste EXISTER à cette URL exacte.
export default function RejoindrePage() {
  return (
    <Suspense>
      <RejoindreClient />
    </Suspense>
  );
}
