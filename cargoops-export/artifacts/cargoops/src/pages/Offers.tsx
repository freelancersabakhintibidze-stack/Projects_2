import { useState, useMemo, useCallback } from "react";
import { useCargo } from "../store/CargoContext";
import { OfferModal } from "../components/modals/OfferModal";
import { formatCurrency, cn } from "../lib/utils";
import { Plus, Trash2, Star, AlertTriangle, CheckCircle, TrendingDown, Search } from "lucide-react";
import type { Order, Driver, Offer } from "../types";

// Explicit types so all destructuring is fully typed
type EnrichedOffer = {
  offer: Offer;
  order: Order | undefined;
  driver: Driver | undefined;
  capacityOk: boolean;
  savings: number | null;
};

type DisplayGroup = {
  orderId: string;
  order: Order | undefined;
  items: EnrichedOffer[];
  bestItem: EnrichedOffer | undefined;
};

export function Offers() {
  const { offers, orders, drivers, deleteOffer } = useCargo();
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedOrderId, setPreselectedOrderId] = useState<string | undefined>();
  const [filterOrderId, setFilterOrderId] = useState("All");
  const [search, setSearch] = useState("");

  const enriched = useMemo((): EnrichedOffer[] => {
    return offers.map(offer => {
      const order = orders.find(o => o.id === offer.orderId);
      const driver = drivers.find(d => d.id === offer.driverId);
      const capacityOk = driver ? driver.capacity >= (order?.weightTon ?? 0) : false;
      const savings = order ? order.budgetGel - offer.priceGel : null;
      return { offer, order, driver, capacityOk, savings };
    });
  }, [offers, orders, drivers]);

  const uniqueOrderIds = useMemo(() =>
    [...new Set(offers.map(o => o.orderId))].sort(),
    [offers]
  );

  const filteredByOrder = useMemo((): EnrichedOffer[] =>
    filterOrderId === "All" ? enriched : enriched.filter(e => e.offer.orderId === filterOrderId),
    [enriched, filterOrderId]
  );

  const displayGroups = useMemo((): DisplayGroup[] => {
    const s = search.toLowerCase().trim();
    const ids = filterOrderId === "All" ? uniqueOrderIds : [filterOrderId];
    const result: DisplayGroup[] = [];
    for (const orderId of ids) {
      let items = filteredByOrder.filter(e => e.offer.orderId === orderId);
      if (s) {
        items = items.filter(e =>
          (e.driver?.name ?? "").toLowerCase().includes(s) ||
          (e.order?.pickupCity ?? "").toLowerCase().includes(s) ||
          (e.order?.deliveryCity ?? "").toLowerCase().includes(s)
        );
      }
      if (items.length === 0) continue;
      const bestItem = [...items]
        .filter(e => e.capacityOk)
        .sort((a, b) => a.offer.priceGel - b.offer.priceGel)[0];
      result.push({ orderId, order: orders.find(o => o.id === orderId), items, bestItem });
    }
    return result;
  }, [filteredByOrder, filterOrderId, uniqueOrderIds, orders, search]);

  function openAddOffer(orderId?: string) {
    setPreselectedOrderId(orderId);
    setModalOpen(true);
  }

  const handleDelete = useCallback((offerId: string) => {
    if (confirm("Remove this offer?")) deleteOffer(offerId);
  }, [deleteOffer]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Price Offers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {offers.length} offers across {uniqueOrderIds.length} orders
          </p>
        </div>
        <button
          onClick={() => openAddOffer()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Offer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-card border border-card-border rounded-xl p-3">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-8 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search driver or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <label className="text-sm font-medium text-muted-foreground">Order:</label>
        <select
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterOrderId}
          onChange={e => setFilterOrderId(e.target.value)}
        >
          <option value="All">All Orders</option>
          {uniqueOrderIds.map(id => {
            const o = orders.find(ord => ord.id === id);
            return (
              <option key={id} value={id}>
                {id}{o ? ` — ${o.pickupCity} → ${o.deliveryCity}` : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Empty state */}
      {displayGroups.length === 0 && (
        <div className="text-center py-20 text-muted-foreground bg-card border border-card-border rounded-xl">
          <div className="text-5xl mb-4">💰</div>
          <p className="font-semibold text-lg">No offers yet</p>
          <p className="text-sm mt-1">Click "Add Offer" to record a driver's price proposal.</p>
        </div>
      )}

      {/* Groups */}
      {displayGroups.map(({ orderId, order, items, bestItem }) => (
        <div key={orderId} className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          {/* Group header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-muted/20 border-b border-card-border">
            <div className="min-w-0">
              <div className="font-bold text-base">{orderId}</div>
              {order && (
                <div className="text-sm text-muted-foreground mt-0.5 truncate">
                  {order.pickupCity} → {order.deliveryCity} · {order.cargo} · {order.weightTon}t ·{" "}
                  Budget:{" "}
                  <span className="font-semibold text-foreground">{formatCurrency(order.budgetGel)}</span>
                  {" · "}
                  <span className={cn(
                    "font-medium",
                    order.status === "Confirmed" && "text-emerald-600",
                    order.status === "Cancelled" && "text-muted-foreground",
                    order.status === "New" && "text-blue-600",
                    order.status === "Driver Selected" && "text-purple-600",
                  )}>
                    {order.status}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {bestItem && (
                <div className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                  <TrendingDown size={13} />
                  Best: {formatCurrency(bestItem.offer.priceGel)} · {bestItem.driver?.name}
                </div>
              )}
              <button
                onClick={() => openAddOffer(orderId)}
                className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Offer rows */}
          <div className="divide-y divide-card-border">
            {items.map(({ offer, driver, capacityOk, savings }) => {
              const isBest = bestItem?.offer.offerId === offer.offerId;
              return (
                <div
                  key={offer.offerId}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors",
                    !capacityOk && "opacity-60"
                  )}
                >
                  {/* Driver info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{driver?.name ?? offer.driverId}</span>
                      {driver && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star size={11} className="fill-amber-400" />{driver.rating}
                        </span>
                      )}
                      {isBest && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                          Best Price
                        </span>
                      )}
                      {!capacityOk && (
                        <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded">
                          Insufficient capacity
                        </span>
                      )}
                    </div>
                    {driver && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {driver.vehicle} · {driver.capacity}t · {driver.city} · {driver.status}
                      </div>
                    )}
                    {offer.comment && (
                      <div className="text-xs text-muted-foreground mt-0.5 italic">"{offer.comment}"</div>
                    )}
                  </div>

                  {/* Arrival */}
                  <div className="flex-shrink-0 text-center hidden sm:block">
                    <div className="text-xs font-medium">{offer.arrivalTime}</div>
                    <div className="text-xs text-muted-foreground">Arrival</div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-lg text-primary">{formatCurrency(offer.priceGel)}</div>
                    {savings !== null && (
                      <div className={cn("text-xs font-medium", savings >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {savings >= 0 ? `saves ${formatCurrency(savings)}` : `${formatCurrency(-savings)} over`}
                      </div>
                    )}
                  </div>

                  {/* Capacity indicator */}
                  <div className="flex-shrink-0">
                    {capacityOk
                      ? <CheckCircle size={18} className="text-emerald-500" />
                      : <AlertTriangle size={18} className="text-red-500" />
                    }
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(offer.offerId)}
                    className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
                    title="Remove offer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <OfferModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPreselectedOrderId(undefined); }}
        preselectedOrderId={preselectedOrderId}
      />
    </div>
  );
}
