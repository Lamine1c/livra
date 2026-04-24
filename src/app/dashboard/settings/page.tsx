import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { YalidineForm } from "./yalidine-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Paramètres" />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Profil marchand</h2>
            </CardHeader>
            <CardContent>
              <SettingsForm profile={profile} userEmail={user?.email ?? ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Connecter Yalidine Express</h2>
              <p className="text-sm text-gray-500">
                Vos credentials sont chiffrés et utilisés uniquement pour créer vos bons de livraison.
              </p>
            </CardHeader>
            <CardContent>
              <YalidineForm
                apiId={profile?.yalidine_api_id ?? null}
                apiToken={profile?.yalidine_api_token ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
