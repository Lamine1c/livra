import { Header } from "@/components/layout/header";

export default function ClientsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header title="Clients" />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#252525] bg-[#161618] p-4 space-y-3"
            >
              <div className="h-4 w-3/4 rounded bg-[#1E1E20] animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-1/2 rounded bg-[#1E1E20] animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-[#1E1E20] animate-pulse" />
              </div>
              <div className="h-3 w-1/3 rounded bg-[#1E1E20] animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
