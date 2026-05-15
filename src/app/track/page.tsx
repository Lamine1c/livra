import { verifyBuyerToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";
import TrackClient from "./track-client";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  if (!t) return <ErrorView reason="missing" />;

  const result = verifyBuyerToken(t);
  if (!result.valid) return <ErrorView reason={result.expired ? "expired" : "invalid"} />;

  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, reference, status, delivery_mode, independent_driver_name, independent_driver_phone, created_at, user_id"
    )
    .eq("id", result.orderId)
    .single();

  if (orderError || !order || !order.delivery_mode) {
    return <ErrorView reason="invalid" />;
  }

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .single();

  const vendorName = vendor?.store_name ?? vendor?.full_name ?? "Boutique";

  // Fetch live delivery data for moto_perso (GPS position)
  let delivery: {
    id: string;
    lastLat: number | null;
    lastLng: number | null;
    deliveryStatus: string;
  } | null = null;

  if (order.delivery_mode === "moto_perso") {
    const { data: deliveryRow } = await supabase
      .from("deliveries")
      .select("id, last_lat, last_lng, status")
      .eq("order_id", order.id)
      .maybeSingle();

    if (deliveryRow) {
      delivery = {
        id: deliveryRow.id as string,
        lastLat: deliveryRow.last_lat as number | null,
        lastLng: deliveryRow.last_lng as number | null,
        deliveryStatus: deliveryRow.status as string,
      };
    }
  }

  return (
    <TrackClient
      order={{
        id: order.id as string,
        reference: order.reference as string,
        status: order.status as string,
        deliveryMode: order.delivery_mode as "moto_perso" | "yalidine",
        driverName: order.independent_driver_name as string | null,
        driverPhone: order.independent_driver_phone as string | null,
        createdAt: order.created_at as string,
      }}
      vendorName={vendorName}
      delivery={delivery}
      token={t}
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
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
          Le lien de suivi n&apos;est pas valide ou a expiré.
          <br />
          Demandez un nouveau lien au vendeur.
        </p>
      </div>
    </div>
  );
}
