import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0D0D] md:bg-gray-50">
      <Sidebar />
      {/* pb-16 on mobile = space for fixed bottom nav */}
      <div className="scroll-container flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
