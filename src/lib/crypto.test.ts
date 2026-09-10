import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { encryptToken, decryptToken, isEncrypted } from "./crypto.ts";

// Clé de test valide (32 octets = 64 hex). Posée avant tout usage — la lib lit
// process.env.META_TOKEN_KEY à chaque appel (jamais mise en cache).
const TEST_KEY = "0".repeat(64);
process.env.META_TOKEN_KEY = TEST_KEY;

const TOKEN = "EAAG_page_access_token_bidon_avec_des_+/=caractères";

test("a. roundtrip : decrypt(encrypt(t)) === t, et le format est enc:v1:", () => {
  const enc = encryptToken(TOKEN);
  assert.equal(enc.startsWith("enc:v1:"), true);
  assert.equal(isEncrypted(enc), true);
  // Le clair ne subsiste jamais dans la valeur stockée.
  assert.equal(enc.includes(TOKEN), false);
  assert.equal(decryptToken(enc), TOKEN);
});

test("a-bis. IV aléatoire : deux chiffrements du même token diffèrent, décryptent pareil", () => {
  const e1 = encryptToken(TOKEN);
  const e2 = encryptToken(TOKEN);
  assert.notEqual(e1, e2);
  assert.equal(decryptToken(e1), TOKEN);
  assert.equal(decryptToken(e2), TOKEN);
});

test("b. legacy passthrough : une valeur sans préfixe est retournée telle quelle", () => {
  const legacy = "EAAG_token_en_clair_legacy";
  assert.equal(isEncrypted(legacy), false);
  assert.equal(decryptToken(legacy), legacy);
});

test("c. tag falsifié → throw (GCM authentifié)", () => {
  const enc = encryptToken(TOKEN);
  const parts = enc.slice("enc:v1:".length).split(":");
  // Corrompt le tag (dernier segment).
  const badTag = Buffer.from(parts[2], "base64");
  badTag[0] ^= 0xff;
  const forged = `enc:v1:${parts[0]}:${parts[1]}:${badTag.toString("base64")}`;
  assert.throws(() => decryptToken(forged));
});

test("c-bis. ciphertext falsifié → throw", () => {
  const enc = encryptToken(TOKEN);
  const parts = enc.slice("enc:v1:".length).split(":");
  const badCt = Buffer.from(parts[1], "base64");
  badCt[0] ^= 0xff;
  const forged = `enc:v1:${parts[0]}:${badCt.toString("base64")}:${parts[2]}`;
  assert.throws(() => decryptToken(forged));
});

test("c-ter. structure chiffrée malformée (segments manquants) → throw", () => {
  assert.throws(() => decryptToken("enc:v1:onlyonepart"), /malformé/);
});

test("d. clé absente → throw explicite au chiffrement, jamais d'écriture en clair", () => {
  const saved = process.env.META_TOKEN_KEY;
  delete process.env.META_TOKEN_KEY;
  try {
    assert.throws(() => encryptToken(TOKEN), /META_TOKEN_KEY manquante/);
    // Déchiffrer un token chiffré sans clé → throw (pas de fallback en clair).
    // (on reconstruit un chiffré valide avec la clé pour tester le read sans clé)
  } finally {
    process.env.META_TOKEN_KEY = saved;
  }
});

test("d-bis. clé absente + valeur chiffrée → throw ; mais legacy passthrough reste OK", () => {
  const enc = encryptToken(TOKEN); // chiffré avec la clé présente
  const saved = process.env.META_TOKEN_KEY;
  delete process.env.META_TOKEN_KEY;
  try {
    assert.throws(() => decryptToken(enc), /META_TOKEN_KEY manquante/);
    // Un token legacy en clair ne réclame pas la clé → retourné tel quel.
    assert.equal(decryptToken("legacy_plain"), "legacy_plain");
  } finally {
    process.env.META_TOKEN_KEY = saved;
  }
});

test("e. clé de mauvaise longueur → throw invalide", () => {
  const saved = process.env.META_TOKEN_KEY;
  process.env.META_TOKEN_KEY = "abcd"; // 2 octets
  try {
    assert.throws(() => encryptToken(TOKEN), /invalide/);
  } finally {
    process.env.META_TOKEN_KEY = saved;
  }
});

test("f. clé différente → decrypt throw (pas de retour en clair silencieux)", () => {
  const enc = encryptToken(TOKEN);
  const saved = process.env.META_TOKEN_KEY;
  process.env.META_TOKEN_KEY = crypto.randomBytes(32).toString("hex");
  try {
    assert.throws(() => decryptToken(enc));
  } finally {
    process.env.META_TOKEN_KEY = saved;
  }
});
