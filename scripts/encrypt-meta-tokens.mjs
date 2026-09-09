#!/usr/bin/env node
// One-shot : chiffre au repos tous les tokens Meta legacy (en clair) des deux
// tables `meta_connections.access_token` et `meta_page_subscriptions.page_access_token`.
// Idempotent : une valeur déjà chiffrée (préfixe `enc:v1:`) est laissée intacte.
//
// Usage :
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... META_TOKEN_KEY=<64 hex> \
//     node scripts/encrypt-meta-tokens.mjs
//
// La ré-encryption lazy (webhook) migre déjà les tokens de page au fil de l'eau ;
// ce script couvre le reste (connexions + pages jamais re-déclenchées).
// ⚠️ Ne jamais logger un token (clair ou chiffré).

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function getKey() {
  const hex = process.env.META_TOKEN_KEY;
  if (!hex) fail("META_TOKEN_KEY manquante");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) fail("META_TOKEN_KEY invalide (attendu 64 caractères hex = 32 octets)");
  return key;
}

function isEncrypted(v) {
  return typeof v === "string" && v.startsWith(PREFIX);
}

function encryptToken(plain, key) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${ciphertext.toString("base64")}:${tag.toString("base64")}`;
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) fail("SUPABASE_URL manquante");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY manquante");

const key = getKey();
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function migrate(table, tokenCol) {
  const { data, error } = await db.from(table).select(`id, ${tokenCol}`);
  if (error) fail(`[${table}] lecture échouée : ${error.message}`);

  let encrypted = 0;
  let already = 0;
  let empty = 0;

  for (const row of data ?? []) {
    const val = row[tokenCol];
    if (!val) {
      empty++;
      continue;
    }
    if (isEncrypted(val)) {
      already++;
      continue;
    }
    const { error: upErr } = await db
      .from(table)
      .update({ [tokenCol]: encryptToken(val, key) })
      .eq("id", row.id);
    if (upErr) fail(`[${table}] update ${row.id} échoué : ${upErr.message}`);
    encrypted++;
  }

  console.log(`[${table}] chiffrées : ${encrypted} · déjà chiffrées : ${already} · vides : ${empty}`);
}

await migrate("meta_connections", "access_token");
await migrate("meta_page_subscriptions", "page_access_token");
console.log("Terminé.");
