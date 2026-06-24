import { useState, useEffect, useCallback } from "react";
import { useCargo } from "../../store/CargoContext";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Priority } from "../../types";

interface OfferModalProps {
  open: boolean;
  onClose: () => void;
  preselectedOrderId?: string;
}

export function OfferModal({ open, onClose, preselectedOrderId }: OfferModalProps) {
  const { orders, drivers, addOffer } = useCargo();
  const [orderId, setOrderId] = useState(preselectedOrderId ?? "");
  const [driverId, setDriverId] = useState("");
  const [priceGel, setPriceGel] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setOrderId(preselectedOrderId ?? "");
      setDriverId(""); setPriceGel(""); setArrivalTime(""); setComment("");
      setErrors({});
    }
  }, [open, preselectedOrderId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  const activeOrders = orders.filter(o => o.status === "New" || o.status === "Driver Selected");
  const selectedOrder = orders.find(o => o.id === orderId);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!orderId) errs.orderId = "Select an order";
    if (!driverId) errs.driverId = "Select a driver";
    const price = parseFloat(priceGel);
    if (isNaN(price) || price <= 0) errs.priceGel = "Price must be greater than 0";
    if (!arrivalTime.trim()) errs.arrivalTime = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    addOffer({ orderId, driverId, priceGel: parseFloat(priceGel), arrivalTime: arrivalTime.trim(), comment: comment.trim() });
    onClose();
  }

  const selectedDriver = drivers.find(d => d.id === driverId);
  const capacityOk = selectedDriver && selectedOrder ? selectedDriver.capacity >= selectedOrder.weightTon : true;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-card-border">
          <div>
            <h2 className="text-lg font-bold">Add Price Offer</h2>
            <p className="text-sm text-muted-foreground">Record a driver's pricing proposal</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Order *</label>
            <select className={selectCls(!!errors.orderId)} value={orderId} onChange={e => setOrderId(e.target.value)}>
              <option value="">Select order…</option>
              {activeOrders.map(o => (
                <option key={o.id} value={o.id}>{o.id} — {o.pickupCity} → {o.deliveryCity} ({o.weightTon}t)</option>
              ))}
            </select>
            {errors.orderId && <p className="text-xs text-destructive mt-1">{errors.orderId}</p>}
          </div>

          {selectedOrder && (
            <div className="text-xs bg-muted/40 rounded-lg p-2.5 text-muted-foreground">
              Budget: <strong className="text-foreground">{selectedOrder.budgetGel.toLocaleString()} GEL</strong> · {selectedOrder.cargo} · {selectedOrder.weightTon}t required
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Driver *</label>
            <select className={selectCls(!!errors.driverId)} value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">Select driver…</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.vehicle} ({d.capacity}t) · {d.status}
                </option>
              ))}
            </select>
            {errors.driverId && <p className="text-xs text-destructive mt-1">{errors.driverId}</p>}
            {!capacityOk && selectedDriver && selectedOrder && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ {selectedDriver.name} capacity ({selectedDriver.capacity}t) is less than required ({selectedOrder.weightTon}t)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Price (GEL) *</label>
            <input
              type="number" min="1" step="50"
              className={inputCls(!!errors.priceGel)}
              value={priceGel} onChange={e => setPriceGel(e.target.value)}
              placeholder={selectedOrder ? `Budget: ${selectedOrder.budgetGel}` : "e.g. 1700"}
            />
            {errors.priceGel && <p className="text-xs text-destructive mt-1">{errors.priceGel}</p>}
            {selectedOrder && priceGel && !isNaN(parseFloat(priceGel)) && (
              <p className={cn("text-xs mt-1 font-medium",
                parseFloat(priceGel) <= selectedOrder.budgetGel ? "text-emerald-600" : "text-red-500"
              )}>
                {parseFloat(priceGel) <= selectedOrder.budgetGel
                  ? `✓ Saves ${(selectedOrder.budgetGel - parseFloat(priceGel)).toLocaleString()} GEL`
                  : `⚠ ${(parseFloat(priceGel) - selectedOrder.budgetGel).toLocaleString()} GEL over budget`
                }
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Estimated Arrival *</label>
            <input
              type="text" className={inputCls(!!errors.arrivalTime)}
              value={arrivalTime} onChange={e => setArrivalTime(e.target.value)}
              placeholder="e.g. In 2 hours, Tomorrow 10:00"
            />
            {errors.arrivalTime && <p className="text-xs text-destructive mt-1">{errors.arrivalTime}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Comment</label>
            <input
              type="text" className={inputCls(false)}
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Optional notes about this offer"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
              Add Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
    hasError ? "border-destructive" : "border-input"
  );
}

function selectCls(hasError: boolean) {
  return cn(
    "w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
    hasError ? "border-destructive" : "border-input"
  );
}
