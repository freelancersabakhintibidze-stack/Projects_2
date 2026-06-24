import { useState, useMemo, useCallback } from "react";
import { useCargo } from "../store/CargoContext";
import { OrderModal } from "../components/modals/OrderModal";
import { DriverSelectModal } from "../components/modals/DriverSelectModal";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { formatCurrency, formatDateTime, timeUntil, getRiskLevel, cn } from "../lib/utils";
import type { Order, Priority, OrderStatus } from "../types";
import { Plus, Search, X, Copy, Pencil, Trash2, Eye, ArrowUpDown, Zap, CheckCircle2 } from "lucide-react";

type SortKey = "deadline" | "budgetGel" | "weightTon" | "priority" | "status";
const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

// Defined outside component to avoid recreation on every render
function SortIndicator({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <ArrowUpDown
      size={12}
      className={active ? "text-primary" : "text-muted-foreground opacity-40"}
    />
  );
}

export function Orders() {
  const { orders, deleteOrder, duplicateOrder, confirmOrder, cancelOrder } = useCargo();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | "">("");
  const [sortAsc, setSortAsc] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  // Store ID instead of snapshot — modal derives live order from store
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Derived live order for edit (always fresh)
  const editOrder = useMemo(
    () => editOrderId ? orders.find(o => o.id === editOrderId) ?? null : null,
    [editOrderId, orders]
  );

  const filtered = useMemo(() => {
    let list = [...orders];
    const s = search.toLowerCase().trim();
    if (s) list = list.filter(o =>
      o.id.toLowerCase().includes(s) ||
      o.pickupCity.toLowerCase().includes(s) ||
      o.deliveryCity.toLowerCase().includes(s) ||
      o.cargo.toLowerCase().includes(s)
    );
    if (priorityFilter !== "All") list = list.filter(o => o.priority === priorityFilter);
    if (statusFilter !== "All") list = list.filter(o => o.status === statusFilter);
    if (urgentOnly) list = list.filter(o => getRiskLevel(o.deadline) === "high");

    if (sortKey) {
      list.sort((a, b) => {
        let va = 0, vb = 0;
        if (sortKey === "deadline") { va = new Date(a.deadline).getTime(); vb = new Date(b.deadline).getTime(); }
        else if (sortKey === "budgetGel") { va = a.budgetGel; vb = b.budgetGel; }
        else if (sortKey === "weightTon") { va = a.weightTon; vb = b.weightTon; }
        else if (sortKey === "priority") { va = PRIORITY_ORDER[a.priority]; vb = PRIORITY_ORDER[b.priority]; }
        else if (sortKey === "status") { va = a.status.charCodeAt(0); vb = b.status.charCodeAt(0); }
        return sortAsc ? va - vb : vb - va;
      });
    } else {
      list.sort((a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    }
    return list;
  }, [orders, search, priorityFilter, statusFilter, urgentOnly, sortKey, sortAsc]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return prev; }
      setSortAsc(true);
      return key;
    });
  }, []);

  const openDetail = useCallback((id: string) => { setDetailOrderId(id); setDetailOpen(true); }, []);
  const openEdit = useCallback((id: string) => { setEditOrderId(id); setOrderModalOpen(true); }, []);

  const handleDelete = useCallback((order: Order) => {
    if (confirm(`Delete ${order.id}? This cannot be undone.`)) deleteOrder(order.id);
  }, [deleteOrder]);

  const resetFilters = useCallback(() => {
    setSearch(""); setPriorityFilter("All"); setStatusFilter("All");
    setUrgentOnly(false); setSortKey("");
  }, []);

  const urgentCount = useMemo(
    () => orders.filter(o => getRiskLevel(o.deadline) === "high" && o.status !== "Confirmed").length,
    [orders]
  );

  const hasActiveFilters = search || priorityFilter !== "All" || statusFilter !== "All" || urgentOnly || sortKey;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} total · {orders.filter(o => o.status === "New").length} new ·{" "}
            {orders.filter(o => o.status === "Confirmed").length} confirmed
          </p>
        </div>
        <button
          onClick={() => { setEditOrderId(null); setOrderModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-card-border rounded-xl p-3">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search ID, city, cargo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as Priority | "All")}
        >
          <option value="All">All Priorities</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🔵 Low</option>
        </select>

        <select
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as OrderStatus | "All")}
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Driver Selected">Driver Selected</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={() => setUrgentOnly(v => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
            urgentOnly
              ? "bg-red-600 text-white border-red-600"
              : urgentCount > 0
              ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Zap size={13} />
          Urgent{urgentCount > 0 ? ` (${urgentCount})` : ""}
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="bg-muted/40 border-b border-card-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Cargo</th>
                <SortTh label="Weight" col="weightTon" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <SortTh label="Budget" col="budgetGel" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <SortTh label="Deadline" col="deadline" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <SortTh label="Priority" col="priority" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <SortTh label="Status" col="status" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground">
                    <div className="text-3xl mb-2">📦</div>
                    {hasActiveFilters ? "No orders match your filters." : "No orders yet. Create your first order!"}
                  </td>
                </tr>
              ) : (
                filtered.map((order, idx) => {
                  const risk = getRiskLevel(order.deadline);
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        "border-t border-card-border hover:bg-muted/20 transition-colors",
                        isOdd && "bg-muted/10"
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(order.id)}
                          className="font-mono font-bold text-primary hover:underline text-sm"
                        >
                          {order.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {order.pickupCity} → {order.deliveryCity}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{order.cargo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.weightTon}t</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatCurrency(order.budgetGel)}</td>
                      <td className="px-4 py-3">
                        <div className={cn(
                          "font-medium text-sm whitespace-nowrap",
                          risk === "high" && "text-red-600 dark:text-red-400",
                          risk === "medium" && "text-amber-600 dark:text-amber-400",
                          risk === "passed" && "text-muted-foreground line-through"
                        )}>
                          {timeUntil(order.deadline)}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(order.deadline)}</div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionBtn title="View / Assign Driver" onClick={() => openDetail(order.id)}>
                            <Eye size={14} />
                          </ActionBtn>
                          <ActionBtn title="Edit" onClick={() => openEdit(order.id)}>
                            <Pencil size={14} />
                          </ActionBtn>
                          {order.status === "Driver Selected" && (
                            <ActionBtn
                              title="Quick Confirm"
                              onClick={() => { if (confirm(`Confirm order ${order.id}?`)) confirmOrder(order.id); }}
                              className="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              <CheckCircle2 size={14} />
                            </ActionBtn>
                          )}
                          <ActionBtn title="Duplicate" onClick={() => duplicateOrder(order.id)}>
                            <Copy size={14} />
                          </ActionBtn>
                          <ActionBtn
                            title="Delete"
                            onClick={() => handleDelete(order)}
                            className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-card-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing {filtered.length} of {orders.length} orders</span>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-primary hover:underline">Clear filters</button>
            )}
          </div>
        )}
      </div>

      <OrderModal
        open={orderModalOpen}
        onClose={() => { setOrderModalOpen(false); setEditOrderId(null); }}
        editOrder={editOrder}
      />
      <DriverSelectModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        orderId={detailOrderId}
      />
    </div>
  );
}

function SortTh({
  label, col, sortKey, sortAsc, onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey | "";
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIndicator active={sortKey === col} asc={sortAsc} />
      </span>
    </th>
  );
}

function ActionBtn({
  children, title, onClick, className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
