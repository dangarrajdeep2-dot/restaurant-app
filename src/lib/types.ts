// ─── Restaurant Info ──────────────────────────────────────────────────────────
export interface RestaurantConfig {
  name: string;
  tagline: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  hours: { day: string; open: string; close: string }[];
  currency: string;
  currencySymbol: string;
  taxRate: number; // as decimal e.g. 0.05 = 5%
  serviceChargeRate?: number; // e.g. 0.02 = 2%
  primaryColor: string;
  wifiPassword?: string;
  gstNumber?: string;
  announcement?: string;
  isOrderingEnabled?: boolean;
  upiId?: string; // Merchant VPA e.g. royalsaffron@upi or 9876543210@paytm
  upiName?: string; // Payee Name displayed on UPI apps
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export type TagType = 'veg' | 'non-veg' | 'vegan' | 'spicy' | 'chef-special' | 'new' | 'gluten-free';

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  tags: TagType[] | string[];
  isAvailable: boolean;
  isPopular: boolean;
  allergens?: string[];
  preparationTime?: number; // minutes
  sortOrder: number;
}

// ─── Table ────────────────────────────────────────────────────────────────────
export type TableStatus = 'available' | 'occupied' | 'billing' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  number: string;
  seats: number;
  section?: 'Indoor' | 'Outdoor' | 'Terrace' | 'Bar' | 'Private' | string;
  qrCode?: string;
  status: TableStatus;
  activeOrderCount?: number;
  activeTotal?: number;
  lastActivity?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number; // server-validated price at time of order
  quantity: number;
  specialInstructions?: string;
  isCompletedInKitchen?: boolean; // Kitchen item-level checklist
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableNumber: string;
  sessionToken: string; // for anonymous customer access
  waiterName?: string; // name of staff / waiter who punched the order
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  total: number;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number; // minutes
  notes?: string; // staff notes
}

// ─── Service / Waiter Call Request ────────────────────────────────────────────
export type ServiceRequestType = 'call_waiter' | 'water' | 'clean_table' | 'bill';
export type ServiceRequestStatus = 'pending' | 'acknowledged' | 'completed';

export interface ServiceRequest {
  id: string;
  tableId: string;
  tableNumber: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  message?: string;
  createdAt: string;
  acknowledgedAt?: string;
}

// ─── Billing / Settlement ─────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface Bill {
  id: string;
  billNumber: string;
  tableId: string;
  tableNumber: string;
  orderIds: string[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  discountReason?: string;
  total: number;
  paymentMethod?: PaymentMethod;
  status: 'unpaid' | 'paid';
  paidAt?: string;
  createdAt: string;
}

// ─── Auth / Staff ─────────────────────────────────────────────────────────────
export type StaffRole = 'admin' | 'kitchen' | 'waiter';

export interface StaffUser {
  uid: string;
  email: string;
  username?: string;
  password?: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  phone?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'new_order' | 'order_ready' | 'order_cancelled' | 'low_stock' | 'call_waiter';
  message: string;
  orderId?: string;
  tableNumber?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
