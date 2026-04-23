import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = "text-emerald-600",
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend.value >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("rounded-xl bg-gray-50 p-3", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
