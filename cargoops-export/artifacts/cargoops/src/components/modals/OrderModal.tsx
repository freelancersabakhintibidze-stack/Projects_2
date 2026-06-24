import { useState, useEffect, useCallback } from "react";
import type { Order, Priority } from "../../types";
import { useCargo } from "../../store/CargoContext";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  editOrder?: Order | null;
}

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function toLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface FormState {
  pickupCity: string;
  deliveryCity: string;
  cargo: string;
  weightTon: string;
  budgetGel: string;
  deadline: string;
  priority: Priority;
}

const defaultForm: FormState = {
  pickupCity: "", deliveryCity: "", cargo: "",
  weightTon: "", budgetGel: "",
  deadline: "", priority: "Medium",
};

export function OrderModal({ open, onClose, editOrder }: OrderModalProps) {
  const { addOrder, updateOrder } = useCargo();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(editOrder ? {
        pickupCity: editOrder.pickupCity,
        deliveryCity: editOrder.deliveryCity,
        cargo: editOrder.cargo,
        weightTon: String(editOrder.weightTon),
        budgetGel: String(editOrder.budgetGel),
        deadline: toLocalDatetime(editOrder.deadline),
        priority: editOrder.priority,
      } : defaultForm);
      setErrors({});
    }
  }, [open, editOrder]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  }, [handleClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.pickupCity.trim()) errs.pickupCity = "Required";
    if (!form.deliveryCity.trim()) errs.deliveryCity = "Required";
    if (form.pickupCity.trim() && form.deliveryCity.trim() &&
      form.pickupCity.trim().toLowerCase() === form.deliveryCity.trim().toLowerCase())
      errs.deliveryCity = "Must differ from pickup";
    if (form.cargo.trim().length < 3) errs.cargo = "At least 3 characters";
    const weight = parseFloat(form.weightTon);
    if (isNaN(weight) || weight <= 0) errs.weightTon = "Must be > 0";
    else if (weight > 100) errs.weightTon = "Max 100 tons";
    const budget = parseFloat(form.budgetGel);
    if (isNaN(budget) || budget <= 0) errs.budgetGel = "Must be > 0";
    if (!form.deadline) errs.deadline = "Required";
    else if (new Date(form.deadline) <= new Date()) errs.deadline = "Must be in the future";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      pickupCity: form.pickupCity.trim(),
      deliveryCity: form.deliveryCity.trim(),
      cargo: form.cargo.trim(),
      weightTon: parseFloat(form.weightTon),
      budgetGel: parseFloat(form.budgetGel),
      deadline: new Date(form.deadline).toISOString(),
      priority: form.priority,
    };
    if (editOrder) updateOrder(editOrder.id, data);
    else addOrder(data);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-card-border">
          <div>
            <h2 className="text-lg font-bold">{editOrder ? "Edit Order" : "New Order"}</h2>
            <p className="text-sm text-muted-foreground">{editOrder ? editOrder.id : "Fill in the details below"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pickup City *" error={errors.pickupCity}>
              <input className={inputCls(!!errors.pickupCity)} value={form.pickupCity}
                onChange={e => set("pickupCity", e.target.value)} placeholder="e.g. Tbilisi" autoFocus />
            </Field>
            <Field label="Delivery City *" error={errors.deliveryCity}>
              <input className={inputCls(!!errors.deliveryCity)} value={form.deliveryCity}
                onChange={e => set("deliveryCity", e.target.value)} placeholder="e.g. Batumi" />
            </Field>
          </div>

          <Field label="Cargo Description *" error={errors.cargo}>
            <input className={inputCls(!!errors.cargo)} value={form.cargo}
              onChange={e => set("cargo", e.target.value)} placeholder="e.g. Food Products, Electronics" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (tons) *" error={errors.weightTon}>
              <input type="number" step="0.1" min="0.1" max="100"
                className={inputCls(!!errors.weightTon)} value={form.weightTon}
                onChange={e => set("weightTon", e.target.value)} placeholder="e.g. 4.2" />
            </Field>
            <Field label="Budget (GEL) *" error={errors.budgetGel}>
              <input type="number" min="1" step="50"
                className={inputCls(!!errors.budgetGel)} value={form.budgetGel}
                onChange={e => set("budgetGel", e.target.value)} placeholder="e.g. 1800" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline *" error={errors.deadline}>
              <input type="datetime-local" className={inputCls(!!errors.deadline)}
                value={form.deadline} onChange={e => set("deadline", e.target.value)} />
            </Field>
            <Field label="Priority">
              <select className={inputCls(false)} value={form.priority}
                onChange={e => set("priority", e.target.value as Priority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              {editOrder ? "Save Changes" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return cn(
    "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
    hasError ? "border-destructive focus:ring-destructive" : "border-input"
  );
}
