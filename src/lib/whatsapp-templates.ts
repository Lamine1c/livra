// ─── TEMPLATES WHATSAPP V1 — BILINGUE AR+FR (format Meta Cloud API) ──
// SOURCE DE VÉRITÉ : ~/livra/LIVRA_MARKETING.md
//   section "📨 SCRIPT BOT WhatsApp V1 — BILINGUE AR+FR".
// Règles inviolables (cf. LIVRA_MARKETING.md) :
//   - L'arabe (darija) vient TOUJOURS en premier, FR après le séparateur ━━━.
//   - Header "message en français suit" en haut (jamais d'arabe en header, pas de drapeau).
//   - Jamais "livreur LIVRA" / "notre livreur" → toujours "le livreur de {{boutique}}".
//   - Variables Meta = {{1}}, {{2}}… dans l'ordre d'apparition dans le corps.
// NE PAS retoucher / traduire la darija : copie verbatim de la source.

export type WhatsAppTemplate = {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  body: string;
  buttons?: Array<{ type: "QUICK_REPLY"; text: string }>;
  variables: string[]; // libellés humains, ordre = {{1}}, {{2}}…
};

const SEP = "━━━━━━━━━━━━━━";

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
  // ⚠️ Boutons bilingues > 20 caractères = limite Meta quick-reply (à raccourcir
  //    avant soumission Meta — copy verbatim conservée ici, décision Lamine).
  order_cancel_reasons: {
    name: "order_cancel_reasons",
    category: "UTILITY",
    language: "fr",
    variables: [],
    buttons: [
      { type: "QUICK_REPLY", text: "📅 ماشي اليوم / Pas dispo" },
      { type: "QUICK_REPLY", text: "🤔 بدلت رايي / Changé d'avis" },
      { type: "QUICK_REPLY", text: "💰 لقيت أرخص / Moins cher" },
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

المثل يقول : "على رخصو خلا نصو" 😜

في اغلب الوقت، الرخيص يخبي منتوج مزيف ولا بياع ماشي محترف.
هنا تخلص كي يوصلك المنتوج — تشوفو، تقلبو، تتحقق منو، وبعد تخلص.
راك ما تخسر والو.

نكملو ؟

${SEP}

Le proverbe le dit : "على رخصو خلا نصو" 😜

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
} satisfies Record<string, WhatsAppTemplate>;

// ─── BUILD META CLOUD API PAYLOAD ─────────────────────────────
// Construit le payload "template" Meta Cloud API (Twilio Content API + Meta +
// 360dialog partagent ce format). `variables` = valeurs dans l'ordre {{1}}…{{n}}.
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
      parameters: [{ type: "payload", payload: btn.text }],
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

// ─── RENDU TEXTE (Twilio sandbox / Meta text fallback) ────────
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

// ─── INTERNAL — Vendor notifs (Twilio sandbox, pas Meta) ──────
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
