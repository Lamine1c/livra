// ─── TEMPLATES WHATSAPP V1 — BILINGUE AR+FR (format Meta Cloud API) ──
// SOURCE DE VÉRITÉ : ~/livra/LIVRA_MARKETING.md
//   section "📨 SCRIPT BOT WhatsApp V1 — BILINGUE AR+FR".
// Règles inviolables (cf. LIVRA_MARKETING.md) :
//   - L'arabe (darija) vient TOUJOURS en premier, FR après le séparateur ━━━.
//   - Header "message en français suit" en haut (jamais d'arabe en header, pas de drapeau).
//   - Jamais "livreur LIVRA" / "notre livreur" → toujours "le livreur de {{boutique}}".
//   - Variables Meta = {{1}}, {{2}}… dans l'ordre d'apparition dans le corps.
// NE PAS retoucher / traduire la darija : copie verbatim de la source.
//
// 🔴 [N12-3] DIVERGENCE CODE ↔ META — LIRE. Ces `body` bilingues servent au rendu TEXTE-LIBRE
// in-window (renderTemplateText). Les templates SOUMIS à Meta (16 sept) sont MONOLINGUES (Meta
// rejette les corps bilingues) et plusieurs ont été REFORMULÉS à la soumission (anti-classifieur) :
// le corps qui part hors fenêtre = celui stocké CHEZ META, PAS celui ci-dessous. `buildTemplatePayload`
// n'envoie que les variables {{n}} + le `name`/`language` → le texte ci-dessous n'est jamais transmis
// en mode template. État final des soumissions (langues/catégorie/divergences) : tasks/TEMPLATES_A_SOUMETTRE.md.

export type WhatsAppTemplate = {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  body: string;
  // `id` = payload stable (retourné par Meta au clic, sert au routage inbound) ;
  // `text` = libellé darija ≤20 chars (limite Meta quick-reply / bouton interactif).
  buttons?: Array<{ type: "QUICK_REPLY"; text: string; id?: string }>;
  variables: string[]; // libellés humains, ordre = {{1}}, {{2}}…
};

const SEP = "━━━━━━━━━━━━━━";

// [N38W] Payloads DISTINCTS des quick-reply de l'offre winback → routage inbound dédié (le webhook
// les matche AVANT YES_RE/NO_RE, pour qu'une réponse à l'offre ne tombe jamais dans le tunnel OUI/NON).
export const WINBACK_YES_PAYLOAD = "WINBACK_YES";
export const WINBACK_NO_PAYLOAD = "WINBACK_NO";

// ─── Signature LIVRA (bas de CHAQUE message acheteur, FR+AR) ──────────────────
// Ajoutée en pied de bloc AR et de bloc FR par appendSignature() plus bas, à TOUS les
// templates SAUF order_confirmation_request (déjà approuvé en prod — on n'y touche pas).
const SIG_AR = "✓ LIVRA — خدمة تأكيد الطلبيات للبائع تاعك. مقامك كزبون موثوق يتبعك عند كل البائعين اللي يخدمو بـ LIVRA.";
const SIG_FR = "✓ LIVRA — le service de confirmation de ton vendeur. Ton statut de client fiable te suit chez tous les vendeurs qui utilisent LIVRA.";

export const TEMPLATES = {
  // ─── MSG 1 — Confirmation de commande (OUI/NON) ───
  order_confirmation_request: {
    name: "order_confirmation_request",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique", "produit", "total"],
    buttons: [
      { type: "QUICK_REPLY", text: "✅ إيه / OUI" },
      { type: "QUICK_REPLY", text: "❌ لا / NON" },
    ],
    body: `message en français suit

سلام {{1}} 👋
كوموند تاعك عند {{2}} محجوزة باسمك.

🛍️ {{3}}
💰 ‪{{4}}‬ دج
📦 الخلاص عند التوصيل · ما تخلص والو دروك

تحب نبداو التوصيل ؟

${SEP}

Bonjour {{1}} 👋
Bonne nouvelle : votre commande chez {{2}} est réservée à votre nom.

🛍️ {{3}}
💰 {{4}} DA
📦 Paiement à la livraison · rien à payer maintenant

Voulez-vous procéder à la livraison ?`,
  },

  // ─── MSG 1 (variante D4 — PRIX SÉPARÉ) — order_confirmation_request_split ───
  // [N32W.1] D4 tranché par Lamine : prix produit + frais de livraison sur DEUX lignes.
  // Variante 5-variables du template ci-dessus. N'est utilisée QUE si delivery_fee > 0 ET
  // env MSG1_SPLIT_TEMPLATE_READY==="true" (send-otp) — sinon on reste sur le template 4-var
  // approuvé (repli total seul, jamais une ligne « Livraison : 0 » mensongère).
  // ⚠️ À SOUMETTRE par Lamine (verbatim FR+AR dans tasks/TEMPLATES_A_SOUMETTRE.md) : tant que Meta
  // ne l'a pas approuvée, le flag reste false → aucun envoi sur ce nom → zéro régression prod.
  // {{4}} = prix produit (order.total_amount, déjà hors frais) · {{5}} = frais de livraison.
  order_confirmation_request_split: {
    name: "order_confirmation_request_split",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique", "produit", "prix_produit", "frais_livraison"],
    buttons: [
      { type: "QUICK_REPLY", text: "✅ إيه / OUI" },
      { type: "QUICK_REPLY", text: "❌ لا / NON" },
    ],
    body: `message en français suit

سلام {{1}} 👋
كوموند تاعك عند {{2}} محجوزة باسمك.

🛍️ {{3}}
💰 المنتج : ‪{{4}}‬ دج
🚚 التوصيل : ‪{{5}}‬ دج
📦 الخلاص عند التوصيل · ما تخلص والو دروك

تحب نبداو التوصيل ؟

${SEP}

Bonjour {{1}} 👋
Bonne nouvelle : votre commande chez {{2}} est réservée à votre nom.

🛍️ {{3}}
💰 Produit : {{4}} DA
🚚 Livraison : {{5}} DA
📦 Paiement à la livraison · rien à payer maintenant

Voulez-vous procéder à la livraison ?`,
  },

  // ─── MSG 2 — Demande du code (après OUI) ───
  order_otp_code: {
    name: "order_otp_code",
    category: "UTILITY",
    language: "fr",
    variables: ["code"],
    body: `message en français suit

باش نأكدو ونطلقو التوصيل، رد على هاد الرسالة بالكود تاعك :

✅ {{1}}

بلا تأكيد، ما نقدروش نوصلولك.
راني نستنى الكود تاعك 🙂

${SEP}

Pour confirmer et lancer la livraison, répondez avec votre code :

✅ {{1}}

Sans confirmation, on ne pourra pas vous l'envoyer.
On attend votre code 🙂`,
  },

  // ─── Accusé de confirmation + badge réputation (après code OTP vérifié) ───
  order_confirmed_verified: {
    name: "order_confirmed_verified",
    category: "UTILITY",
    language: "fr",
    variables: [],
    body: `message en français suit

✅ مبروك! الطلبية ثابتة.
راك ولّيت زبون مؤكَّد LIVRA ✓ — الزبائن الموثوقين يُخدمو بالأولوية.

${SEP}

✅ C'est validé ! Commande confirmée.
Vous êtes maintenant client vérifié LIVRA ✓ — les clients fiables sont servis en priorité.`,
  },

  // ─── Code OTP erroné (réponse best-effort, fenêtre 24 h Meta) ───
  // Envoyé UNIQUEMENT sur wrong_code : le numéro A une commande en attente mais le
  // code ne matche pas → un vrai client qui se trompe d'un chiffre. Texte libre (pas
  // de template Meta) : la fenêtre 24 h est ouverte car l'acheteur vient d'écrire.
  // Pas de « N essais restants » — aucune limite d'essais n'existe en V1.
  order_otp_wrong_code: {
    name: "order_otp_wrong_code",
    category: "UTILITY",
    language: "fr",
    variables: [],
    body: `message en français suit

⚠️ هاد الكود ماشي صحيح.
عاود بعثلنا الكود الصحيح باش نأكدو ونطلقو التوصيل.
راني نستنى الكود تاعك 🙂

${SEP}

⚠️ Ce code ne correspond pas.
Renvoyez-nous le bon code pour confirmer et lancer la livraison.
On attend votre code 🙂`,
  },

  // ─── MSG 4 — Pourquoi ? (après NON) ───
  // Boutons 100% darija ≤20 chars (limite Meta) — servent le message INTERACTIF en
  // fenêtre 24h ET le template quick-reply hors fenêtre. `id` = payload de routage :
  // le clic renvoie le libellé darija, capté par NOT_AVAIL_RE / MIND_CHANGED_RE /
  // CHEAPER_RE dans confirm-order.ts (branches A/B/C déjà câblées).
  order_cancel_reasons: {
    name: "order_cancel_reasons",
    category: "UTILITY",
    // [N12-2] SEULE variante approuvée par Meta = "ar" (le fr a été refusé : boutons darija
    // sur corps FR). `buildTemplatePayload` envoie `language:{code: template.language}` → le repli
    // hors fenêtre partira donc en 'ar'. Le corps ci-dessous reste bilingue pour le rendu texte-libre
    // in-window (renderTemplateText n'utilise pas .language).
    language: "ar",
    variables: [],
    buttons: [
      { type: "QUICK_REPLY", id: "not_available", text: "ماشي اليوم" },
      { type: "QUICK_REPLY", id: "changed_mind", text: "بدلت رايي" },
      { type: "QUICK_REPLY", id: "found_cheaper", text: "لقيت أرخص" },
    ],
    body: `message en français suit

ما كانش مشكل 🙂 قلنا علاش :

${SEP}

Pas de souci 🙂 Dites-nous pourquoi :`,
  },

  // ─── MSG 5 — Branche A · Pas dispo ───
  order_reschedule_request: {
    name: "order_reschedule_request",
    category: "UTILITY",
    language: "fr",
    variables: [],
    body: `message en français suit

ما كانش مشكل ! خاير نهار يناسبك ؟
رد بالنهار اللي يناسبك 📅

${SEP}

Pas de souci ! Quel jour vous arrange ?
Répondez avec le jour qui vous convient 📅`,
  },

  // ─── [N49W] Décision vendeur « pas dispo » → 3 créneaux INTERACTIFS ───
  // Envoyé par l'endpoint de décision vendeur (POST /api/orders/[id]/decision, action="slots") via
  // sendWhatsAppInteractiveButtons (message de SESSION, in-window uniquement — PAS de repli template :
  // décision Lamine, hors fenêtre = on n'envoie rien). 3 boutons = limite WhatsApp (pile dessus).
  // Les `id` sont des payloads de routage stables (traitement de la réponse acheteur = lot ultérieur).
  order_reschedule_slots: {
    name: "order_reschedule_slots",
    category: "UTILITY",
    language: "fr",
    variables: [],
    buttons: [
      { type: "QUICK_REPLY", text: "غدوة", id: "SLOT_TOMORROW" },
      { type: "QUICK_REPLY", text: "بعد غدوة", id: "SLOT_DAY_AFTER" },
      { type: "QUICK_REPLY", text: "نتصل بالمتجر", id: "SLOT_CONTACT" },
    ],
    body: `message en français suit

واش من نهار يناسبك للتوصيل ؟ اختار من تحت 📅

${SEP}

Quel jour vous arrange pour la livraison ? Choisissez ci-dessous 📅`,
  },

  // ─── MSG 6 — Branche B · Changé d'avis ───
  order_cancelled_mind_changed: {
    name: "order_cancelled_mind_changed",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique"],
    body: `message en français suit

فهمت {{1}}، نلغيو.
إلا بدلت رايك، {{2}} راهي في خدمتك دايما 👋

${SEP}

Compris {{1}}, on annule.
Si vous changez d'avis, {{2}} reste à votre service 👋`,
  },

  // ─── MSG 7 — Branche C · Trouvé moins cher ───
  order_objection_cheaper: {
    name: "order_objection_cheaper",
    category: "UTILITY",
    language: "fr",
    variables: [],
    buttons: [
      { type: "QUICK_REPLY", text: "✅ إيه / OUI" },
      { type: "QUICK_REPLY", text: "❌ لا / NON" },
    ],
    body: `message en français suit

المثل يقول : "على رخصو خلا نصو"

في اغلب الوقت، الرخيص يخبي منتوج مزيف ولا بياع ماشي محترف.
هنا تخلص كي يوصلك المنتوج — تشوفو، تقلبو، تتحقق منو، وبعد تخلص.
راك ما تخسر والو.

نكملو ؟

${SEP}

Le proverbe le dit : « Qui achète trop bon marché, achète deux fois »

Le moins cher cache souvent un faux produit ou un vendeur pas professionnel.
Ici, vous payez à la livraison — une fois le produit en main, vérifié.
Vous risquez zéro.

On continue ?`,
  },

  // ─── MSG 8 — Mode "Livreur perso" (invitation à partager la position) ───
  // {{3}} = lien locate (le crochet [Cliquez ici…] de la source = emplacement du lien).
  delivery_mode_perso: {
    name: "delivery_mode_perso",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique", "lien"],
    body: `message en français suit

🛵 {{1}}، كوموندك عند {{2}} واجدة باش تطلق !
اختار وين تحب نوصلوك : الدار، الخدمة، القهوة…

📍 {{3}}

الليفرور تاع {{2}} يلقاك — بلا ما يعيط، بلا حيرة، بلا ما تكتب أدريسة.
وتشوفو في direct حتى يوصل لبابك 🐺

${SEP}

🛵 {{1}}, votre commande chez {{2}} est prête à partir !
Choisissez où vous faire livrer : domicile, travail, café…

📍 {{3}}

Le livreur de {{2}} vous trouvera — sans appel, sans galère, sans adresse à taper.
Et vous le suivrez en live jusqu'à votre porte 🐺`,
  },

  // ─── MSG 9 — Mode "Transporteur" (Yalidine / DHD / Anderson) ───
  delivery_mode_carrier: {
    name: "delivery_mode_carrier",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique", "transporteur", "lien_tracking"],
    body: `message en français suit

📦 {{1}}، كوموندك عند {{2}} تبعثت مع {{3}}.
تابعها حتى توصلك :
🔗 {{4}}

${SEP}

📦 {{1}}, votre commande chez {{2}} a été expédiée via {{3}}.
Suivez-la jusqu'à vous :
🔗 {{4}}`,
  },

  // ─── MSG 12 — Livreur en route (perso : start-delivery / driver-notify) ───
  // Placé entre MSG 8/9 et MSG 10 (cf. source).
  delivery_perso_enroute: {
    name: "delivery_perso_enroute",
    category: "UTILITY",
    language: "fr",
    variables: ["prénom", "boutique", "lien_tracking"],
    body: `message en français suit

🛵 {{1}}، الليفرور تاع {{2}} راه في الطريق !
تابعو live حتى يوصل لبابك :
🔗 {{3}}

${SEP}

🛵 {{1}}, le livreur de {{2}} est en route vers vous !
Suivez-le en live jusqu'à votre porte :
🔗 {{3}}`,
  },

  // ─── MSG 10 — Livraison effectuée ───
  delivery_completed: {
    name: "delivery_completed",
    category: "UTILITY",
    language: "fr",
    variables: ["boutique"],
    body: `message en français suit

✅ كوموندك عند {{1}} وصلت بشكل مزيان.
شكرا على ثقتك في LIVRA 🐺

${SEP}

✅ Votre commande chez {{1}} a bien été livrée.
Merci d'avoir choisi LIVRA 🐺`,
  },

  // ─── MSG 11 — Livraison échouée ───
  delivery_failed: {
    name: "delivery_failed",
    category: "UTILITY",
    language: "fr",
    variables: ["boutique"],
    body: `message en français suit

⚠️ الليفرور ما قدرش يلقاك.
تواصل مع {{1}} باش تعاودو الموعد.

${SEP}

⚠️ Le livreur n'a pas pu vous joindre.
Contactez {{1}} pour reprogrammer votre livraison.`,
  },

  // ─── [N13] Transporteur annulé → mode de livraison à re-choisir (acheteur) ───
  // COPY FIGÉE par Claudy (16 sept), verbatim, NON reformulée. AUCUNE variable. UTILITY, transactionnel,
  // zéro promesse → EXCLU de la signature LIVRA (cf. SIGNATURE_EXCLUDE). Variantes MONOLINGUES à
  // soumettre = tasks/TEMPLATES_A_SOUMETTRE.md § N13.
  order_carrier_changed: {
    name: "order_carrier_changed",
    category: "UTILITY",
    language: "fr",
    variables: [],
    body: `message en français suit

تبدّل نمط التوصيل تاع الطلبية تاعك. المتجر رح يعاود يظبطو ويرجعلك.

${SEP}

Le mode de livraison de votre commande a été modifié. La boutique va le reconfigurer et revenir vers vous.`,
  },

  // ─── [N13] Livraison annulée par le livreur → la boutique recontacte (acheteur) ───
  // COPY FIGÉE par Claudy (16 sept), verbatim. {{1}} = référence. UTILITY, zéro promesse (SIGNATURE_EXCLUDE).
  order_delivery_cancelled: {
    name: "order_delivery_cancelled",
    category: "UTILITY",
    language: "fr",
    variables: ["référence"],
    body: `message en français suit

الطلبية تاعك {{1}} تلغات. المتجر رح يتواصل معاك.

${SEP}

Votre commande {{1}} a été annulée. La boutique vous recontactera.`,
  },

  // ─── [N36W] Rattrapage de vente — order_winback_offer (MARKETING) ───
  // Envoyé APRÈS un refus récupérable (branche A `not_available` / C `found_cheaper`) via
  // sendWinbackOffer() (src/lib/winback.ts), gaté WINBACK_SEND_READY. Variante ar approuvée chez
  // Meta → sendWinbackOffer bascule `language:"ar"` si la locale acheteur est connue, sinon fr.
  // {{3}}=offre (ex. « -15% ») · {{4}}=date limite (DD-MM-YYYY). Corps bilingue ci-dessous = rendu
  // in-window seulement ; Meta délivre SA copy approuvée (seules les variables + name/language partent).
  order_winback_offer: {
    name: "order_winback_offer",
    category: "MARKETING",
    language: "fr",
    variables: ["prénom", "boutique", "offre", "date_limite"],
    buttons: [
      { type: "QUICK_REPLY", text: "إيه نأكد", id: WINBACK_YES_PAYLOAD },
      { type: "QUICK_REPLY", text: "لا شكرا", id: WINBACK_NO_PAYLOAD },
    ],
    body: `message en français suit

سلام {{1}} 👋
عندنا عرض خاص ليك من {{2}} :
🎁 {{3}}
صالح حتى {{4}}

تحب تأكد الطلبية ؟

${SEP}

Bonjour {{1}} 👋
{{2}} vous propose une offre spéciale :
🎁 {{3}}
valable jusqu'au {{4}}

Voulez-vous confirmer la commande ?`,
  },
} satisfies Record<string, WhatsAppTemplate>;

// ─── Signature LIVRA en pied de chaque message ACHETEUR (FR+AR) ───────────────
// Insère SIG_AR en bas du bloc AR (avant ${SEP}) et SIG_FR en bas du bloc FR. Appliquée
// une seule fois, à la définition, à TOUS les templates SAUF ceux exclus. order_confirmation_request
// est EXCLU : template approuvé en prod (STOP SI — on ne modifie pas sa copy). vendorMessage()
// n'est pas dans TEMPLATES (fonction vendeur) → naturellement hors signature acheteur.
// Rappel : pour les envois en TEMPLATE (delivery_*, repli tunnel), Meta délivre SA copy approuvée
// — la signature ci-dessous ne s'affiche qu'après re-soumission (cf. tasks/TEMPLATES_A_SOUMETTRE.md).
// [N13] order_carrier_changed / order_delivery_cancelled : corps 100% transactionnel (UTILITY),
// « pas de promesse » → PAS de signature LIVRA (qui est un slot Trust Layer = promesse).
const SIGNATURE_EXCLUDE = new Set<string>([
  "order_confirmation_request",
  "order_confirmation_request_split", // [N32W.1] MSG 1 (variante prix séparé) : même exclusion que MSG 1.
  "order_carrier_changed",
  "order_delivery_cancelled",
]);

function appendSignature(body: string): string {
  const marker = `\n\n${SEP}\n\n`;
  const i = body.indexOf(marker);
  if (i === -1) return `${body}\n\n${SIG_FR}`; // pas de séparateur AR/FR (ne devrait pas arriver)
  const ar = body.slice(0, i);
  const fr = body.slice(i + marker.length);
  return `${ar}\n\n${SIG_AR}${marker}${fr}\n\n${SIG_FR}`;
}

for (const t of Object.values(TEMPLATES) as WhatsAppTemplate[]) {
  if (!SIGNATURE_EXCLUDE.has(t.name)) t.body = appendSignature(t.body);
}

// ─── BUILD META CLOUD API PAYLOAD ─────────────────────────────
// Construit le payload "template" Meta Cloud API (Meta + 360dialog partagent ce
// format). `variables` = valeurs dans l'ordre {{1}}…{{n}}.
export function buildTemplatePayload(
  to: string,
  template: WhatsAppTemplate,
  variables: string[]
): object {
  const components: object[] = [];

  if (template.variables.length > 0) {
    components.push({
      type: "body",
      parameters: variables.map((text) => ({ type: "text", text })),
    });
  }

  template.buttons?.forEach((btn, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index: String(index),
      // [N38W · corrigé N40W] payload = `id` s'il existe (routage inbound stable, ex. WINBACK_*), sinon
      // le libellé. Templates qui définissent `id` : `order_winback_offer` (WINBACK_YES/NO) ET
      // `order_cancel_reasons` (not_available/changed_mind/found_cheaper, l.198-200) — mais l'`id` de
      // cancel_reasons n'est PAS lu au routage : le tri des motifs se fait par regex sur le LIBELLÉ
      // (NOT_AVAIL_RE… dans confirm-order) via messageBody qui PRÉFÈRE `button.text`. Ce changement
      // aligne juste le payload template sur buildInteractiveButtonsPayload (déjà en `btn.id ?? btn.text`).
      parameters: [{ type: "payload", payload: btn.id ?? btn.text }],
    });
  });

  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components,
    },
  };
}

// ─── BUILD META INTERACTIVE (reply buttons) ──────────────────
// Message interactif "reply buttons" (type: "interactive") — n'est délivré que DANS la
// fenêtre 24h (message de session), pas hors fenêtre (là c'est le template qui prend le
// relais). Au clic, le webhook entrant reçoit interactive.button_reply = { id, title } :
// `title` = libellé darija affiché, `id` = payload de routage stable (défaut = text si
// non fourni). Meta limite à 3 boutons ; le corps interactif est limité à 1024 chars.
export function buildInteractiveButtonsPayload(
  to: string,
  bodyText: string,
  buttons: NonNullable<WhatsAppTemplate["buttons"]>
): object {
  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((btn) => ({
          type: "reply",
          reply: { id: btn.id ?? btn.text, title: btn.text },
        })),
      },
    },
  };
}

// ─── RENDU TEXTE (fallback texte Meta) ───────────────────────
// Le sender runtime (whatsapp.ts → sendWhatsAppNotification) envoie une string :
// on interpole {{1}}…{{n}} dans le corps. Les boutons quick-reply ne s'appliquent
// qu'au format template Meta (cf. buildTemplatePayload), pas au texte libre.
export function renderTemplateText(
  template: WhatsAppTemplate,
  variables: string[]
): string {
  let body = template.body;
  variables.forEach((value, i) => {
    body = body.split(`{{${i + 1}}}`).join(value);
  });
  return body;
}

// ─── INTERNAL — Vendor notifs (texte libre, pas template Meta) ──────
// Notifications côté VENDEUR (pas d'équivalent template acheteur). Conservé V1 :
// texte libre FR envoyé via sendWhatsAppNotification depuis le cron yalidine-poll.
export function vendorMessage(
  status: string,
  reference: string,
  tracking: string | null
): string | null {
  if (status === "shipped") {
    return `🚚 Commande ${reference} prise en charge par Yalidine.\nTracking: ${tracking ?? "N/A"}`;
  }
  if (status === "delivered") {
    return `✅ Commande ${reference} livrée avec succès !\nPensez à confirmer le paiement reçu.`;
  }
  if (status === "returned") {
    return `⚠️ Échec de livraison pour la commande ${reference}.\nLe colis est en cours de retour.`;
  }
  return null;
}
