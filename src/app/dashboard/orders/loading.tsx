import { Header } from "@/components/layout/header";

export default function OrdersLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header title="Commandes" />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Skeleton pills */}
        <div className="flex gap-2">
          {[88, 110, 76, 88, 96].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-[#1E1E20] animate-pulse shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>
        {/* Skeleton rows */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#252525] bg-[#161618] p-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1E1E20] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-[#1E1E20] animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-[#1E1E20] animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="h-4 w-20 rounded bg-[#1E1E20] animate-pulse" />
                <div className="h-4 w-16 rounded-full bg-[#1E1E20] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
