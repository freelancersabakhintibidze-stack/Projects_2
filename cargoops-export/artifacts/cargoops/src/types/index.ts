export type Priority = "High" | "Medium" | "Low";
export type OrderStatus = "New" | "Driver Selected" | "Confirmed" | "Cancelled";
export type DriverStatus = "Available" | "On the road" | "Busy";

export interface Order {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  cargo: string;
  weightTon: number;
  budgetGel: number;
  deadline: string;
  priority: Priority;
  status: OrderStatus;
  selectedDriverId?: string;
  agreedPrice?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  capacity: number;
  city: string;
  status: DriverStatus;
  rating: number;
}

export interface Offer {
  offerId: string;
  orderId: string;
  driverId: string;
  priceGel: number;
  arrivalTime: string;
  comment: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}
