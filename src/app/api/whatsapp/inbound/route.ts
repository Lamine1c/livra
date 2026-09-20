import { NextRequest, after } from "next/server";
import { verifyWebhookSignature } from "@/lib/meta";
import { handleInboundReply } from "@/lib/confirm-order";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasActiveBuyerOtp, handleDriverInboundRegistration, isKnownDriver } from "@/lib/driver-registration";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { WINBACK_YES_PAYLOAD, WINBACK_NO_PAYLOAD } from "@/lib/whatsapp-templates";

// Idempotence : "claim" un message id Meta (wamid). Retourne true si NOUVEAU
// (à traiter), false si déjà vu (doublon / retry Meta → ignorer). Fail-open sur
// une erreur infra (table absente, réseau) pour ne jamais perdre un vrai message.
async function claimInboundWamid(wamid: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("whatsapp_inbound_events").insert({ wamid });
    if (!error) return true; // insertion OK → première fois
    if (error.code === "23505") return false; // violation d'unicité → doublon
    console.error("[whatsapp/inbound] dedup indisponible, traitement quand même:", error.message);
    return true;
  } catch (err) {
    console.error("[whatsapp/inbound] dedup exception, traitement quand même:", err);
    return true;
  }
}

// [LOT1][A3] Libère un wamid claim : si handleInboundReply jette APRÈS le claim, on
// retire la marque de dédup pour que le RETRY Meta puisse retraiter le message. Sans
// ça, un hoquet DB de 2 s pendant un « OUI » = commande morte, invisible. L'erreur du
// DELETE est renvoyée pour être lue et loguée par l'appelant. (claimInboundWamid peut
// renvoyer true sans avoir inséré quand la dédup est indisponible → le DELETE ne
// supprime alors rien, sans conséquence.)
async function releaseInboundWamid(wamid: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_inbound_events").delete().eq("wamid", wamid);
  return { error };
}

// Webhook WhatsApp ENTRANT (réponses des clients) — WhatsApp Cloud API, Meta direct.
// Transport 100 % Meta : l'authenticité repose sur la signature HMAC
// X-Hub-Signature-256 (SHA256 du corps BRUT avec META_APP_SECRET).
// Retiré : bypass de test sandbox (dette signalée à l'audit du 8 juil) + piste
// 360dialog spéculative (Meta direct est le provider retenu).

// ─── GET : handshake de vérification du webhook ───────────────
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── Authenticité : signature Meta obligatoire ────────────────
// Logs granulaires pour diagnostiquer un 403 : header absent vs secret absent
// vs signature qui ne correspond pas (META_APP_SECRET ≠ app émettrice).
function isAuthentic(req: NextRequest, rawBody: Buffer): boolean {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    console.error("[whatsapp/inbound] refus : header X-Hub-Signature-256 absent");
    return false;
  }
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error("[whatsapp/inbound] refus : META_APP_SECRET non configuré");
    return false;
  }
  const ok = verifyWebhookSignature(rawBody, signature, secret);
  if (!ok) {
    console.error(
      "[whatsapp/inbound] refus : signature invalide " +
        "(META_APP_SECRET ne correspond pas à l'app qui possède le webhook ?)"
    );
  }
  return ok;
}

// ─── Parsing Cloud API — texte + réponses interactives ────────
type CloudMessage = {
  from?: string;
  id?: string; // wamid — identifiant unique du message (dédup des retries Meta)
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  button?: { payload?: string; text?: string };
};

type CloudInboundPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: { messages?: CloudMessage[] };
    }>;
  }>;
};

// Corps exploitable d'un message entrant :
//   - text        → text.body
//   - interactive → titre du bouton/liste choisi (button_reply / list_reply)
//   - button      → texte/payload d'un bouton quick-reply de template
// handleInboundReply matche ensuite ce corps (OUI / NON / objection / code) :
// la logique métier reste inchangée, on n'adapte que le TRANSPORT.
function messageBody(m: CloudMessage): string | null {
  if (m.type === "text") return m.text?.body ?? null;
  if (m.type === "interactive") {
    const it = m.interactive;
    if (it?.type === "button_reply") return it.button_reply?.title ?? it.button_reply?.id ?? null;
    if (it?.type === "list_reply") return it.list_reply?.title ?? it.list_reply?.id ?? null;
    return null;
  }
  if (m.type === "button") return m.button?.text ?? m.button?.payload ?? null;
  return null;
}

// [N38W] Payload de ROUTAGE d'une réponse à bouton (distinct du libellé affiché) : quick-reply de
// template → button.payload ; bouton interactif in-window → button_reply.id. Sert à isoler les
// réponses à l'offre winback (WINBACK_*) AVANT le tunnel OUI/NON. null si le message n'a pas de payload.
function messagePayload(m: CloudMessage): string | null {
  if (m.type === "button") return m.button?.payload ?? null;
  if (m.type === "interactive" && m.interactive?.type === "button_reply") {
    return m.interactive.button_reply?.id ?? null;
  }
  return null;
}

function extractMessages(
  payload: CloudInboundPayload
): Array<{ from: string; body: string; wamid: string | null; payload: string | null }> {
  const out: Array<{ from: string; body: string; wamid: string | null; payload: string | null }> = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const body = messageBody(m);
        if (m.from && body) out.push({ from: m.from, body, wamid: m.id ?? null, payload: messagePayload(m) });
      }
    }
  }
  return out;
}

// ─── POST : messages entrants ─────────────────────────────────
// RÈGLE ANTI-RETRY : Meta re-livre le webhook s'il ne reçoit pas un 200 RAPIDE.
// Notre traitement (DB + envois Graph) prend plusieurs secondes → il ne doit PAS
// bloquer la réponse. On valide la signature (rapide), on ACK 200 immédiatement,
// puis on traite APRÈS la réponse via after() (Vercel garde la fonction vivante).
// Couplé au dédup wamid, un retry résiduel est de toute façon ignoré.
export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  // Corps BRUT lu AVANT tout parsing (nécessaire à la vérification de signature).
  const rawBody = Buffer.from(await req.arrayBuffer());

  if (!isAuthentic(req, rawBody)) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: CloudInboundPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    console.error("[whatsapp/inbound] payload JSON invalide");
    return new Response("OK", { status: 200 });
  }

  const messages = extractMessages(payload);

  // Traitement DÉPORTÉ après la réponse. Le Realtime vendeur est déjà branché →
  // l'écran passe à « Confirmée » seul quand l'order est mis à jour.
  after(async () => {
    const supabase = createAdminClient();
    for (const m of messages) {
      try {
        // Dédup : ignore un message déjà traité (retry Meta / double livraison).
        if (m.wamid) {
          const fresh = await claimInboundWamid(m.wamid);
          if (!fresh) {
            console.log(`[whatsapp/inbound] wamid ${m.wamid} déjà traité → ignoré (doublon/retry Meta)`);
            continue;
          }
        }

        // [N38W] Réponse à l'OFFRE WINBACK : payload DISTINCT (WINBACK_*) → routage dédié AVANT le
        // tunnel OUI/NON (sinon « إيه نأكد »/« لا شكرا » seraient avalés par YES_RE/NO_RE, cf. RAPPORT
        // N36W pt 4). No-op JOURNALISÉ pour l'instant : AUCUNE logique de relance dans ce lot ; pas de
        // colonne winback_replied_at (pas de migration) → log seul. Le tunnel classique est intact pour
        // TOUT message sans payload winback (la grande majorité : texte, OTP, OUI/NON sans payload).
        if (m.payload === WINBACK_YES_PAYLOAD || m.payload === WINBACK_NO_PAYLOAD) {
          const response = m.payload === WINBACK_YES_PAYLOAD ? "yes" : "no";
          const masked = `${m.from.slice(0, 5)}…${m.from.slice(-2)}`;
          // orderId best-effort (la commande winbackée la plus récente de ce numéro). Guardé : si la
          // colonne winback_sent_at n'existe pas (migration 045 non appliquée), la requête n'aboutit
          // pas → orderId reste "?", sans casser le traitement.
          let orderId = "?";
          const norm = normalizePhoneNumber(m.from);
          const { data: clientRows } = await supabase.from("clients").select("id").eq("phone_normalized", norm);
          const clientIds = (clientRows ?? []).map((c) => c.id as string);
          if (clientIds.length > 0) {
            const { data: ord } = await supabase
              .from("orders")
              .select("id")
              .in("client_id", clientIds)
              .not("winback_sent_at", "is", null)
              .order("winback_sent_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (ord?.id) orderId = ord.id as string;
          }
          console.log(`[whatsapp/inbound] winback_reply_received from=${masked} response=${response} orderId=${orderId}`);
          continue; // le tunnel classique NE voit jamais cette réponse
        }

        // N6 · WAME-INVERSE — préséance (décision Claudy) : un OTP ACHETEUR actif pour ce numéro
        // gagne toujours (tunnel acheteur). Sinon on tente la branche INSCRIPTION LIVREUR (message
        // « LIVRA <token> » → envoi du code). handled=true → traité côté livreur, on NE retombe PAS
        // sur l'acheteur. handled=false → aucune inscription en attente → tunnel acheteur (no_pending
        // géré là). N'ajoute aucune latence webhook (tout est déjà dans after()).
        if (!(await hasActiveBuyerOtp(supabase, m.from))) {
          const reg = await handleDriverInboundRegistration(supabase, m.from, m.body);
          if (reg.handled) continue;

          // [N27W.1] « Le numéro entrant fait foi » : si l'expéditeur est un LIVREUR VÉRIFIÉ (table
          // drivers) qui n'a NI OTP acheteur actif NI inscription en attente, son message ne doit
          // JAMAIS tomber dans le tunnel ACHETEUR (il y recevrait un template destiné aux clients).
          // On le consomme (log, pas de template acheteur). Aucun impact sur le NON-livreur (ci-dessous
          // inchangé) ni sur le livreur-aussi-acheteur (préséance OTP ci-dessus le renvoie au tunnel).
          if (await isKnownDriver(supabase, m.from)) {
            console.log(`[whatsapp/inbound] expéditeur = livreur vérifié → hors tunnel acheteur (message ignoré)`);
            continue;
          }
        }

        const res = await handleInboundReply(m.from, m.body);
        // [LOT1][A3bis] handleInboundReply ne JETTE presque jamais : un échec DB de la
        // confirmation est RETOURNÉ (reason "db_error"), pas lancé → le catch A3 ne le
        // voit pas. Sans libération, le wamid reste consommé alors que l'UPDATE de
        // confirmation a échoué → retry Meta dédupliqué → code de l'acheteur perdu.
        // On libère sur db_error UNIQUEMENT (wrong_code / no_pending = traitements
        // RÉUSSIS : leur dédup doit tenir, sinon on renverrait le message en boucle).
        if (
          m.wamid &&
          res.action === "code" &&
          res.result.matched === false &&
          res.result.reason === "db_error"
        ) {
          const { error: relErr } = await releaseInboundWamid(m.wamid);
          if (relErr) console.error("[LOT1][A3bis] release wamid (db_error) échoué (message perdu):", m.wamid, relErr.message);
        }
      } catch (err) {
        // Pas de catch muet : on logge. [LOT1][A3] Le claim est POSÉ avant le
        // traitement (protège du double envoi d'OTP concurrent) → on le LIBÈRE ici
        // pour que le retry Meta repasse le message au lieu de le perdre à jamais.
        console.error("[LOT1][A3] erreur traitement message:", err);
        if (m.wamid) {
          const { error: relErr } = await releaseInboundWamid(m.wamid);
          if (relErr) console.error("[LOT1][A3] release wamid échoué (message perdu):", m.wamid, relErr.message);
        }
      }
    }
  });

  // ACK 200 immédiat + mesure du temps de réponse (doit être quelques ms).
  console.log(
    `[whatsapp/inbound] ACK 200 en ${Date.now() - startedAt}ms · ${messages.length} message(s) → traitement async`
  );
  return new Response("OK", { status: 200 });
}
