export const LIVRA_WA_NUMBER = '213652208485';

export type WaSource = 'hero' | 's4_otp' | 's5_pinpoint' | 's6_tracking' | 's9_final' | 'menu_login' | 'footer_contact';

const WA_MESSAGES: Record<WaSource, string> = {
  hero: 'Salam, je viens de LIVRA — je veux essayer 7 jours gratuit',
  s4_otp: 'Salam, je viens de LIVRA — je veux régler le problème des fausses commandes dans ma boutique',
  s5_pinpoint: "Salam, je viens de LIVRA — j'en ai marre des colis perdus, je veux essayer",
  s6_tracking: 'Salam, je viens de LIVRA — je veux le tracking en direct pour mes commandes',
  s9_final: "Salam, je viens de LIVRA — je veux devenir un vrai pro de l'e-commerce",
  menu_login: "Salam, je suis déjà sur LIVRA — j'ai besoin d'aide pour me connecter",
  footer_contact: 'Salam, j\'ai une question sur LIVRA',
};

export function getWaLink(source: WaSource): string {
  const message = encodeURIComponent(WA_MESSAGES[source]);
  return `https://wa.me/${LIVRA_WA_NUMBER}?text=${message}`;
}
