"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// P2 — État TRANSITOIRE du suivi acheteur. Le token buyer est valide mais la commande
// n'a pas (ou plus) de delivery_mode : le vendeur vient de régénérer / retirer le QR
// (DELETE generate-qr → delivery_mode=null). Ce n'est PAS un lien mort — le token
// buyer est indépendant du qr_token — juste un état d'attente. On affiche « en
// préparation » et on rafraîchit tout seul : dès que le vendeur re-choisit un mode,
// router.refresh() re-rend le serveur et TrackClient réapparaît, sans que l'acheteur
// ait à recharger.
export default function PreparingView({ reference }: { reference: string }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div
      style={{ backgroundColor: "#1a1b1f", minHeight: "100dvh" }}
      className="flex items-center justify-center p-6"
    >
      <div
        style={{
          backgroundColor: "#1e2028",
          border: "1px solid #252525",
          borderRadius: 28,
          padding: "40px 32px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h1 style={{ color: "#F5F0E8", fontSize: 20, fontWeight: 600, margin: 0 }}>
          {reference ? `Commande ${reference}` : "Votre commande"}
        </h1>
        <p
          style={{
            color: "rgba(245, 240, 232, 0.6)",
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Votre vendeur finalise l&apos;envoi.
          <br />
          Le suivi en direct reprendra dans un instant — cette page se met à jour toute seule.
        </p>
      </div>
    </div>
  );
}
