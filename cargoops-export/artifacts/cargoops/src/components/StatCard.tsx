import { cn } from "../lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, className, accent }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-1 min-w-0",
      accent && "border-l-4 border-l-primary",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{label}</span>
        {Icon && <Icon size={18} className="text-muted-foreground flex-shrink-0" />}
      </div>
      <span className="text-2xl font-bold text-foreground truncate">{value}</span>
    </div>
  );
}
