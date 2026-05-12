type InfoPanelProps = {
  statusLabel: string;
  isDelivered: boolean;
  driverName: string | null;
  driverPhone: string | null;
  vendorName: string;
  mode: "moto_perso" | "yalidine";
};

export default function InfoPanel({
  statusLabel,
  isDelivered,
  driverName,
  driverPhone,
  vendorName,
  mode,
}: InfoPanelProps) {
  const statusColor = isDelivered ? "#076a4d" : "#F5F0E8";

  return (
    <div
      style={{
        backgroundColor: "#1e2028",
        borderTop: "1px solid #252525",
        padding: "20px 20px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>📦</span>
        <span
          style={{
            backgroundColor: "#15161a",
            color: statusColor,
            padding: "6px 14px",
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Driver name — moto_perso only */}
      {mode === "moto_perso" && driverName && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🛵</span>
          <span style={{ color: "#F5F0E8", fontSize: 15 }}>{driverName}</span>
        </div>
      )}

      {/* Call button — moto_perso only */}
      {mode === "moto_perso" && driverPhone && (
        <a
          href={`tel:+${driverPhone.replace(/[^0-9]/g, "")}`}
          style={{
            backgroundColor: "#076a4d",
            color: "#F5F0E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 56,
            borderRadius: 28,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            marginTop: 4,
          }}
        >
          <span>📞</span>
          Appeler le livreur
        </a>
      )}

      {/* Vendor name */}
      <p
        style={{
          fontSize: 12,
          color: "rgba(245, 240, 232, 0.4)",
          textAlign: "center",
          marginTop: 4,
        }}
      >
        {vendorName}
      </p>
    </div>
  );
}
