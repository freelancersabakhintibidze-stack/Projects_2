import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority, OrderStatus, DriverStatus } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} GEL`;
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function timeUntil(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return "Deadline passed";
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (totalHours >= 48) {
    const days = Math.floor(totalHours / 24);
    const hrs = totalHours % 24;
    return hrs > 0 ? `${days}d ${hrs}h left` : `${days}d left`;
  }
  if (totalHours >= 1) return `${totalHours}h ${mins}m left`;
  return `${totalMinutes}m left`;
}

export function getRiskLevel(deadlineStr: string): "high" | "medium" | "low" | "passed" {
  const deadline = new Date(deadlineStr);
  const diffHours = (deadline.getTime() - Date.now()) / 3600000;
  if (diffHours <= 0) return "passed";
  if (diffHours <= 6) return "high";
  if (diffHours <= 24) return "medium";
  return "low";
}

export function isHighRisk(deadlineStr: string): boolean {
  return getRiskLevel(deadlineStr) === "high";
}

export function priorityColor(priority: Priority): string {
  switch (priority) {
    case "High": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "Medium": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Low": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
  }
}

export function statusColor(status: OrderStatus): string {
  switch (status) {
    case "New": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Driver Selected": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "Confirmed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Cancelled": return "bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400";
  }
}

export function driverStatusColor(status: DriverStatus): string {
  switch (status) {
    case "Available": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "On the road": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Busy": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
}
