export const dynamic = "force-dynamic";

import { Suspense } from "react";
import MetaCallbackClient from "./client";

export default function MetaCallbackPage() {
  return (
    <Suspense>
      <MetaCallbackClient />
    </Suspense>
  );
}
