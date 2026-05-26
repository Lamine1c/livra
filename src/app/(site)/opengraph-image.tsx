import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LIVRA — L'OS de votre e-commerce";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0E0E10",
          fontFamily: "sans-serif",
        }}
      >
        {/* Terracotta accent line */}
        <div style={{ width: 48, height: 3, backgroundColor: "#A8472B", borderRadius: 2, marginBottom: 32 }} />
        {/* Wordmark */}
        <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: "0.2em", color: "#F5F1EA" }}>
          LIVRA
        </div>
        {/* Tagline */}
        <div style={{ fontSize: 28, color: "#8A8A8E", marginTop: 20, letterSpacing: "0.02em" }}>
          L&apos;OS de votre e-commerce.
        </div>
      </div>
    ),
    { ...size }
  );
}
