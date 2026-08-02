import type { Breadcrumb, Event } from "@sentry/nextjs";

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

/** Breadcrumb réseau (fetch/xhr → data.url) ou navigation (data.from/to). */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const d = breadcrumb.data;
  if (d) {
    const url = d.url;
    if (typeof url === "string") d.url = stripQuery(url);
    const from = d.from;
    if (typeof from === "string") d.from = stripQuery(from);
    const to = d.to;
    if (typeof to === "string") d.to = stripQuery(to);
  }
  return breadcrumb;
}

/**
 * Scrub complet d'un event (erreur OU transaction) :
 *   - request.url + suppression de query_string
 *   - nom de transaction (le SDK y met souvent l'URL complète)
 *   - message / logentry / valeurs d'exception (captureConsole capte les lignes de log)
 *   - breadcrumbs embarqués + spans (http.client porte l'URL complète)
 */
export function scrubEvent<T extends Event>(event: T): T {
  if (event.request) {
    if (typeof event.request.url === "string") event.request.url = stripQuery(event.request.url);
    delete event.request.query_string;
  }
  if (typeof event.transaction === "string") event.transaction = stripQuery(event.transaction);
  if (typeof event.message === "string") event.message = stripQueryInText(event.message);
  if (event.logentry && typeof event.logentry.message === "string") {
    event.logentry.message = stripQueryInText(event.logentry.message);
  }
  event.exception?.values?.forEach((ex) => {
    if (typeof ex.value === "string") ex.value = stripQueryInText(ex.value);
  });
  event.breadcrumbs?.forEach(scrubBreadcrumb);
  event.spans?.forEach((span) => {
    if (typeof span.description === "string") span.description = stripQuery(span.description);
    const data = span.data;
    if (data) {
      const url = data.url;
      if (typeof url === "string") data.url = stripQuery(url);
      const httpUrl = data["http.url"];
      if (typeof httpUrl === "string") data["http.url"] = stripQuery(httpUrl);
      delete data["http.query"];
    }
  });
  return event;
}
