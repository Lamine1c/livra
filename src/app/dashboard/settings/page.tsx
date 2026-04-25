import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { SettingsForm } from "./settings-form";
import { YalidineForm } from "./yalidine-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-1 flex-col bg-[#0D0D0D] md:bg-transparent">
      <Header title="Réglages" />

      <main className="flex-1 pt-5 px-4 pb-40 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">

          {/* Profil marchand */}
          <div className="rounded-xl border border-[#252525] bg-[#161618] md:rounded-xl md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100">
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Profil marchand
              </h2>
            </div>
            <div className="px-4 py-4 md:px-6">
              <SettingsForm profile={profile} userEmail={user?.email ?? ""} />
            </div>
          </div>

          {/* Yalidine */}
          <div className="rounded-xl border border-[#252525] bg-[#161618] md:rounded-xl md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100">
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Connecte ton Yalidine
              </h2>
              <p className="text-xs md:text-sm text-[#8A8780] md:text-gray-500 mt-0.5">
                On s&apos;occupe du reste — tes identifiants sont chiffrés et jamais partagés.
              </p>
            </div>
            <div className="px-4 py-4 md:px-6">
              <YalidineForm
                apiId={profile?.yalidine_api_id ?? null}
                apiToken={profile?.yalidine_api_token ?? null}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
