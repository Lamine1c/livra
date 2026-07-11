// Dictionnaire des messages de notifications push, localisé FR / AR.
//
// Chaque type de notification a une fonction dédiée qui reçoit la locale du
// destinataire + les variables à interpoler et retourne { title, body } déjà
// composé dans la bonne langue.
//
// Règles AR (arabe standard moderne, registre interface — jamais de darija ni
// de jargon) : termes alignés sur le glossaire mobile
// (~/livra-mobile/locales/ar/*). Chiffres occidentaux (les références
// commande restent telles quelles). Fallback : locale inconnue/null → "fr".

export type PushLocale = "fr" | "ar";

export type PushMessage = { title: string; body: string };

// Normalise n'importe quelle valeur DB (text 'fr'|'ar', null, undefined,
// valeur inattendue) vers une locale supportée. Fallback → "fr".
export function normalizePushLocale(value: string | null | undefined): PushLocale {
  return value === "ar" ? "ar" : "fr";
}

// ── Vendeur — commande livrée (driver/complete-delivery) ──
export function orderDelivered(
  locale: string | null | undefined,
  vars: { reference: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "✅ تم توصيل الطلب",
      body: `تم توصيل الطلب رقم ${vars.reference} بنجاح!`,
    };
  }
  return {
    title: "✅ Commande livrée",
    body: `La commande #${vars.reference} a été livrée avec succès !`,
  };
}

// ── Vendeur — livreur en route (driver/start-delivery) ──
export function deliveryStarted(
  locale: string | null | undefined,
  vars: { driverName: string; reference: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "🛵 مندوب التوصيل في الطريق",
      body: `بدأ ${vars.driverName} توصيل الطلب رقم ${vars.reference}.`,
    };
  }
  return {
    title: "🛵 Livreur en route",
    body: `${vars.driverName} a démarré la livraison de la commande #${vars.reference}.`,
  };
}

// ── Vendeur — nouveau lead Meta Ads (meta/leads/webhook) ──
export function metaLead(
  locale: string | null | undefined,
  vars: { clientName: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "🎯 طلب جديد من Meta Ads",
      body: `${vars.clientName} — أكمل الطلب في LIVRA`,
    };
  }
  return {
    title: "🎯 Nouveau lead Meta Ads",
    body: `${vars.clientName} — complétez la commande dans LIVRA`,
  };
}

// ── Vendeur — position client confirmée (orders/locate) ──
export function buyerLocationConfirmed(
  locale: string | null | undefined,
  vars: { reference: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "📍 تم تأكيد موقع الزبون",
      body: `شارك زبونك موقعه للطلب رقم ${vars.reference}.`,
    };
  }
  return {
    title: "📍 Position client confirmée",
    body: `Votre client a partagé sa position pour la commande #${vars.reference}.`,
  };
}

// ── Vendeur — commande annulée par le client (confirm-order, "changé d'avis") ──
export function orderCancelled(
  locale: string | null | undefined,
  vars: { reference: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "❌ تم إلغاء الطلب",
      body: `غيّر الزبون رأيه — الطلب رقم ${vars.reference}.`,
    };
  }
  return {
    title: "❌ Commande annulée",
    body: `Le client a changé d'avis — commande #${vars.reference}.`,
  };
}

// ── Livreur — course annulée par le vendeur (orders/[id]/cancel-delivery) ──
// AR aligné sur driver.json : courseCancelledTitle = "تم إلغاء التوصيل".
export function deliveryCancelled(
  locale: string | null | undefined,
  vars: { reference: string }
): PushMessage {
  const l = normalizePushLocale(locale);
  if (l === "ar") {
    return {
      title: "تم إلغاء التوصيل",
      body: `تم إلغاء التوصيل — ${vars.reference}`,
    };
  }
  return {
    title: "Course annulée",
    body: `Course annulée — ${vars.reference}`,
  };
}
