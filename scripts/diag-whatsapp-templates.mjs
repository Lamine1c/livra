// Diagnostic READ-ONLY des templates WhatsApp approuvés sur Meta.
// N'imprime JAMAIS le token — uniquement nom/langue/statut/nb de paramètres.
//
// Usage (avec les creds prod en env) :
//   vercel env pull /tmp/p.env --environment=production --yes
//   node scripts/diag-whatsapp-templates.mjs /tmp/p.env
// ou, si les vars sont déjà exportées dans le shell :
//   node scripts/diag-whatsapp-templates.mjs
//
// But : confirmer pourquoi delivery_completed ne part pas. On compare sa
// structure Meta (nb de {{n}} distincts, language) à ce que le code envoie.
import { readFileSync } from "node:fs";

const GRAPH = "v23.0";

function loadEnvFile(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* pas de fichier → on lira process.env */
  }
  return out;
}

const fileEnv = process.argv[2] ? loadEnvFile(process.argv[2]) : {};
const env = { ...process.env, ...fileEnv };
const token = env.WHATSAPP_ACCESS_TOKEN;
const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
if (!token) {
  console.error("✗ WHATSAPP_ACCESS_TOKEN absent (passe un fichier .env en argument ou exporte-le).");
  process.exit(1);
}

const get = (p) =>
  fetch(`https://graph.facebook.com/${GRAPH}/${p}${p.includes("?") ? "&" : "?"}access_token=${token}`)
    .then((r) => r.json())
    .catch((e) => ({ error: { message: String(e) } }));

// Découverte du WABA : via le phone number id (le plus fiable).
let waba;
if (phoneId) {
  const pn = await get(`${phoneId}?fields=display_phone_number,whatsapp_business_account`);
  if (pn?.error) console.error("phone node:", pn.error.message);
  waba = pn?.whatsapp_business_account?.id;
}
if (!waba) {
  console.error("✗ WABA introuvable. Renseigne WHATSAPP_PHONE_NUMBER_ID (celui de prod) dans l'env.");
  process.exit(1);
}
console.log("WABA:", waba, "\n");

const NAMES = [
  "order_confirmation_request", // référence : marche
  "delivery_completed", // suspect
  "delivery_perso_enroute",
  "delivery_mode_perso",
  "delivery_mode_carrier",
  "delivery_failed",
];

for (const name of NAMES) {
  const res = await get(`${waba}/message_templates?name=${name}&fields=name,status,language,category,parameter_format,components`);
  const arr = res?.data || [];
  if (!arr.length) {
    console.log(`[${name}] introuvable ${res?.error ? "(" + res.error.message + ")" : ""}`);
    continue;
  }
  for (const t of arr) {
    const body = (t.components || []).find((c) => c.type === "BODY");
    const vars = [...new Set((body?.text || "").match(/\{\{[^}]+\}\}/g) || [])];
    const buttons = (t.components || []).find((c) => c.type === "BUTTONS")?.buttons?.length || 0;
    console.log(
      `[${t.name}] lang=${t.language} status=${t.status} fmt=${t.parameter_format || "n/a"} ` +
        `→ ${vars.length} param attendu(s) ${vars.join(" ")} · ${buttons} bouton(s)`
    );
  }
}
