import type { Breadcrumb, Event } from "@sentry/nextjs";

// [PII] Allowlist STRICTE des request headers conservés (JAMAIS une denylist : elle
// raterait le prochain header sensible que Vercel ajoutera). Tout le reste est supprimé.
// Fuite trouvée au gate : X-Vercel-Ip-Latitude/Longitude/City/Postal (géoloc du requêteur)
// + X-Vercel-Oidc-Token (credential) partaient chez Sentry via request.headers.
const HEADER_ALLOWLIST = new Set(["content-type", "content-length", "x-vercel-id"]);

// ─────────────────────────────────────────────────────────────────────────────
// SCRUB PII — retire TOUTE query string de TOUTE URL avant envoi à Sentry (tiers).
// Les tokens du produit circulent en query string (`?t=<qr_token>&d=<deviceId>`,
// `?t=<buyerToken>`, `?t=<locateToken>`, `?t=<billing token>`). On strip la query
// ENTIÈRE (pas une liste de paramètres) pour couvrir l'existant ET le futur.
// Appliqué dans les 3 hooks : beforeBreadcrumb, beforeSend, beforeSendTransaction.
// ─────────────────────────────────────────────────────────────────────────────

/** Retire tout ce qui suit `?` d'une URL (relative ou absolue). Ne throw jamais. */
export function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

// Retire la query string de toute URL trouvée DANS un texte libre (message de log
// capturé via captureConsole, valeur d'exception). Couvre URLs absolues + relatives.
const URL_WITH_QUERY = /((?:https?:\/\/|\/)[^\s"'`<>()]+?)\?[^\s"'`<>()]*/g;
function stripQueryInText(text: string): string {
  return text.replace(URL_WITH_QUERY, "$1");
}

// Retire les query strings dans un tableau d'arguments console (mutation en place).
function scrubArgs(args: unknown): void {
  if (!Array.isArray(args)) return;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (typeof a === "string") args[i] = stripQueryInText(a);
  }
}

/** Breadcrumb réseau (fetch/xhr → data.url + http.query séparée), navigation (data.from/to),
 *  ou console (message + data.arguments bruts via captureConsole). */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (typeof breadcrumb.message === "string") breadcrumb.message = stripQueryInText(breadcrumb.message);
  const d = breadcrumb.data;
  if (d) {
    const url = d.url;
    if (typeof url === "string") d.url = stripQuery(url);
    const from = d.from;
    if (typeof from === "string") d.from = stripQuery(from);
    const to = d.to;
    if (typeof to === "string") d.to = stripQuery(to);
    // Sentry range la query dans un champ DÉDIÉ (http.query = "?…"), pas dans data.url → on la retire.
    delete d["http.query"];
    scrubArgs(d.arguments); // args bruts d'un breadcrumb console
  }
  return breadcrumb;
}

// Valeur string porteuse d'URL/chemin → on retire la query. Deux cas :
//  - query string NUE ("?a=b&t=…", ex. champ http.query) → on la vide ;
//  - URL/chemin AVEC query ("/api/scan?t=…", "https://…?x=…", ex. http.target/url) → on strippe.
// stripQueryInText ne matche QUE des sous-chaînes qui SONT des URLs/chemins → sûr sur du texte libre.
function scrubUrlString(s: string): string {
  if (s.length > 0 && s[0] === "?") return "";
  return stripQueryInText(s);
}

// Clés OTEL à SUPPRIMER partout : le SDK recopie le MIROIR COMPLET des request headers
// dans contexts.trace.data et spans[].data (géo X-Vercel-Ip-*, IP réelle x-real-ip /
// x-forwarded-for / x-vercel-proxied-for, cookie._vercel_jwt, OIDC…) + les query nues.
const DROP_KEY = /(^|\.)http\.(request|response)\.header\.|(^|\.)http\.query$/i;

// Scrub RÉCURSIF, VOLONTAIREMENT SANS allowlist de noms de champs. Raison : le SDK OTEL
// invente de nouveaux champs porteurs d'URL/headers à chaque version — on a déjà découvert
// la fuite dans request.url, puis http.query, puis http.target, puis le miroir complet des
// headers dans contexts.trace.data. Une liste de noms serait périmée à la prochaine montée
// du SDK. On strippe donc TOUTE query d'URL où qu'elle soit, et on DROPPE le miroir OTEL
// des request headers (redondant avec request.headers déjà en allowlist, et il refuit
// géo/IP/cookie/OIDC par un autre chemin).
function deepScrub(node: unknown, depth: number): void {
  if (node === null || typeof node !== "object" || depth > 12) return;
  if (Array.isArray(node)) {
    const arr = node as unknown[];
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (typeof v === "string") arr[i] = scrubUrlString(v);
      else deepScrub(v, depth + 1);
    }
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (DROP_KEY.test(k)) { delete obj[k]; continue; }
    const v = obj[k];
    if (typeof v === "string") obj[k] = scrubUrlString(v);
    else deepScrub(v, depth + 1);
  }
}

/**
 * Scrub complet d'un event (erreur OU transaction) avant envoi au tiers.
 *   1. Removals structurels : allowlist request.headers · purge corps/cookies/query_string/user.
 *   2. deepScrub RÉCURSIF : query strings dans toute URL + drop du miroir OTEL des headers.
 */
export function scrubEvent<T extends Event>(event: T): T {
  // [PII] request : allowlist stricte des headers + suppression du corps, des cookies,
  // de la query_string, ET de l'objet user (Sentry y colle une géo dérivée de l'IP de la
  // connexion d'ingest — côté navigateur = la vraie ville de l'utilisateur).
  if (event.request) {
    const r = event.request;
    delete r.query_string;
    delete r.data;
    delete r.cookies;
    if (r.headers) {
      const filtered: Record<string, string> = {};
      for (const k of Object.keys(r.headers)) {
        if (HEADER_ALLOWLIST.has(k.toLowerCase())) filtered[k] = r.headers[k];
      }
      r.headers = filtered;
    }
  }
  delete event.user;
  deepScrub(event, 0);
  return event;
}
