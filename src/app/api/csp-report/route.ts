import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// [N17] Endpoint de COLLECTE des violations CSP. La CSP est en Report-Only (next.config.ts) :
// le navigateur POST ici chaque violation → on la logge (structuré, SANS PII) → 204. Additif pur,
// aucun impact sur le rendu. Ferme la dette N10 (Report-Only sans collecteur).
//
// ⚠️ ANTI-PII : un rapport CSP contient `document-uri`/`blocked-uri`. Or les liens acheteur/livreur
// portent un token en query (`/track?t=…`, `/locate?t=…`, `/scan?t=…`). On STRIPPE donc la query
// string de toute URI avant de logger, et on ne garde que les champs de diagnostic (directive, hôte).
export const runtime = "nodejs";

function stripQuery(u: unknown): string | undefined {
  if (typeof u !== "string" || !u) return undefined;
  const q = u.indexOf("?");
  const h = u.indexOf("#");
  const cut = Math.min(q === -1 ? u.length : q, h === -1 ? u.length : h);
  return u.slice(0, cut);
}

export async function POST(req: NextRequest) {
  // Rate-limit léger par IP : une seule page peut émettre plusieurs violations → on borne le bruit.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`csp-report:${ip}`, 60, 60_000)) {
    return new NextResponse(null, { status: 204 });
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    // Corps illisible / vide → on ignore proprement (le navigateur n'attend pas de corps).
    return new NextResponse(null, { status: 204 });
  }

  // Format legacy report-uri : { "csp-report": {...} }. Format report-to : tableau d'objets.
  const reports: unknown[] = Array.isArray(payload)
    ? payload
    : [(payload as { "csp-report"?: unknown })?.["csp-report"] ?? payload];

  for (const r of reports) {
    const v = (r && typeof r === "object" ? (r as Record<string, unknown>) : {}) as Record<string, unknown>;
    // report-to imbrique la violation dans `body`.
    const b = (v.body && typeof v.body === "object" ? (v.body as Record<string, unknown>) : v) as Record<string, unknown>;
    const safe = {
      documentUri: stripQuery(b["document-uri"] ?? b["documentURL"]),
      directive: b["violated-directive"] ?? b["effective-directive"] ?? b["effectiveDirective"],
      blockedUri: stripQuery(b["blocked-uri"] ?? b["blockedURL"]),
      disposition: b["disposition"],
    };
    if (safe.documentUri || safe.directive || safe.blockedUri) {
      console.warn("[csp-report]", JSON.stringify(safe));
    }
  }

  return new NextResponse(null, { status: 204 });
}
