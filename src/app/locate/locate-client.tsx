"use client";

import dynamic from "next/dynamic";

const LocateMap = dynamic(() => import("./locate-map"), {
  ssr: false,
  loading: () => (
    <div style={{ backgroundColor: "#1a1b1f", minHeight: "100dvh" }} />
  ),
});

type Props = {
  token: string;
  orderNumber: string;
  vendorName: string;
  alreadyConfirmed: boolean;
  buyerLat: number | null;
  buyerLng: number | null;
};

export default function LocateClient(props: Props) {
  return <LocateMap {...props} />;
}
