import { useState, useCallback } from "react";
import type { Order, Driver, Offer, LogEntry, OrderStatus, DriverStatus } from "../types";

const STORAGE_ORDERS = "cargo_orders";
const STORAGE_DRIVERS = "cargo_drivers";
const STORAGE_OFFERS = "cargo_offers";
const STORAGE_LOG = "cargo_log";
const STORAGE_DARK = "cargo_dark_mode";

const pad = (n: number) => String(n).padStart(2, "0");

const NOW = new Date();
const isoDate = (daysFromNow: number, hour = 12, minute = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const initialOrders: Order[] = [
  { id: "ORD-101", pickupCity: "Tbilisi", deliveryCity: "Batumi", cargo: "Food Products", weightTon: 4.2, budgetGel: 1800, deadline: isoDate(0, 18, 0), priority: "High", status: "New" },
  { id: "ORD-102", pickupCity: "Rustavi", deliveryCity: "Kutaisi", cargo: "Home Appliances", weightTon: 2.8, budgetGel: 1200, deadline: isoDate(1, 12, 0), priority: "Medium", status: "New" },
  { id: "ORD-103", pickupCity: "Poti", deliveryCity: "Tbilisi", cargo: "Warehouse Material", weightTon: 7.5, budgetGel: 2600, deadline: isoDate(2, 9, 0), priority: "High", status: "New" },
  { id: "ORD-104", pickupCity: "Gori", deliveryCity: "Zugdidi", cargo: "Furniture", weightTon: 3.1, budgetGel: 1450, deadline: isoDate(1, 20, 0), priority: "Low", status: "New" },
  { id: "ORD-105", pickupCity: "Tbilisi", deliveryCity: "Yerevan", cargo: "Textiles", weightTon: 5.0, budgetGel: 3100, deadline: isoDate(3, 10, 0), priority: "Medium", status: "New" },
];

export const initialDrivers: Driver[] = [
  { id: "DRV-1", name: "Giorgi Beridze", phone: "+995 555 000 001", vehicle: "Van", capacity: 3, city: "Tbilisi", status: "Available", rating: 4.7 },
  { id: "DRV-2", name: "Levani Kvaratskhelia", phone: "+995 555 000 002", vehicle: "Mercedes Sprinter", capacity: 2.5, city: "Rustavi", status: "On the road", rating: 4.5 },
  { id: "DRV-3", name: "Daviti Tatanashvili", phone: "+995 555 000 003", vehicle: "Refrigerator Truck", capacity: 5, city: "Tbilisi", status: "Available", rating: 4.9 },
  { id: "DRV-4", name: "Nika Lomidze", phone: "+995 555 000 004", vehicle: "Tarpaulin Truck", capacity: 8, city: "Poti", status: "Available", rating: 4.3 },
  { id: "DRV-5", name: "Irakli Jugheli", phone: "+995 555 000 005", vehicle: "Euro-truck", capacity: 20, city: "Batumi", status: "Busy", rating: 4.6 },
];

export const initialOffers: Offer[] = [
  { offerId: "OFF-101-1", orderId: "ORD-101", driverId: "DRV-3", priceGel: 1700, arrivalTime: "In 2 hours", comment: "Has a refrigerator truck" },
  { offerId: "OFF-101-2", orderId: "ORD-101", driverId: "DRV-1", priceGel: 1550, arrivalTime: "In 1 hour", comment: "Smaller van, check capacity" },
  { offerId: "OFF-102-1", orderId: "ORD-102", driverId: "DRV-2", priceGel: 1100, arrivalTime: "Tomorrow 10:00", comment: "Sprinter is available" },
  { offerId: "OFF-103-1", orderId: "ORD-103", driverId: "DRV-4", priceGel: 2500, arrivalTime: "In 3 hours", comment: "Suitable truck, large capacity" },
  { offerId: "OFF-105-1", orderId: "ORD-105", driverId: "DRV-5", priceGel: 3000, arrivalTime: "Tomorrow morning", comment: "Knows international routes" },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function nowTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nextOrderId(existingOrders: Order[]): string {
  const nums = existingOrders
    .map(o => parseInt(o.id.replace("ORD-", ""), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 100;
  return `ORD-${max + 1}`;
}

function nextDriverId(existingDrivers: Driver[]): string {
  const nums = existingDrivers
    .map(d => parseInt(d.id.replace("DRV-", ""), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `DRV-${max + 1}`;
}

export function useCargoStore() {
  const [orders, setOrdersRaw] = useState<Order[]>(() => {
    const stored = load<Order[] | null>(STORAGE_ORDERS, null);
    return stored && stored.length > 0 ? stored : initialOrders;
  });
  const [drivers, setDriversRaw] = useState<Driver[]>(() => {
    const stored = load<Driver[] | null>(STORAGE_DRIVERS, null);
    return stored && stored.length > 0 ? stored : initialDrivers;
  });
  const [offers, setOffersRaw] = useState<Offer[]>(() => {
    const stored = load<Offer[] | null>(STORAGE_OFFERS, null);
    return stored !== null ? stored : initialOffers;
  });
  const [logEntries, setLogEntriesRaw] = useState<LogEntry[]>(() =>
    load<LogEntry[]>(STORAGE_LOG, [])
  );
  const [darkMode, setDarkModeRaw] = useState<boolean>(() =>
    load<boolean>(STORAGE_DARK, false)
  );

  // ─── Persistent setters ────────────────────────────────────────────────────

  const setOrders = useCallback((v: Order[] | ((prev: Order[]) => Order[])) => {
    setOrdersRaw(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      save(STORAGE_ORDERS, next);
      return next;
    });
  }, []);

  const setDrivers = useCallback((v: Driver[] | ((prev: Driver[]) => Driver[])) => {
    setDriversRaw(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      save(STORAGE_DRIVERS, next);
      return next;
    });
  }, []);

  const setOffers = useCallback((v: Offer[] | ((prev: Offer[]) => Offer[])) => {
    setOffersRaw(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      save(STORAGE_OFFERS, next);
      return next;
    });
  }, []);

  const addLog = useCallback((action: string, details = "") => {
    const entry: LogEntry = { id: shortId(), timestamp: nowTimestamp(), action, details };
    setLogEntriesRaw(prev => {
      const next = [entry, ...prev].slice(0, 500);
      save(STORAGE_LOG, next);
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    setLogEntriesRaw([]);
    save(STORAGE_LOG, []);
  }, []);

  const setDarkMode = useCallback((v: boolean) => {
    setDarkModeRaw(v);
    save(STORAGE_DARK, v);
  }, []);

  // ─── Order actions ─────────────────────────────────────────────────────────

  const addOrder = useCallback((data: Omit<Order, "id" | "status">) => {
    let newOrder!: Order;
    setOrders(prev => {
      newOrder = { ...data, id: nextOrderId(prev), status: "New" };
      return [...prev, newOrder];
    });
    // log after state update queued; use the captured newOrder ref
    setTimeout(() => addLog("Order Added", `${newOrder.id} – ${data.pickupCity} → ${data.deliveryCity}`), 0);
    return newOrder;
  }, [setOrders, addLog]);

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
    addLog("Order Updated", id);
  }, [setOrders, addLog]);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setOffers(prev => prev.filter(o => o.orderId !== id));
    addLog("Order Deleted", id);
  }, [setOrders, setOffers, addLog]);

  const duplicateOrder = useCallback((id: string) => {
    setOrders(prev => {
      const original = prev.find(o => o.id === id);
      if (!original) return prev;
      const copy: Order = {
        ...original,
        id: nextOrderId(prev),
        status: "New",
        selectedDriverId: undefined,
        agreedPrice: undefined,
      };
      addLog("Order Duplicated", `${copy.id} from ${id}`);
      return [...prev, copy];
    });
  }, [setOrders, addLog]);

  const selectDriver = useCallback((orderId: string, driverId: string, agreedPrice: number) => {
    const driver = drivers.find(d => d.id === driverId);
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: "Driver Selected", selectedDriverId: driverId, agreedPrice }
          : o
      )
    );
    addLog("Driver Selected", `Order ${orderId} → ${driver?.name ?? driverId}, ${agreedPrice} GEL`);
  }, [drivers, setOrders, addLog]);

  const confirmOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Confirmed" } : o));
    addLog("Order Confirmed", orderId);
  }, [setOrders, addLog]);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
    addLog("Order Cancelled", orderId);
  }, [setOrders, addLog]);

  const reopenOrder = useCallback((orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: "New", selectedDriverId: undefined, agreedPrice: undefined }
          : o
      )
    );
    addLog("Order Reopened", orderId);
  }, [setOrders, addLog]);

  // ─── Driver actions ────────────────────────────────────────────────────────

  const addDriver = useCallback((data: Omit<Driver, "id">) => {
    setDrivers(prev => {
      const newDriver: Driver = { ...data, id: nextDriverId(prev) };
      addLog("Driver Added", newDriver.name);
      return [...prev, newDriver];
    });
  }, [setDrivers, addLog]);

  const updateDriver = useCallback((id: string, patch: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    addLog("Driver Updated", id);
  }, [setDrivers, addLog]);

  const deleteDriver = useCallback((id: string) => {
    const driver = drivers.find(d => d.id === id);
    setDrivers(prev => prev.filter(d => d.id !== id));
    setOffers(prev => prev.filter(o => o.driverId !== id));
    addLog("Driver Deleted", driver?.name ?? id);
  }, [drivers, setDrivers, setOffers, addLog]);

  const cycleDriverStatus = useCallback((driverId: string) => {
    const statuses: DriverStatus[] = ["Available", "On the road", "Busy"];
    setDrivers(prev => {
      const driver = prev.find(d => d.id === driverId);
      if (!driver) return prev;
      const next = statuses[(statuses.indexOf(driver.status) + 1) % statuses.length];
      addLog("Driver Status Changed", `${driver.name} → ${next}`);
      return prev.map(d => d.id === driverId ? { ...d, status: next } : d);
    });
  }, [setDrivers, addLog]);

  // ─── Offer actions ─────────────────────────────────────────────────────────

  const addOffer = useCallback((offer: Omit<Offer, "offerId">) => {
    const newOffer: Offer = { ...offer, offerId: `OFF-${shortId()}` };
    setOffers(prev => [...prev, newOffer]);
    addLog("Offer Added", `Order ${offer.orderId}, Driver ${offer.driverId}`);
  }, [setOffers, addLog]);

  const deleteOffer = useCallback((offerId: string) => {
    setOffers(prev => prev.filter(o => o.offerId !== offerId));
    addLog("Offer Deleted", offerId);
  }, [setOffers, addLog]);

  // ─── System actions ────────────────────────────────────────────────────────

  const resetToDemo = useCallback(() => {
    save(STORAGE_ORDERS, initialOrders);
    save(STORAGE_DRIVERS, initialDrivers);
    save(STORAGE_OFFERS, initialOffers);
    save(STORAGE_LOG, []);
    setOrdersRaw(initialOrders);
    setDriversRaw(initialDrivers);
    setOffersRaw(initialOffers);
    setLogEntriesRaw([]);
    // Add the log entry after state resets
    const entry: LogEntry = { id: shortId(), timestamp: nowTimestamp(), action: "System", details: "Demo data restored" };
    const next = [entry];
    save(STORAGE_LOG, next);
    setLogEntriesRaw(next);
  }, []);

  const clearAllData = useCallback(() => {
    save(STORAGE_ORDERS, initialOrders);
    save(STORAGE_DRIVERS, initialDrivers);
    save(STORAGE_OFFERS, []);
    save(STORAGE_LOG, []);
    setOrdersRaw(initialOrders);
    setDriversRaw(initialDrivers);
    setOffersRaw([]);
    setLogEntriesRaw([]);
  }, []);

  return {
    orders, drivers, offers, logEntries, darkMode,
    setDarkMode, addLog,
    addOrder, updateOrder, deleteOrder, duplicateOrder, reopenOrder,
    selectDriver, confirmOrder, cancelOrder,
    addDriver, updateDriver, deleteDriver, cycleDriverStatus,
    addOffer, deleteOffer,
    resetToDemo, clearAllData, clearLog,
  };
}
