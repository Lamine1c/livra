// ─── [G8W-S3] Adresse de livraison qui FAIT FOI pour une commande ─────────────
// Règle unique (aucune divergence entre consommateurs) : le SNAPSHOT par commande (orders.ship_*, migration
// 050) s'il existe, SINON l'adresse du client (`clients`, partagée). Tant que 050 n'est pas appliquée, les
// champs ship_* sont `undefined` → repli client = comportement actuel (migration INERTE).
// TOUS les consommateurs de l'adresse de livraison (yalidine, ecotrack, scan) DOIVENT passer par ici :
// un seul oublié = un colis routé à l'ancienne adresse.

type ShipSnapshot = { ship_wilaya?: string | null; ship_commune?: string | null; ship_address?: string | null };
type ClientAddress = { wilaya?: string | null; commune?: string | null; address?: string | null } | null | undefined;

export function orderDeliveryAddress(
  order: ShipSnapshot,
  client: ClientAddress
): { wilaya: string | null; commune: string | null; address: string | null } {
  return {
    wilaya: order.ship_wilaya ?? client?.wilaya ?? null,
    commune: order.ship_commune ?? client?.commune ?? null,
    address: order.ship_address ?? client?.address ?? null,
  };
}
