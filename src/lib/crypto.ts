import crypto from "node:crypto";

// Chiffrement au repos des tokens Meta (system-user `Never` → aucune rotation
// automatique, le chiffrement est non négociable). AES-256-GCM authentifié.
//
// Format stocké (même colonne TEXTE, pas de migration de schéma) :
//   "enc:v1:" + base64(iv) + ":" + base64(ciphertext) + ":" + base64(tag)
//
// Migration LAZY : une valeur sans le préfixe `enc:v1:` est un token legacy en
// clair → `decryptToken` la retourne telle quelle. On ne suppose donc jamais que
// tout est déjà chiffré ; les écritures, elles, chiffrent toujours.

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // nonce standard GCM

// Clé lue à CHAQUE usage (jamais mise en cache au module-level) : sinon un import
// au build time — sans env var — planterait le build. Absente → throw explicite,
// JAMAIS de fallback silencieux en clair à l'écriture.
function getKey(): Buffer {
  const hex = process.env.META_TOKEN_KEY;
  if (!hex) throw new Error("META_TOKEN_KEY manquante");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("META_TOKEN_KEY invalide (attendu 64 caractères hex = 32 octets)");
  }
  return key;
}

/** Vrai si la valeur stockée est déjà chiffrée (préfixe `enc:v1:`). */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/** Chiffre un token en clair. Clé absente → throw (jamais d'écriture en clair). */
export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${ciphertext.toString("base64")}:${tag.toString("base64")}`;
}

/**
 * Déchiffre une valeur stockée.
 * - Préfixe `enc:v1:` → déchiffre (clé absente → throw ; tag falsifié → throw).
 * - Sinon (legacy en clair) → retourne la valeur telle quelle (migration lazy).
 * Aucun message d'erreur ne contient jamais le token (clair ou chiffré).
 */
export function decryptToken(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const key = getKey();
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Token chiffré malformé");
  const [ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
