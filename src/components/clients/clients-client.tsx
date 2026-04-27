"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, Phone, MapPin, Search } from "lucide-react";
import { Client } from "@/types";
import { WILAYAS } from "@/lib/utils";

// ── Palette A2-S1 audacieux ───────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK  = "#0c0d11";
const AVATAR_BG    = "#222328";
const AVATAR_LIGHT = "#242630";
const AVATAR_DARK  = "#0a0b0f";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

const cardNeumorphic = {
  background: BG,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
};

const avatarStyle = {
  background: AVATAR_BG,
  boxShadow: `-6px -6px 12px ${AVATAR_LIGHT}, 6px 6px 12px ${AVATAR_DARK}`,
};

const onScrollHandler = (e: React.UIEvent<HTMLElement>) => {
  window.dispatchEvent(
    new CustomEvent("livra:scroll", {
      detail: { scrollTop: e.currentTarget.scrollTop },
    })
  );
};

interface ClientsClientProps {
  clients: Client[];
}

export function ClientsClient({ clients }: ClientsClientProps) {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (!clients.length) {
    return (
      <main
        className="w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 pb-52 md:p-6"
        style={{ background: BG }}
        onScroll={onScrollHandler}
      >
        <div
          className="md:hidden pointer-events-none sticky top-0 left-0 right-0 z-10"
          style={{ height: 24, background: "linear-gradient(to bottom, #1a1b1f, transparent)", marginBottom: -24 }}
        />
        <EmptyClients />
      </main>
    );
  }

  return (
    <main
      className="w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 pb-52 md:p-6"
      style={{ background: BG }}
      onScroll={onScrollHandler}
    >
      <div
        className="md:hidden pointer-events-none sticky top-0 left-0 right-0 z-10"
        style={{ height: 24, background: "linear-gradient(to bottom, #1a1b1f, transparent)", marginBottom: -24 }}
      />

      {clients.length > 5 && (
        <div
          className="mb-5 flex items-center gap-3 rounded-[12px] px-4 py-3"
          style={{
            background: BG,
            boxShadow: `inset -5px -5px 10px rgba(255,255,255,0.02), inset 5px 5px 10px rgba(0,0,0,0.45)`,
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="flex-1 bg-transparent outline-none border-none text-sm"
            style={{ color: OFF_WHITE }}
          />
        </div>
      )}

      {filteredClients.length === 0 && search.trim() ? (
        <p className="text-center py-8 text-sm" style={{ color: MUTED }}>
          Aucun client trouvé pour &quot;{search}&quot;
        </p>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="flex items-center gap-3 rounded-[18px] transition-all active:scale-[0.99]"
              style={{ ...cardNeumorphic, padding: "14px 14px" }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-[10px] font-medium"
                style={{ width: 40, height: 40, fontSize: 15, color: OFF_WHITE, ...avatarStyle }}
              >
                {client.full_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate leading-tight" style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 500 }}>
                  {client.full_name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone style={{ width: 12, height: 12, color: MUTED, flexShrink: 0 }} />
                  <span className="truncate" style={{ fontSize: 11, color: MUTED }}>
                    {client.phone}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin style={{ width: 12, height: 12, color: MUTED, flexShrink: 0 }} />
                  <span className="truncate" style={{ fontSize: 11, color: MUTED }}>
                    {client.commune}, {WILAYAS[client.wilaya] ?? client.wilaya}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyClients() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{
          background: AVATAR_BG,
          boxShadow: `-6px -6px 12px ${AVATAR_LIGHT}, 6px 6px 12px ${AVATAR_DARK}`,
        }}
      >
        <Users className="h-6 w-6" style={{ color: MUTED }} />
      </div>
      <div className="text-center">
        <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 500 }}>Aucun client</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          Créez votre premier client pour commencer.
        </p>
      </div>
      <Link
        href="/dashboard/clients/new"
        className="rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.97]"
        style={{
          background: BG,
          color: EMERALD,
          boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
        }}
      >
        + Nouveau client
      </Link>
    </div>
  );
}
