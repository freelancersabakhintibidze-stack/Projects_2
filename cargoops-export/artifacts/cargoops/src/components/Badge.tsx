import { cn } from "../lib/utils";
import type { Priority, OrderStatus, DriverStatus } from "../types";
import { priorityColor, statusColor, driverStatusColor } from "../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={priorityColor(priority)}>{priority}</Badge>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={statusColor(status)}>{status}</Badge>;
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <Badge className={driverStatusColor(status)}>{status}</Badge>;
}
