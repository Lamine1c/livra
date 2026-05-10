import dynamic from "next/dynamic";
import { verifyLocateToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";

const LocateClient = dynamic(() => import("./locate-client"), {
  ssr: false,
  loading: () => (
    <div style={{ backgroundColor: "#1a1b1f", minHeight: "100dvh" }} />
  ),
});

export default async function LocatePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  if (!t) return <ErrorView reason="missing" />;

  const result = verifyLocateToken(t);
  if (!result.valid) return <ErrorView reason={result.expired ? "expired" : "invalid"} />;

  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, reference, total_amount, buyer_lat, buyer_lng, buyer_location_at, user_id")
    .eq("id", result.orderId)
    .single();

  if (orderError || !order) return <ErrorView reason="invalid" />;

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id as string)
    .single();

  const vendorName = vendor?.store_name ?? vendor?.full_name ?? "Boutique";

  return (
    <LocateClient
      token={t}
      orderNumber={order.reference as string}
      vendorName={vendorName}
      alreadyConfirmed={order.buyer_lat != null}
      buyerLat={(order.buyer_lat as number | null) ?? null}
      buyerLng={(order.buyer_lng as number | null) ?? null}
    />
  );
}

function ErrorView({ reason }: { reason: "missing" | "expired" | "invalid" }) {
  const messages: Record<typeof reason, string> = {
    missing: "Lien manquant",
    expired: "Ce lien a expiré",
    invalid: "Lien invalide",
  };

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
        <h1 style={{ color: "#F5F0E8", fontSize: 20, fontWeight: 600, margin: 0 }}>
          {messages[reason]}
        </h1>
        <p
          style={{
            color: "rgba(245, 240, 232, 0.6)",
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Le lien de localisation n&apos;est pas valide ou a expiré.
          <br />
          Demandez un nouveau lien au vendeur.
        </p>
      </div>
    </div>
  );
}
