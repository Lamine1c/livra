import { Header } from "@/components/layout/header";
import { NewClientForm } from "@/components/clients/new-client-form";

export default function NewClientPage() {
  return (
    <div className="w-full flex flex-1 flex-col min-h-0" style={{ background: "#1a1b1f" }}>
      <Header title="Nouveau client" backHref="/dashboard/clients" />
      <NewClientForm />
    </div>
  );
}
