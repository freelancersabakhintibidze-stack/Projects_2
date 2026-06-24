import { useMemo } from "react";
import { useCargo } from "../store/CargoContext";
import { formatCurrency, formatDateTime, getRiskLevel, timeUntil, cn } from "../lib/utils";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { Download, FileText, BarChart3, TrendingUp, Truck, Package } from "lucide-react";

export function Report() {
  const { orders, drivers, logEntries } = useCargo();

  const stats = useMemo(() => {
    const confirmed = orders.filter(o => o.status === "Confirmed");
    const cancelled = orders.filter(o => o.status === "Cancelled");
    const driverSelected = orders.filter(o => o.status === "Driver Selected");
    const newOrders = orders.filter(o => o.status === "New");
    const active = orders.filter(o => o.status !== "Cancelled");
    const risky = active.filter(o => getRiskLevel(o.deadline) === "high");
    const totalBudget = active.reduce((s, o) => s + o.budgetGel, 0);
    const confirmedRevenue = confirmed.reduce((s, o) => s + (o.agreedPrice ?? o.budgetGel), 0);
    const avgBudget = active.length > 0 ? Math.round(totalBudget / active.length) : 0;
    const savings = confirmed.reduce((s, o) => s + (o.budgetGel - (o.agreedPrice ?? o.budgetGel)), 0);
    const highPriority = active.filter(o => o.priority === "High").length;
    const availableDrivers = drivers.filter(d => d.status === "Available").length;
    const avgRating = drivers.length > 0
      ? (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1)
      : "—";
    return {
      confirmed, cancelled, driverSelected, newOrders, active,
      risky, totalBudget, confirmedRevenue, avgBudget, savings,
      highPriority, availableDrivers, avgRating,
    };
  }, [orders, drivers]);

  function generateReportText(): string {
    const now = new Date();
    const hr = "=".repeat(80);
    const lines: string[] = [
      hr,
      "                    CARGOOPS — OPERATIONAL REPORT",
      `                    Generated: ${now.toLocaleString("en-GB")}`,
      hr,
      "",
      "SUMMARY",
      "-------",
      `Total Orders:              ${orders.length}`,
      `  Active:                  ${stats.active.length}`,
      `    - New:                 ${stats.newOrders.length}`,
      `    - Driver Selected:     ${stats.driverSelected.length}`,
      `    - Confirmed:           ${stats.confirmed.length}`,
      `  Cancelled:               ${stats.cancelled.length}`,
      `High Priority:             ${stats.highPriority}`,
      `High Risk (< 6h):          ${stats.risky.length}`,
      "",
      "FINANCIAL",
      "---------",
      `Estimated Pipeline Budget: ${formatCurrency(stats.totalBudget)}`,
      `Average Budget/Order:      ${formatCurrency(stats.avgBudget)}`,
      `Confirmed Revenue:         ${formatCurrency(stats.confirmedRevenue)}`,
      `Total Savings Negotiated:  ${formatCurrency(stats.savings)}`,
      "",
      "FLEET",
      "-----",
      `Total Drivers:             ${drivers.length}`,
      `Available:                 ${stats.availableDrivers}`,
      `Fleet Avg Rating:          ${stats.avgRating}`,
      "",
    ];

    if (stats.risky.length > 0) {
      lines.push("⚠ HIGH RISK ORDERS (DEADLINE < 6H)", "-".repeat(40));
      stats.risky.forEach(o => {
        lines.push(`  ${o.id}: ${o.pickupCity} → ${o.deliveryCity} | ${timeUntil(o.deadline)} | Status: ${o.status}`);
      });
      lines.push("");
    }

    lines.push("ACTIVE ORDER DETAILS", "-".repeat(40));
    stats.active.forEach(o => {
      const driver = o.selectedDriverId ? drivers.find(d => d.id === o.selectedDriverId) : null;
      lines.push(`\n${o.id}:  ${o.pickupCity} → ${o.deliveryCity}`);
      lines.push(`  Cargo:    ${o.cargo} | Weight: ${o.weightTon}t`);
      lines.push(`  Budget:   ${formatCurrency(o.budgetGel)} | Priority: ${o.priority} | Status: ${o.status}`);
      lines.push(`  Deadline: ${formatDateTime(o.deadline)} (${timeUntil(o.deadline)})`);
      if (driver) {
        lines.push(`  Driver:   ${driver.name} (${driver.vehicle}) | Price: ${formatCurrency(o.agreedPrice ?? o.budgetGel)}`);
      }
    });

    if (stats.cancelled.length > 0) {
      lines.push("\nCANCELLED ORDERS", "-".repeat(40));
      stats.cancelled.forEach(o => {
        lines.push(`  ${o.id}: ${o.pickupCity} → ${o.deliveryCity} | ${o.cargo}`);
      });
    }

    lines.push("\nRECENT LOG (last 20 entries)", "-".repeat(40));
    logEntries.slice(0, 20).forEach(e => {
      lines.push(`  [${e.timestamp}] ${e.action}${e.details ? ": " + e.details : ""}`);
    });

    lines.push("\n" + hr);
    return lines.join("\n");
  }

  function downloadTxt() {
    const content = generateReportText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cargoops_report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadJson() {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders: orders.length,
        activeOrders: stats.active.length,
        newOrders: stats.newOrders.length,
        driverSelected: stats.driverSelected.length,
        confirmed: stats.confirmed.length,
        cancelled: stats.cancelled.length,
        highPriority: stats.highPriority,
        highRiskOrderIds: stats.risky.map(o => o.id),
        availableDrivers: stats.availableDrivers,
        fleetAvgRating: stats.avgRating,
        estimatedTotalBudget: stats.totalBudget,
        confirmedRevenue: stats.confirmedRevenue,
        totalSavings: stats.savings,
        averageBudgetPerOrder: stats.avgBudget,
      },
      orders: orders.map(o => ({
        ...o,
        selectedDriverName: o.selectedDriverId
          ? (drivers.find(d => d.id === o.selectedDriverId)?.name ?? null)
          : null,
      })),
      drivers,
      recentLog: logEntries.slice(0, 100),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cargoops_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generated {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTxt}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download size={15} /> .txt Report
          </button>
          <button onClick={downloadJson}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <FileText size={15} /> .json Export
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard icon={Package} label="Total Orders" value={String(orders.length)} />
        <KPICard icon={BarChart3} label="Active" value={String(stats.active.length)} />
        <KPICard icon={TrendingUp} label="Confirmed" value={String(stats.confirmed.length)} color="emerald" />
        <KPICard icon={Truck} label="Available Drivers" value={`${stats.availableDrivers}/${drivers.length}`} />
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Pipeline Budget</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalBudget)}</div>
          <div className="text-xs text-muted-foreground mt-1">avg {formatCurrency(stats.avgBudget)} / order</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Confirmed Revenue</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.confirmedRevenue)}</div>
          <div className="text-xs text-muted-foreground mt-1">from {stats.confirmed.length} orders</div>
        </div>
        <div className={cn("bg-card border rounded-xl p-4 shadow-sm", stats.savings >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-card-border")}>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Negotiated Savings</div>
          <div className={cn("text-2xl font-bold", stats.savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
            {stats.savings >= 0 ? "+" : ""}{formatCurrency(stats.savings)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">vs original budgets</div>
        </div>
      </div>

      {/* Risk alert */}
      {stats.risky.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <h2 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            ⚠️ High Risk Orders — Deadline under 6 hours
          </h2>
          <div className="space-y-2">
            {stats.risky.map(o => (
              <div key={o.id} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <span className="font-mono font-bold">{o.id}</span>
                <span>{o.pickupCity} → {o.deliveryCity} · {o.cargo} · {o.weightTon}t</span>
                <span className="font-bold">{timeUntil(o.deadline)}</span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active orders table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
          <h2 className="font-semibold">Active Orders ({stats.active.length})</h2>
          <span className="text-xs text-muted-foreground">Sorted by deadline</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/40 border-b border-card-border">
                {["ID", "Route", "Cargo", "Weight", "Budget", "Priority", "Status", "Deadline", "Driver / Price"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...stats.active]
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .map((order, idx) => {
                  const driver = order.selectedDriverId ? drivers.find(d => d.id === order.selectedDriverId) : null;
                  const risk = getRiskLevel(order.deadline);
                  return (
                    <tr key={order.id} className={cn("border-t border-card-border", idx % 2 === 1 && "bg-muted/10")}>
                      <td className="px-4 py-3 font-mono font-bold text-primary">{order.id}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{order.pickupCity} → {order.deliveryCity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.cargo}</td>
                      <td className="px-4 py-3">{order.weightTon}t</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.budgetGel)}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <div className={cn("text-xs font-medium", risk === "high" && "text-red-600", risk === "medium" && "text-amber-600")}>
                          {timeUntil(order.deadline)}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(order.deadline)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {driver ? (
                          <div>
                            <div className="font-medium text-sm">{driver.name}</div>
                            <div className="text-xs text-emerald-600 font-semibold">
                              {formatCurrency(order.agreedPrice ?? order.budgetGel)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {stats.active.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No active orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver fleet table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h2 className="font-semibold">Driver Fleet ({drivers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-muted/40 border-b border-card-border">
                {["Name", "Vehicle", "Capacity", "City", "Rating", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, idx) => (
                <tr key={d.id} className={cn("border-t border-card-border", idx % 2 === 1 && "bg-muted/10")}>
                  <td className="px-4 py-3 font-semibold">{d.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.vehicle}</td>
                  <td className="px-4 py-3 font-semibold">{d.capacity}t</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.city}</td>
                  <td className="px-4 py-3">⭐ {d.rating}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      d.status === "Available" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      d.status === "On the road" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: string;
  color?: "emerald";
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", color === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted")}>
        <Icon size={18} className={color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
