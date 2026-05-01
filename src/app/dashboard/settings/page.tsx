import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScrollMain } from "@/components/layout/scroll-main";
import { SettingsForm } from "./settings-form";
import { YalidineForm } from "./yalidine-form";
import { SignoutButton } from "@/components/settings/signout-button";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";

const sectionCard = {
  background: BG,
  borderRadius: 18,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
  padding: 18,
  marginBottom: 28,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-1 flex-col min-h-0 md:bg-transparent" style={{ background: BG }}>
      <Header title="Réglages" hideBell />

      <ScrollMain className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6">
        <div className="mx-auto max-w-2xl">

          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>
              Profil marchand
            </h2>
            <SettingsForm profile={profile} userEmail={user?.email ?? ""} />
          </div>

          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
              Connecte ton Yalidine
            </h2>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
              On s&apos;occupe du reste — tes identifiants sont chiffrés et jamais partagés.
            </p>
            <YalidineForm
              apiId={profile?.yalidine_api_id ?? null}
              apiToken={profile?.yalidine_api_token ?? null}
            />
          </div>

          {/* Déconnexion */}
          <div style={{...sectionCard, marginBottom: 0, padding: "10px 14px"}}>
            <SignoutButton />
          </div>

        </div>
      </ScrollMain>
    </div>
  );
}
