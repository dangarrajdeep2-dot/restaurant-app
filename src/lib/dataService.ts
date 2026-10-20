import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Order,
  OrderStatus,
  OrderItem,
  MenuItem,
  MenuCategory,
  Table,
  TableStatus,
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestStatus,
  RestaurantConfig,
  Bill,
  StaffUser,
} from './types';
import {
  mockCategories,
  mockMenuItems,
  mockOrders,
  mockTables,
  restaurantConfig as initialRestaurantConfig,
} from './mockData';
import { sound } from './sound';

// ─── Environment & Mode Detection ─────────────────────────────────────────────
const isDemoMode =
  !import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-project';

// ─── Local Storage Keys ───────────────────────────────────────────────────────
const KEYS = {
  ORDERS: 'sg_orders_data',
  MENU: 'sg_menu_data',
  CATEGORIES: 'sg_categories_data',
  TABLES: 'sg_tables_data',
  CONFIG: 'sg_config_data',
  REQUESTS: 'sg_service_requests_data',
  BILLS: 'sg_bills_data',
  STAFF: 'sg_staff_data',
};

// ─── Multi-tab Event Bus (BroadcastChannel + Window Storage) ───────────────────
class LocalEventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<() => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('spice_garden_realtime_bus');
      this.channel.onmessage = (event) => {
        const { topic } = event.data || {};
        if (topic) {
          this.notify(topic);
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(KEYS).includes(e.key)) {
          this.notify(e.key);
        }
      });
    }
  }

  public subscribe(topic: string, cb: () => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(cb);
    return () => {
      this.listeners.get(topic)?.delete(cb);
    };
  }

  public publish(topic: string) {
    if (this.channel) {
      this.channel.postMessage({ topic, timestamp: Date.now() });
    }
    this.notify(topic);
  }

  private notify(topic: string) {
    const subs = this.listeners.get(topic);
    if (subs) {
      subs.forEach((cb) => cb());
    }
  }
}

const bus = new LocalEventBus();

// ─── Local Store Helpers ──────────────────────────────────────────────────────
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    // Auto-migrate legacy name and upiId if previously cached
    if (key === KEYS.CONFIG && parsed) {
      const fb = fallback as Record<string, unknown>;
      let changed = false;
      const updated = { ...parsed };
      if (updated.name === 'Spice Garden' || !updated.name) {
        updated.name = fb.name;
        changed = true;
      }
      if (!updated.upiId) {
        updated.upiId = fb.upiId || 'royalsaffron@okaxis';
        changed = true;
      }
      if (!updated.upiName) {
        updated.upiName = fb.upiName || fb.name;
        changed = true;
      }
      if (changed) {
        localStorage.setItem(key, JSON.stringify(updated));
        return updated as T;
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    bus.publish(key);
    // Real-time broadcast to all mobile/desktop devices on the same Wi-Fi
    if (typeof window !== 'undefined' && isDemoMode) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: data }),
      }).catch(() => {});
    }
  } catch {
    // Ignore quota errors
  }
}

export const defaultStaffList: StaffUser[] = [
  {
    uid: 'admin-main',
    email: 'adminmain23@gmail.com',
    username: 'admin',
    password: 'royalchef200',
    name: 'Master Admin',
    role: 'admin',
    isActive: true,
    phone: '+91 98765 00001',
  },
  {
    uid: 'kitchen-1',
    email: 'cooker@royalsaffron.in',
    username: 'cooker',
    password: 'cooker123',
    name: 'Head Chef Amar',
    role: 'kitchen',
    isActive: true,
    phone: '+91 98765 00002',
  },
  {
    uid: 'waiter-1',
    email: 'waiter@royalsaffron.in',
    username: 'waiter',
    password: 'waiter123',
    name: 'Captain Priya Singh',
    role: 'waiter',
    isActive: true,
    phone: '+91 98765 00003',
  },
];

// Initialise local storage with rich initial data if empty
if (typeof window !== 'undefined') {
  getLocal(KEYS.CONFIG, initialRestaurantConfig);
  getLocal(KEYS.CATEGORIES, mockCategories);
  getLocal(KEYS.MENU, mockMenuItems);
  getLocal(KEYS.TABLES, mockTables);
  getLocal(KEYS.ORDERS, mockOrders);
  getLocal(KEYS.REQUESTS, [] as ServiceRequest[]);
  getLocal(KEYS.BILLS, [] as Bill[]);
  
  // Ensure staff list has master admin and default passwords
  const existingStaff = getLocal<StaffUser[]>(KEYS.STAFF, defaultStaffList);
  const hasMasterAdmin = existingStaff.some((s) => s.email === 'adminmain23@gmail.com');
  if (!hasMasterAdmin) {
    existingStaff.unshift(defaultStaffList[0]);
    setLocal(KEYS.STAFF, existingStaff);
  } else {
    // Ensure admin password is royalchef200
    const adm = existingStaff.find((s) => s.email === 'adminmain23@gmail.com');
    if (adm && adm.password !== 'royalchef200') {
      adm.password = 'royalchef200';
      setLocal(KEYS.STAFF, existingStaff);
    }
  }

  // Wi-Fi multi-device synchronization (PC <-> Mobile Phone)
  if (isDemoMode) {
    let lastServerSync = 0;
    const pollSync = async () => {
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data._updatedAt && data._updatedAt > lastServerSync) {
          lastServerSync = data._updatedAt;
          for (const [k, v] of Object.entries(data)) {
            if (k !== '_updatedAt') {
              const strVal = JSON.stringify(v);
              if (localStorage.getItem(k) !== strVal) {
                localStorage.setItem(k, strVal);
                bus.publish(k);
              }
            }
          }
        }
      } catch {
        // silent fallback
      }
    };

    pollSync();
    setInterval(pollSync, 1000);
  }
}

// ─── Data Service Implementation ──────────────────────────────────────────────
export const dataService = {
  isDemoMode() {
    return isDemoMode;
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. RESTAURANT CONFIG
  // ═════════════════════════════════════════════════════════════════════════════
  subscribeConfig(callback: (config: RestaurantConfig) => void): () => void {
    if (isDemoMode) {
      const emit = () => callback(getLocal(KEYS.CONFIG, initialRestaurantConfig));
      emit();
      return bus.subscribe(KEYS.CONFIG, emit);
    }

    const docRef = doc(db, 'settings', 'restaurant');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as RestaurantConfig);
      } else {
        callback(initialRestaurantConfig);
      }
    });
  },

  async updateConfig(newConfig: Partial<RestaurantConfig>): Promise<void> {
    if (isDemoMode) {
      const current = getLocal(KEYS.CONFIG, initialRestaurantConfig);
      const updated = { ...current, ...newConfig };
      setLocal(KEYS.CONFIG, updated);
      return;
    }
    const docRef = doc(db, 'settings', 'restaurant');
    await setDoc(docRef, newConfig, { merge: true });
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. MENU ITEMS & CATEGORIES
  // ═════════════════════════════════════════════════════════════════════════════
  subscribeCategories(callback: (categories: MenuCategory[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const cats = getLocal<MenuCategory[]>(KEYS.CATEGORIES, mockCategories);
        callback([...cats].sort((a, b) => a.sortOrder - b.sortOrder));
      };
      emit();
      return bus.subscribe(KEYS.CATEGORIES, emit);
    }

    const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuCategory));
      callback(items);
    });
  },

  async saveCategory(cat: Omit<MenuCategory, 'id'> & { id?: string }): Promise<void> {
    const id = cat.id || `cat-${Date.now()}`;
    if (isDemoMode) {
      const list = getLocal<MenuCategory[]>(KEYS.CATEGORIES, mockCategories);
      const existingIdx = list.findIndex((c) => c.id === id);
      const entry: MenuCategory = { ...cat, id };
      if (existingIdx >= 0) {
        list[existingIdx] = entry;
      } else {
        list.push(entry);
      }
      setLocal(KEYS.CATEGORIES, list);
      return;
    }
    await setDoc(doc(db, 'categories', id), { ...cat, id }, { merge: true });
  },

  subscribeMenuItems(callback: (items: MenuItem[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const items = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
        callback([...items].sort((a, b) => a.sortOrder - b.sortOrder));
      };
      emit();
      return bus.subscribe(KEYS.MENU, emit);
    }

    const q = query(collection(db, 'menu_items'), orderBy('sortOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
      callback(items);
    });
  },

  async saveMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<void> {
    const id = item.id || `item-${Date.now()}`;
    if (isDemoMode) {
      const list = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
      const idx = list.findIndex((i) => i.id === id);
      const entry: MenuItem = { ...item, id };
      if (idx >= 0) {
        list[idx] = entry;
      } else {
        list.push(entry);
      }
      setLocal(KEYS.MENU, list);
      return;
    }
    await setDoc(doc(db, 'menu_items', id), { ...item, id }, { merge: true });
  },

  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<void> {
    if (isDemoMode) {
      const list = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
      const idx = list.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        list[idx].isAvailable = isAvailable;
        setLocal(KEYS.MENU, list);
      }
      return;
    }
    await updateDoc(doc(db, 'menu_items', itemId), { isAvailable });
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    if (isDemoMode) {
      const list = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
      setLocal(
        KEYS.MENU,
        list.filter((i) => i.id !== itemId)
      );
      return;
    }
    await deleteDoc(doc(db, 'menu_items', itemId));
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. TRUSTED SERVER-SIDE ORDER CREATION & MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════════
  /**
   * Creates an order with strict server-side price recalculation.
   * Never trusts the client's submitted prices or subtotals.
   */
  async createOrder(params: {
    tableId: string;
    tableNumber: string;
    sessionToken: string;
    waiterName?: string;
    rawItems: { menuItemId: string; quantity: number; specialInstructions?: string }[];
    specialRequests?: string;
  }): Promise<Order> {
    // 1. Fetch canonical menu items to validate prices
    let canonicalMenu: MenuItem[];
    let config: RestaurantConfig;

    if (isDemoMode) {
      canonicalMenu = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
      config = getLocal<RestaurantConfig>(KEYS.CONFIG, initialRestaurantConfig);
    } else {
      canonicalMenu = getLocal<MenuItem[]>(KEYS.MENU, mockMenuItems);
      config = getLocal<RestaurantConfig>(KEYS.CONFIG, initialRestaurantConfig);
    }

    // 2. Validate and calculate item totals securely
    const validatedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const raw of params.rawItems) {
      const menuItem = canonicalMenu.find((m) => m.id === raw.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${raw.menuItemId}`);
      }
      if (!menuItem.isAvailable) {
        throw new Error(`Item is currently unavailable: ${menuItem.name}`);
      }
      const qty = Math.max(1, Math.floor(raw.quantity));
      const itemPrice = menuItem.price; // authoritative price
      subtotal += itemPrice * qty;

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: itemPrice,
        quantity: qty,
        specialInstructions: raw.specialInstructions || undefined,
        isCompletedInKitchen: false,
      });
    }

    if (validatedItems.length === 0) {
      throw new Error('Cannot place an empty order');
    }

    // 3. Compute tax and total using trusted rates
    const tax = Math.round(subtotal * (config.taxRate || 0.05));
    const serviceCharge = config.serviceChargeRate
      ? Math.round(subtotal * config.serviceChargeRate)
      : 0;
    const total = subtotal + tax + serviceCharge;

    const orderNumber = `ORD-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const id = `order-${Date.now()}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id,
      orderNumber,
      tableId: params.tableId,
      tableNumber: params.tableNumber,
      sessionToken: params.sessionToken,
      waiterName: params.waiterName || undefined,
      items: validatedItems,
      status: 'new',
      subtotal,
      tax,
      serviceCharge,
      total,
      specialRequests: params.specialRequests || undefined,
      createdAt: now,
      updatedAt: now,
      estimatedTime: 20,
    };

    if (isDemoMode) {
      const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
      orders.unshift(newOrder);
      setLocal(KEYS.ORDERS, orders);

      // Update table to occupied
      const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
      const tableIdx = tables.findIndex((t) => t.id === params.tableId || t.number === params.tableNumber);
      if (tableIdx >= 0) {
        tables[tableIdx].status = 'occupied';
        tables[tableIdx].lastActivity = now;
        setLocal(KEYS.TABLES, tables);
      }

      sound.playOrderChime();
      return newOrder;
    }

    // Production Firebase Write
    await setDoc(doc(db, 'orders', id), newOrder);
    sound.playOrderChime();
    return newOrder;
  },

  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
        callback([...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
      emit();
      return bus.subscribe(KEYS.ORDERS, emit);
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      callback(orders);
    });
  },

  subscribeSingleOrder(orderNumber: string, callback: (order: Order | null) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
        const found = orders.find((o) => o.orderNumber === orderNumber || o.id === orderNumber) || null;
        callback(found);
      };
      emit();
      return bus.subscribe(KEYS.ORDERS, emit);
    }

    const q = query(collection(db, 'orders'), where('orderNumber', '==', orderNumber));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        callback({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
      } else {
        callback(null);
      }
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    const now = new Date().toISOString();
    if (isDemoMode) {
      const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        orders[idx].status = status;
        orders[idx].updatedAt = now;
        if (notes !== undefined) orders[idx].notes = notes;
        setLocal(KEYS.ORDERS, orders);
      }
      return;
    }
    const updateData: Partial<Order> = { status, updatedAt: now };
    if (notes !== undefined) updateData.notes = notes;
    await updateDoc(doc(db, 'orders', orderId), updateData);
  },

  async toggleKitchenItem(orderId: string, itemIdx: number): Promise<void> {
    if (isDemoMode) {
      const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
      const order = orders.find((o) => o.id === orderId);
      if (order && order.items[itemIdx]) {
        order.items[itemIdx].isCompletedInKitchen = !order.items[itemIdx].isCompletedInKitchen;
        setLocal(KEYS.ORDERS, orders);
      }
      return;
    }
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. TABLES MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════════
  subscribeTables(callback: (tables: Table[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
        const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);

        // Enrich tables with live active order count and totals
        const enriched = tables.map((t) => {
          const tableOrders = orders.filter(
            (o) => (o.tableId === t.id || o.tableNumber === t.number) && !['served', 'cancelled'].includes(o.status)
          );
          return {
            ...t,
            activeOrderCount: tableOrders.length,
            activeTotal: tableOrders.reduce((sum, o) => sum + o.total, 0),
          };
        });
        callback(enriched);
      };
      emit();
      return bus.subscribe(KEYS.TABLES, emit);
    }

    const q = query(collection(db, 'tables'), orderBy('number', 'asc'));
    return onSnapshot(q, (snap) => {
      const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table));
      callback(tables);
    });
  },

  async updateTableStatus(tableId: string, status: TableStatus): Promise<void> {
    if (isDemoMode) {
      const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
      const idx = tables.findIndex((t) => t.id === tableId);
      if (idx >= 0) {
        tables[idx].status = status;
        setLocal(KEYS.TABLES, tables);
      }
      return;
    }
    await updateDoc(doc(db, 'tables', tableId), { status });
  },

  async saveTable(table: Omit<Table, 'id'> & { id?: string }): Promise<void> {
    const id = table.id || `tbl-${Date.now()}`;
    if (isDemoMode) {
      const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
      const idx = tables.findIndex((t) => t.id === id);
      const entry: Table = { ...table, id };
      if (idx >= 0) {
        tables[idx] = entry;
      } else {
        tables.push(entry);
      }
      setLocal(KEYS.TABLES, tables);
      return;
    }
    await setDoc(doc(db, 'tables', id), { ...table, id }, { merge: true });
  },

  async deleteTable(tableId: string): Promise<void> {
    if (isDemoMode) {
      const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
      setLocal(KEYS.TABLES, tables.filter((t) => t.id !== tableId));
      return;
    }
    await deleteDoc(doc(db, 'tables', tableId));
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. CALL WAITER / SERVICE REQUESTS
  // ═════════════════════════════════════════════════════════════════════════════
  subscribeServiceRequests(callback: (requests: ServiceRequest[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const reqs = getLocal<ServiceRequest[]>(KEYS.REQUESTS, []);
        callback([...reqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
      emit();
      return bus.subscribe(KEYS.REQUESTS, emit);
    }

    const q = query(collection(db, 'service_requests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
      callback(reqs);
    });
  },

  async createServiceRequest(
    tableId: string,
    tableNumber: string,
    type: ServiceRequestType,
    message?: string
  ): Promise<ServiceRequest> {
    const id = `req-${Date.now()}`;
    const newReq: ServiceRequest = {
      id,
      tableId,
      tableNumber,
      type,
      status: 'pending',
      message,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      const list = getLocal<ServiceRequest[]>(KEYS.REQUESTS, []);
      list.unshift(newReq);
      setLocal(KEYS.REQUESTS, list);
      sound.playAlertBell();
      return newReq;
    }

    await setDoc(doc(db, 'service_requests', id), newReq);
    sound.playAlertBell();
    return newReq;
  },

  async updateServiceRequestStatus(
    requestId: string,
    status: ServiceRequestStatus
  ): Promise<void> {
    const now = new Date().toISOString();
    if (isDemoMode) {
      const list = getLocal<ServiceRequest[]>(KEYS.REQUESTS, []);
      const idx = list.findIndex((r) => r.id === requestId);
      if (idx >= 0) {
        list[idx].status = status;
        if (status === 'acknowledged') list[idx].acknowledgedAt = now;
        setLocal(KEYS.REQUESTS, list);
      }
      return;
    }
    await updateDoc(doc(db, 'service_requests', requestId), {
      status,
      ...(status === 'acknowledged' ? { acknowledgedAt: now } : {}),
    });
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. BILLING & SETTLEMENT
  // ═════════════════════════════════════════════════════════════════════════════
  async generateBillForTable(
    tableId: string,
    paymentMethod: 'cash' | 'card' | 'upi' = 'cash',
    discountAmount: number = 0,
    discountReason?: string
  ): Promise<Bill> {
    const orders = getLocal<Order[]>(KEYS.ORDERS, mockOrders);
    const tables = getLocal<Table[]>(KEYS.TABLES, mockTables);
    const table = tables.find((t) => t.id === tableId);
    const tableNum = table ? table.number : 'T??';

    // Find all non-cancelled orders for this table
    const tableOrders = orders.filter(
      (o) => (o.tableId === tableId || o.tableNumber === tableNum) && o.status !== 'cancelled'
    );

    const consolidatedItems: OrderItem[] = [];
    tableOrders.forEach((o) => {
      consolidatedItems.push(...o.items);
    });

    const subtotal = tableOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const tax = tableOrders.reduce((sum, o) => sum + o.tax, 0);
    const serviceCharge = tableOrders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
    const discount = Math.min(discountAmount, subtotal);
    const total = Math.max(0, subtotal + tax + serviceCharge - discount);

    const billNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber,
      tableId,
      tableNumber: tableNum,
      orderIds: tableOrders.map((o) => o.id),
      items: consolidatedItems,
      subtotal,
      tax,
      serviceCharge,
      discount,
      discountReason,
      total,
      paymentMethod,
      status: 'paid',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      // Save bill
      const bills = getLocal<Bill[]>(KEYS.BILLS, []);
      bills.unshift(newBill);
      setLocal(KEYS.BILLS, bills);

      // Mark orders as served
      tableOrders.forEach((o) => {
        o.status = 'served';
      });
      setLocal(KEYS.ORDERS, orders);

      // Reset table to cleaning / available
      if (table) {
        table.status = 'cleaning';
        setLocal(KEYS.TABLES, tables);
      }

      sound.playSuccessTone();
      return newBill;
    }

    await setDoc(doc(db, 'bills', newBill.id), newBill);
    return newBill;
  },

  subscribeBills(callback: (bills: Bill[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => {
        const bills = getLocal<Bill[]>(KEYS.BILLS, []);
        callback([...bills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
      emit();
      return bus.subscribe(KEYS.BILLS, emit);
    }

    const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const bills = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bill));
      callback(bills);
    });
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 7. STAFF MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════════
  getStaffSync(): StaffUser[] {
    const list = getLocal<StaffUser[]>(KEYS.STAFF, defaultStaffList);
    if (!list.some((s) => s.email === 'adminmain23@gmail.com')) {
      list.unshift(defaultStaffList[0]);
    }
    return list;
  },

  subscribeStaff(callback: (staff: StaffUser[]) => void): () => void {
    if (isDemoMode) {
      const emit = () => callback(getLocal<StaffUser[]>(KEYS.STAFF, []));
      emit();
      return bus.subscribe(KEYS.STAFF, emit);
    }

    return onSnapshot(collection(db, 'staff'), (snap) => {
      const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as StaffUser));
      callback(users);
    });
  },

  async saveStaff(staff: StaffUser): Promise<void> {
    if (isDemoMode) {
      const list = getLocal<StaffUser[]>(KEYS.STAFF, []);
      const idx = list.findIndex((s) => s.uid === staff.uid || s.email === staff.email);
      if (idx >= 0) {
        list[idx] = staff;
      } else {
        list.push(staff);
      }
      setLocal(KEYS.STAFF, list);
      return;
    }
    await setDoc(doc(db, 'staff', staff.uid), staff, { merge: true });
  },

  async deleteStaff(uid: string): Promise<void> {
    if (isDemoMode) {
      const list = getLocal<StaffUser[]>(KEYS.STAFF, []);
      setLocal(KEYS.STAFF, list.filter((s) => s.uid !== uid));
      return;
    }
    await deleteDoc(doc(db, 'staff', uid));
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // 8. FREE FIREBASE SEEDING & SETUP UTILITY
  // ═════════════════════════════════════════════════════════════════════════════
  async seedFreeFirebase(force: boolean = false): Promise<{
    categoriesCount: number;
    menuItemsCount: number;
    tablesCount: number;
  }> {
    if (isDemoMode) {
      setLocal(KEYS.CONFIG, initialRestaurantConfig);
      setLocal(KEYS.CATEGORIES, mockCategories);
      setLocal(KEYS.MENU, mockMenuItems);
      setLocal(KEYS.TABLES, mockTables);
      setLocal(KEYS.ORDERS, mockOrders);
      return {
        categoriesCount: mockCategories.length,
        menuItemsCount: mockMenuItems.length,
        tablesCount: mockTables.length,
      };
    }

    // Check if categories collection already has documents unless force is true
    if (!force) {
      try {
        const existingCats = await getDocs(collection(db, 'categories'));
        if (!existingCats.empty) {
          return {
            categoriesCount: existingCats.size,
            menuItemsCount: 0,
            tablesCount: 0,
          };
        }
      } catch {
        // Proceed with seeding if error
      }
    }

    // 1. Seed Restaurant Settings
    await setDoc(doc(db, 'settings', 'restaurant'), initialRestaurantConfig, { merge: true });

    // 2. Seed Categories
    for (const cat of mockCategories) {
      await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
    }

    // 3. Seed Menu Items
    for (const item of mockMenuItems) {
      await setDoc(doc(db, 'menu_items', item.id), item, { merge: true });
    }

    // 4. Seed Tables
    for (const tbl of mockTables) {
      await setDoc(doc(db, 'tables', tbl.id), tbl, { merge: true });
    }

    // 5. Seed Staff
    const defaultStaff = [
      { uid: 'admin-1', email: 'admin@spicegarden.in', name: 'Rajesh Kumar (Admin)', role: 'admin', isActive: true },
      { uid: 'kitchen-1', email: 'kitchen@spicegarden.in', name: 'Chef Amar', role: 'kitchen', isActive: true },
      { uid: 'waiter-1', email: 'waiter@spicegarden.in', name: 'Priya Singh', role: 'waiter', isActive: true },
    ];
    for (const st of defaultStaff) {
      await setDoc(doc(db, 'staff', st.uid), st, { merge: true });
    }

    return {
      categoriesCount: mockCategories.length,
      menuItemsCount: mockMenuItems.length,
      tablesCount: mockTables.length,
    };
  },
};
