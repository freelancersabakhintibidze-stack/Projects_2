import { useMemo, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useCargo } from "../store/CargoContext";
import { StatCard } from "../components/StatCard";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { formatCurrency, formatDateTime, timeUntil, getRiskLevel, isHighRisk, cn } from "../lib/utils";
import { OrderModal } from "../components/modals/OrderModal";
import { DriverSelectModal } from "../components/modals/DriverSelectModal";
import { Package, Truck, AlertTriangle, DollarSign, TrendingUp, Clock, Plus } from "lucide-react";

export function Dashboard() {
  const { orders, drivers } = useCargo();
  const [, navigate] = useLocation();

  // Live tick so countdowns refresh every 30s
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Quick-action modals from Dashboard
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = useCallback((id: string) => { setDetailOrderId(id); setDetailOpen(true); }, []);

  const stats = useMemo(() => {
    void tick; // re-evaluate when tick changes
    const active = orders.filter(o => o.status !== "Cancelled");
    const highPriority = active.filter(o => o.priority === "High").length;
    const available = drivers.filter(d => d.status === "Available").length;
    const totalBudget = active.reduce((s, o) => s + o.budgetGel, 0);
    const confirmedRevenue = orders.filter(o => o.status === "Confirmed")
      .reduce((s, o) => s + (o.agreedPrice ?? o.budgetGel), 0);
    const urgent = active.filter(o => isHighRisk(o.deadline) && o.status !== "Confirmed");
    return { active, highPriority, available, totalBudget, confirmedRevenue, urgent };
  }, [orders, drivers, tick]);

  const recentOrders = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 8),
    [orders]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Overview of cargo operations</p>
        </div>
        <button
          onClick={() => setNewOrderOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Active Orders" value={stats.active.length} icon={Package} />
        <StatCard label="High Priority" value={stats.highPriority} icon={AlertTriangle} accent={stats.highPriority > 0} />
        <StatCard label="Available Drivers" value={stats.available} icon={Truck} />
        <StatCard label="Pipeline Budget" value={formatCurrency(stats.totalBudget)} icon={DollarSign} />
        <StatCard label="Confirmed Revenue" value={formatCurrency(stats.confirmedRevenue)} icon={TrendingUp} />
        <StatCard label="Urgent Alerts" value={stats.urgent.length} icon={Clock} accent={stats.urgent.length > 0} />
      </div>

      {/* Alerts / health banner */}
      {stats.urgent.length > 0 ? (
        <div className="space-y-2">
          {stats.urgent.map(order => (
            <div
              key={order.id}
              onClick={() => openDetail(order.id)}
              className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 truncate">
                  {order.id} — {order.pickupCity} → {order.deliveryCity}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                  {order.cargo} · {order.weightTon}t · Deadline: {formatDateTime(order.deadline)} · <strong>{timeUntil(order.deadline)}</strong>
                </p>
              </div>
              <span className="text-xs text-red-500 font-medium flex-shrink-0">Click to manage →</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-400">
          <span className="text-xl flex-shrink-0">✅</span>
          <span>No immediate deadline risks. All operations are running smoothly.</span>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Orders table — 2 cols */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
            <h2 className="font-semibold">Upcoming Orders by Deadline</h2>
            <button onClick={() => navigate("/orders")} className="text-xs text-primary font-medium hover:underline">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-muted/40 border-b border-card-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Route</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Deadline</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No orders yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((order, idx) => {
                    const risk = getRiskLevel(order.deadline);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => openDetail(order.id)}
                        className={cn(
                          "border-t border-card-border cursor-pointer hover:bg-muted/30 transition-colors",
                          idx % 2 === 1 && "bg-muted/10"
                        )}
                      >
                        <td className="px-4 py-2.5 font-mono font-bold text-primary text-xs">{order.id}</td>
                        <td className="px-4 py-2.5 font-medium text-xs">{order.pickupCity} → {order.deliveryCity}</td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className={cn(
                            "text-xs font-medium",
                            risk === "high" && "text-red-600",
                            risk === "medium" && "text-amber-600",
                            risk === "passed" && "text-muted-foreground"
                          )}>
                            {timeUntil(order.deadline)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><PriorityBadge priority={order.priority} /></td>
                        <td className="px-4 py-2.5"><StatusBadge status={order.status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Driver availability */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Driver Availability</h2>
              <button onClick={() => navigate("/drivers")} className="text-xs text-primary hover:underline">Manage →</button>
            </div>
            <div className="space-y-2">
              {drivers.map(driver => (
                <div key={driver.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{driver.name}</div>
                    <div className="text-xs text-muted-foreground">{driver.vehicle} · {driver.capacity}t</div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                    driver.status === "Available"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : driver.status === "On the road"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {driver.status}
                  </span>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-xs text-muted-foreground">No drivers configured.</p>
              )}
            </div>
          </div>

          {/* Priority distribution */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-sm mb-4">Priority Mix</h2>
            {(["High", "Medium", "Low"] as const).map(p => {
              const count = orders.filter(o => o.priority === p && o.status !== "Cancelled").length;
              const total = orders.filter(o => o.status !== "Cancelled").length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const barCls = { High: "bg-red-500", Medium: "bg-amber-500", Low: "bg-sky-500" }[p];
              return (
                <div key={p} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{p}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={cn("h-1.5 rounded-full transition-all duration-500", barCls)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status breakdown */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-sm mb-4">Order Status Breakdown</h2>
            {(["New", "Driver Selected", "Confirmed", "Cancelled"] as const).map(s => {
              const count = orders.filter(o => o.status === s).length;
              return (
                <div key={s} className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium">{s}</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    s === "New" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    s === "Driver Selected" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                    s === "Confirmed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    s === "Cancelled" && "bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400",
                  )}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <OrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
      <DriverSelectModal open={detailOpen} onClose={() => setDetailOpen(false)} orderId={detailOrderId} />
    </div>
  );
}
