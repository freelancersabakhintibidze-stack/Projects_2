import { useState, useEffect, useCallback } from "react";
import type { Order, Driver, Offer } from "../../types";
import { useCargo } from "../../store/CargoContext";
import { formatCurrency, formatDateTime, timeUntil, getRiskLevel, driverStatusColor, cn } from "../../lib/utils";
import { X, Star, AlertTriangle, CheckCircle2, ChevronRight, UserCheck, DollarSign } from "lucide-react";

interface DriverSelectModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
}

export function DriverSelectModal({ open, onClose, orderId }: DriverSelectModalProps) {
  const { orders, drivers, offers, selectDriver, confirmOrder, cancelOrder, reopenOrder } = useCargo();
  const [confirming, setConfirming] = useState<{ driver: Driver; offer: Offer | null; manualPrice: number } | null>(null);
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});

  // Always derive order from live store so status updates are reflected immediately
  const order = orderId ? orders.find(o => o.id === orderId) ?? null : null;

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (confirming) setConfirming(null);
      else onClose();
    }
  }, [confirming, onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Reset manual prices when opening
  useEffect(() => {
    if (open) setManualPrices({});
  }, [open]);

  if (!open || !order) return null;

  const relatedOffers = offers.filter(o => o.orderId === order.id);
  const risk = getRiskLevel(order.deadline);

  // Split drivers into capable and incapable
  const capableDrivers = drivers.filter(d => d.capacity >= order.weightTon);
  const incapableDrivers = drivers.filter(d => d.capacity < order.weightTon);

  // `order` is guaranteed non-null here — we returned early above if null
  function getEffectivePrice(driver: Driver, offer: Offer | null): number {
    if (offer) return offer.priceGel;
    const raw = manualPrices[driver.id];
    const parsed = parseFloat(raw ?? "");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return isNaN(parsed) || parsed <= 0 ? order!.budgetGel : parsed;
  }

  function handleSelect(driver: Driver, offer: Offer | null) {
    const price = getEffectivePrice(driver, offer);
    setConfirming({ driver, offer, manualPrice: price });
  }

  function handleConfirmSelection() {
    if (!confirming || !order) return;
    selectDriver(order.id, confirming.driver.id, confirming.manualPrice);
    setConfirming(null);
    onClose();
  }

  // ── Confirmation step ─────────────────────────────────────────────────────
  if (confirming) {
    const price = confirming.manualPrice;
    const savings = order.budgetGel - price;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && setConfirming(null)}
      >
        <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 className="text-lg font-bold mb-1">Confirm Driver Selection</h3>
          <p className="text-sm text-muted-foreground mb-5">Review the details before confirming</p>

          <div className="space-y-2 text-sm bg-muted/40 rounded-xl p-4 mb-6 divide-y divide-border">
            {[
              ["Order", `${order.id} — ${order.pickupCity} → ${order.deliveryCity}`],
              ["Cargo", `${order.cargo} (${order.weightTon}t)`],
              ["Driver", confirming.driver.name],
              ["Vehicle", `${confirming.driver.vehicle} (${confirming.driver.capacity}t)`],
              ["Arrival", confirming.offer?.arrivalTime ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-[60%]">{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Agreed Price</span>
              <span className="font-bold text-primary text-base">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between py-1.5 last:pb-0">
              <span className="text-muted-foreground">Budget</span>
              <span>
                {formatCurrency(order.budgetGel)}{" "}
                <span className={savings >= 0 ? "text-emerald-600" : "text-red-500"}>
                  ({savings >= 0 ? `saves ${formatCurrency(savings)}` : `${formatCurrency(-savings)} over`})
                </span>
              </span>
            </div>
          </div>

          {confirming.driver.status !== "Available" && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400 mb-4">
              <AlertTriangle size={15} className="flex-shrink-0" />
              Driver is currently <strong>{confirming.driver.status}</strong> — confirm anyway?
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(null)}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmSelection}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main detail modal ─────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-card-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">{order.id} — Order Details</h2>
            <p className="text-sm text-muted-foreground">{order.pickupCity} → {order.deliveryCity} · {order.cargo} · {order.weightTon}t</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors ml-2 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
            <InfoCell label="Budget" value={formatCurrency(order.budgetGel)} />
            <InfoCell label="Priority" value={order.priority} />
            <InfoCell label="Status" value={order.status} />
            <InfoCell label="Deadline" value={formatDateTime(order.deadline)} />
            <InfoCell
              label="Time Left"
              value={timeUntil(order.deadline)}
              highlight={risk === "high" ? "red" : risk === "medium" ? "amber" : undefined}
            />
            {order.agreedPrice != null && (
              <InfoCell label="Agreed Price" value={formatCurrency(order.agreedPrice)} highlight="blue" />
            )}
          </div>

          {risk === "high" && order.status !== "Confirmed" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span className="font-semibold">High Risk — deadline in under 6 hours!</span>
            </div>
          )}

          {/* Capable drivers */}
          <div>
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <UserCheck size={14} /> Capable Drivers ({capableDrivers.length})
            </h3>

            {capableDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">No drivers with sufficient capacity ({order.weightTon}t required).</p>
            ) : (
              <div className="space-y-2">
                {capableDrivers.map(driver => {
                  const offer = relatedOffers.find(o => o.driverId === driver.id);
                  const isAvailable = driver.status === "Available";
                  const savings = offer ? order.budgetGel - offer.priceGel : null;
                  const manualRaw = manualPrices[driver.id] ?? "";
                  const canBeSelected = order.status === "New" || order.status === "Driver Selected";

                  return (
                    <div
                      key={driver.id}
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        offer && isAvailable
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/10"
                          : "border-card-border bg-background"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Driver name row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{driver.name}</span>
                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star size={11} className="fill-amber-400" /> {driver.rating}
                            </span>
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", driverStatusColor(driver.status))}>
                              {driver.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {driver.vehicle} · {driver.capacity}t · {driver.city} · {driver.phone}
                          </div>

                          {/* Offer info */}
                          {offer && (
                            <div className="text-xs mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-primary">{formatCurrency(offer.priceGel)}</span>
                              {savings !== null && (
                                <span className={cn("font-medium", savings >= 0 ? "text-emerald-600" : "text-red-500")}>
                                  ({savings >= 0 ? `saves ${formatCurrency(savings)}` : `${formatCurrency(-savings)} over budget`})
                                </span>
                              )}
                              <span className="text-muted-foreground">· {offer.arrivalTime}</span>
                              {offer.comment && <span className="text-muted-foreground">· {offer.comment}</span>}
                            </div>
                          )}

                          {/* Manual price input for drivers without offer */}
                          {!offer && canBeSelected && (
                            <div className="mt-2 flex items-center gap-2">
                              <DollarSign size={13} className="text-muted-foreground flex-shrink-0" />
                              <input
                                type="number"
                                min="1"
                                placeholder={`Budget: ${order.budgetGel}`}
                                value={manualRaw}
                                onChange={e => setManualPrices(p => ({ ...p, [driver.id]: e.target.value }))}
                                className="w-36 px-2 py-1 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                              <span className="text-xs text-muted-foreground">GEL (manual)</span>
                            </div>
                          )}

                          {!isAvailable && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Currently {driver.status} — can still assign
                            </p>
                          )}
                        </div>

                        {/* Select button */}
                        {canBeSelected && (
                          <button
                            onClick={() => handleSelect(driver, offer ?? null)}
                            className={cn(
                              "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity",
                              offer
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "bg-secondary text-secondary-foreground hover:opacity-80 border border-border"
                            )}
                          >
                            Select <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incapable drivers (collapsed) */}
          {incapableDrivers.length > 0 && (
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                {incapableDrivers.length} driver{incapableDrivers.length > 1 ? "s" : ""} with insufficient capacity (need {order.weightTon}t)
              </summary>
              <div className="mt-2 space-y-1.5 pl-3">
                {incapableDrivers.map(d => (
                  <div key={d.id} className="text-xs text-muted-foreground flex items-center gap-2 opacity-60">
                    <span className="font-medium">{d.name}</span>
                    <span>{d.vehicle} · {d.capacity}t (need {order.weightTon}t)</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Actions footer */}
        <div className="flex gap-2 p-5 border-t border-card-border flex-shrink-0">
          {order.status === "Driver Selected" && (
            <button
              onClick={() => { confirmOrder(order.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 size={15} /> Confirm Order
            </button>
          )}
          {(order.status === "Confirmed" || order.status === "Cancelled") && (
            <button
              onClick={() => { if (confirm("Reopen this order as New?")) { reopenOrder(order.id); } }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              ↩ Reopen
            </button>
          )}
          {(order.status === "New" || order.status === "Driver Selected") && (
            <button
              onClick={() => {
                if (confirm(`Cancel order ${order.id}?`)) {
                  cancelOrder(order.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <X size={15} /> Cancel Order
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, highlight }: { label: string; value: string; highlight?: "red" | "amber" | "blue" }) {
  return (
    <div className="bg-muted/40 rounded-lg p-2.5">
      <div className="text-xs text-muted-foreground font-medium mb-0.5">{label}</div>
      <div className={cn(
        "text-sm font-semibold",
        highlight === "red" && "text-red-600 dark:text-red-400",
        highlight === "amber" && "text-amber-600 dark:text-amber-400",
        highlight === "blue" && "text-primary",
      )}>
        {value}
      </div>
    </div>
  );
}
