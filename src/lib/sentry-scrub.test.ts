import { test } from "node:test";
import assert from "node:assert/strict";
import { scrubEvent } from "./sentry-scrub.ts";

// Fixture = la VRAIE forme qui fuyait au gate prod (Vercel + attributs OTEL de Next) :
// géo/IP/cookie/OIDC en request.headers, LE MÊME miroir en contexts.trace.data et spans[].data,
// query dans request.url / http.target, user avec ip_address + geo.
function fixture() {
  return {
    message: "opération échouée — pourquoi ? réessayer", // texte libre avec « ? » (non-régression)
    request: {
      url: "https://golivra.app/api/scan?t=SECRET_TOKEN&d=DEVICE_BIDON",
      query_string: "t=SECRET_TOKEN&d=DEVICE_BIDON",
      cookies: { _vercel_jwt: "eyJCOOKIE" },
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 ZTE",
        "x-vercel-ip-country": "DZ",
        "x-vercel-ip-country-region": "16",
        "x-vercel-ip-city": "Algiers",
        "x-vercel-ip-latitude": "36.7405",
        "x-vercel-ip-longitude": "3.1159",
        "x-forwarded-for": "154.252.248.122",
        cookie: "_vercel_jwt=eyJCOOKIE",
        authorization: "Bearer SECRETKEY",
        "x-vercel-oidc-token": "eyJOIDCTOKEN",
      },
    },
    contexts: {
      trace: {
        data: {
          "http.route": "/api/scan",
          "http.target": "/api/scan?t=SECRET_TOKEN&d=DEVICE_BIDON",
          "http.request.header.x_vercel_ip_country": "DZ",
          "http.request.header.x_vercel_ip_city": "Algiers",
          "http.request.header.x_vercel_ip_latitude": "36.7405",
          "http.request.header.x_vercel_ip_longitude": "3.1159",
          "http.request.header.x_forwarded_for": "154.252.248.122",
          "http.request.header.cookie._vercel_jwt": "eyJCOOKIE",
          "http.request.header.authorization": "Bearer SECRETKEY",
          "http.request.header.x_vercel_oidc_token": "eyJOIDCTOKEN",
        },
      },
    },
    spans: [
      {
        description: "GET https://golivra.app/api/track?t=BUYERTOKEN",
        data: {
          "http.target": "/api/track?t=BUYERTOKEN",
          url: "https://golivra.app/api/track?t=BUYERTOKEN",
          "http.request.header.x_vercel_ip_city": "Algiers",
        },
      },
      {
        // span PROPRE — non-régression : doit passer INTACT (aucune query, aucun header géo)
        description: "db.query",
        data: { "db.system": "postgresql", url: "https://x.supabase.co/rest/v1/orders" },
      },
    ],
    user: {
      ip_address: "154.252.248.122",
      geo: { country_code: "DZ", region: "Algeria", city: "Algiers" },
    },
  };
}

// Chaînes qui NE DOIVENT JAMAIS subsister après scrub (géo, IP réelle, cookie, OIDC, tokens de query).
const FORBIDDEN = [
  "Algiers", "Algeria", "36.7405", "3.1159", "154.252.248.122",
  "_vercel_jwt", "eyJCOOKIE", "eyJOIDCTOKEN", "SECRETKEY",
  "SECRET_TOKEN", "DEVICE_BIDON", "BUYERTOKEN",
  "http.request.header", "x-vercel-ip", "x-vercel-oidc",
];

test("a. aucune géo/IP/cookie/OIDC ne subsiste (headers, trace.data, spans, user)", () => {
  const raw = JSON.stringify(scrubEvent(fixture()));
  for (const s of FORBIDDEN) {
    assert.equal(raw.includes(s), false, `« ${s} » ne devrait plus être présent`);
  }
});

test("a-bis. event.user entier supprimé (ip_address + geo)", () => {
  assert.equal(scrubEvent(fixture()).user, undefined);
});

test("b. request.headers = allowlist seule (content-type reste, user-agent part)", () => {
  const h = scrubEvent(fixture()).request.headers;
  assert.deepEqual(Object.keys(h), ["content-type"]);
  assert.equal(h["content-type"], "application/json");
  assert.equal(h["user-agent"], undefined);
  assert.equal(h["x-vercel-ip-city"], undefined);
});

test("b-bis. query strippée (request.url / http.target) + miroir OTEL headers droppé", () => {
  const e = scrubEvent(fixture());
  assert.equal(e.request.url, "https://golivra.app/api/scan");
  assert.equal(e.request.query_string, undefined);
  assert.equal(e.contexts.trace.data["http.target"], "/api/scan");
  assert.equal(e.contexts.trace.data["http.route"], "/api/scan"); // sans query → intact
  assert.equal("http.request.header.x_vercel_ip_city" in e.contexts.trace.data, false);
});

test("c. non-régression : url sans query intacte, span propre intact, message « ? » intact", () => {
  const e = scrubEvent(fixture());
  const clean = e.spans[1];
  assert.equal(clean.data.url, "https://x.supabase.co/rest/v1/orders"); // pas de query → inchangé
  assert.equal(clean.data["db.system"], "postgresql");
  assert.equal(clean.description, "db.query");
  assert.equal(e.message, "opération échouée — pourquoi ? réessayer"); // « ? » de ponctuation préservé
});

test("d. idempotence : scrubEvent(scrubEvent(e)) === scrubEvent(e)", () => {
  const once = scrubEvent(fixture());
  const twice = scrubEvent(scrubEvent(fixture()));
  assert.deepEqual(twice, once);
});
