import { useState, useMemo, useCallback, useEffect } from "react";
import { useCargo } from "../store/CargoContext";
import { DriverStatusBadge } from "../components/Badge";
import { cn } from "../lib/utils";
import { Star, Phone, MapPin, Truck, ArrowUpDown, Plus, Pencil, Trash2, X, RefreshCw } from "lucide-react";
import type { Driver, DriverStatus } from "../types";

type SortKey = "name" | "capacity" | "rating" | "status";

const STATUS_OPTIONS: DriverStatus[] = ["Available", "On the road", "Busy"];

// ─── Driver Form Modal ──────────────────────────────────────────────────────

interface DriverModalProps {
  open: boolean;
  onClose: () => void;
  editDriver?: Driver | null;
}

function DriverModal({ open, onClose, editDriver }: DriverModalProps) {
  const { addDriver, updateDriver } = useCargo();

  const defaultForm = { name: "", phone: "", vehicle: "", capacity: "", city: "", status: "Available" as DriverStatus, rating: "4.5" };
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(editDriver ? {
        name: editDriver.name,
        phone: editDriver.phone,
        vehicle: editDriver.vehicle,
        capacity: String(editDriver.capacity),
        city: editDriver.city,
        status: editDriver.status,
        rating: String(editDriver.rating),
      } : defaultForm);
      setErrors({});
    }
  }, [open, editDriver]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "At least 2 characters";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.vehicle.trim()) errs.vehicle = "Required";
    const cap = parseFloat(form.capacity);
    if (isNaN(cap) || cap <= 0) errs.capacity = "Must be > 0";
    else if (cap > 50) errs.capacity = "Max 50t";
    if (!form.city.trim()) errs.city = "Required";
    const rating = parseFloat(form.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) errs.rating = "Between 1.0 and 5.0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      vehicle: form.vehicle.trim(),
      capacity: parseFloat(form.capacity),
      city: form.city.trim(),
      status: form.status,
      rating: Math.min(5, Math.max(1, parseFloat(parseFloat(form.rating).toFixed(1)))),
    };
    if (editDriver) updateDriver(editDriver.id, data);
    else addDriver(data);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-card-border">
          <div>
            <h2 className="text-lg font-bold">{editDriver ? "Edit Driver" : "Add Driver"}</h2>
            <p className="text-sm text-muted-foreground">{editDriver ? editDriver.id : "Fill in the driver details"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <DF label="Full Name *" error={errors.name}>
            <input className={ic(!!errors.name)} value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Giorgi Beridze" autoFocus />
          </DF>

          <DF label="Phone *" error={errors.phone}>
            <input className={ic(!!errors.phone)} value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="+995 555 000 000" />
          </DF>

          <div className="grid grid-cols-2 gap-3">
            <DF label="Vehicle *" error={errors.vehicle}>
              <input className={ic(!!errors.vehicle)} value={form.vehicle} onChange={e => set("vehicle", e.target.value)}
                placeholder="e.g. Van, Sprinter" />
            </DF>
            <DF label="Capacity (tons) *" error={errors.capacity}>
              <input type="number" step="0.5" min="0.1" max="50"
                className={ic(!!errors.capacity)} value={form.capacity} onChange={e => set("capacity", e.target.value)}
                placeholder="e.g. 3.5" />
            </DF>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DF label="City *" error={errors.city}>
              <input className={ic(!!errors.city)} value={form.city} onChange={e => set("city", e.target.value)}
                placeholder="e.g. Tbilisi" />
            </DF>
            <DF label="Rating (1–5)" error={errors.rating}>
              <input type="number" step="0.1" min="1" max="5"
                className={ic(!!errors.rating)} value={form.rating} onChange={e => set("rating", e.target.value)}
                placeholder="e.g. 4.5" />
            </DF>
          </div>

          <DF label="Status">
            <select className={ic(false)} value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </DF>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
              {editDriver ? "Save Changes" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function ic(hasError: boolean) {
  return cn(
    "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
    hasError ? "border-destructive" : "border-input"
  );
}

// ─── Main Drivers Page ─────────────────────────────────────────────────────

export function Drivers() {
  const { drivers, cycleDriverStatus, deleteDriver } = useCargo();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortAsc, setSortAsc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const filtered = useMemo(() => {
    let list = [...drivers];
    const s = search.toLowerCase().trim();
    if (s) list = list.filter(d =>
      d.name.toLowerCase().includes(s) ||
      d.vehicle.toLowerCase().includes(s) ||
      d.city.toLowerCase().includes(s) ||
      d.phone.includes(s)
    );
    if (statusFilter !== "All") list = list.filter(d => d.status === statusFilter);
    list.sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortKey === "name") { va = a.name; vb = b.name; }
      else if (sortKey === "capacity") { va = a.capacity; vb = b.capacity; }
      else if (sortKey === "rating") { va = a.rating; vb = b.rating; }
      else { va = a.status; vb = b.status; }
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [drivers, search, statusFilter, sortKey, sortAsc]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return prev; }
      setSortAsc(key === "rating" ? false : true);
      return key;
    });
  }, []);

  const openAdd = useCallback(() => { setEditDriver(null); setModalOpen(true); }, []);
  const openEdit = useCallback((d: Driver) => { setEditDriver(d); setModalOpen(true); }, []);
  const handleDelete = useCallback((d: Driver) => {
    if (confirm(`Remove driver ${d.name}? Any offers linked to them will also be removed.`)) deleteDriver(d.id);
  }, [deleteDriver]);

  const counts = useMemo(() => ({
    available: drivers.filter(d => d.status === "Available").length,
    onRoad: drivers.filter(d => d.status === "On the road").length,
    busy: drivers.filter(d => d.status === "Busy").length,
  }), [drivers]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{drivers.length} total drivers</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Available", count: counts.available, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "On the Road", count: counts.onRoad, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
          { label: "Busy", count: counts.busy, cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        ].map(({ label, count, cls }) => (
          <span key={label} className={cn("px-3 py-1 rounded-full text-xs font-semibold", cls)}>
            {label}: {count}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-card-border rounded-xl p-3">
        <input
          className="flex-1 min-w-40 px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search name, vehicle, city, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as DriverStatus | "All")}
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On the road">On the Road</option>
          <option value="Busy">Busy</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(driver => (
          <div key={driver.id} className="bg-card border border-card-border rounded-xl shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-base truncate">{driver.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{driver.id}</div>
              </div>
              <DriverStatusBadge status={driver.status} />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck size={14} className="flex-shrink-0" />
                <span className="truncate">{driver.vehicle} · <strong className="text-foreground">{driver.capacity}t</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={14} className="flex-shrink-0" />
                <span>{driver.city}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone size={14} className="flex-shrink-0" />
                <a href={`tel:${driver.phone}`} className="hover:text-primary transition-colors">{driver.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500 fill-amber-400 flex-shrink-0" />
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{driver.rating}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={cn("w-2.5 h-2.5 rounded-sm mr-0.5",
                        i <= Math.round(driver.rating) ? "bg-amber-400" : "bg-muted"
                      )} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => cycleDriverStatus(driver.id)}
                className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={11} /> Next Status
              </button>
              <button
                onClick={() => openEdit(driver)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(driver)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <div className="text-3xl mb-2">🚛</div>
            <p className="font-medium">{drivers.length === 0 ? "No drivers yet." : "No drivers match your search."}</p>
            {drivers.length === 0 && (
              <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">Add first driver →</button>
            )}
          </div>
        )}
      </div>

      {/* Table view */}
      {drivers.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Table View</h2>
            <span className="text-xs text-muted-foreground">Click headers to sort</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-muted/40 border-b border-card-border">
                  {(["name", "capacity", "rating", "status"] as SortKey[]).map(key => (
                    <th
                      key={key}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        <ArrowUpDown size={11} className={sortKey === key ? "text-primary" : "opacity-30"} />
                      </span>
                    </th>
                  ))}
                  {["Phone", "Vehicle", "City", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={cn(
                      "border-t border-card-border hover:bg-muted/20 transition-colors",
                      idx % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 font-semibold">{d.name}</td>
                    <td className="px-4 py-3 font-semibold">{d.capacity}t</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-400" />{d.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3"><DriverStatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{d.phone}</td>
                    <td className="px-4 py-3">{d.vehicle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cycleDriverStatus(d.id)}
                          className="px-2 py-1 rounded border border-border text-xs hover:bg-muted transition-colors"
                        >
                          <RefreshCw size={11} />
                        </button>
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DriverModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditDriver(null); }}
        editDriver={editDriver}
      />
    </div>
  );
}
