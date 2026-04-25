import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#0D0D0D] md:bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
