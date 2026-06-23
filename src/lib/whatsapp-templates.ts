// ─── TEMPLATES MESSAGES WHATSAPP ──────────────────────────────
// Centralisés ici pour faciliter les modifications + multilangue futur

export function deliveryCompletedTemplate(vendorName: string): string {
  return `✅ Votre commande de ${vendorName} a bien été livrée.\n\nMerci d'avoir choisi LIVRA 🚀`;
}

export function locatePinpointTemplate(vendorName: string, locateUrl: string): string {
  return `📍 Confirmez votre position pour votre commande chez ${vendorName}.\n\nCliquez ici (1 tap) : ${locateUrl}\n\nVotre livreur vous trouvera sans appel ni adresse à taper.`;
}

export function buyerTrackingMotoPerso(vendorName: string, url: string): string {
  return `Bonjour, votre commande de ${vendorName} est en route ! Suivez votre livraison en direct : ${url}`;
}

export function buyerTrackingYalidine(vendorName: string, url: string): string {
  return `Bonjour, votre commande de ${vendorName} a été expédiée via Yalidine. Suivez son statut : ${url}`;
}

export function buyerTrackingZrExpress(vendorName: string, url: string): string {
  return `Bonjour, votre commande de ${vendorName} a été expédiée via ZR Express. Suivez son statut : ${url}`;
}

export function buyerTrackingEcotrack(vendorName: string, carrierLabel: string, url: string): string {
  return `Bonjour, votre commande de ${vendorName} a été expédiée via ${carrierLabel}. Suivez son statut : ${url}`;
}

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

export function clientMessage(
  status: string,
  tracking: string | null,
  shopName: string
): string | null {
  if (status === "shipped") {
    return `🚚 Votre commande est en route !\nTracking Yalidine: ${tracking ?? "N/A"}`;
  }
  if (status === "delivered") {
    return `✅ Votre commande a été livrée. Merci pour votre confiance !\n— ${shopName} via LIVRA 🛡️`;
  }
  if (status === "returned") {
    return `⚠️ Notre livreur n'a pas pu vous joindre.\nContactez ${shopName} pour reprogrammer.`;
  }
  return null;
}
