import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  UtensilsCrossed,
  Bell,
  Check,
  Users,
  Receipt,
  Plus,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  Droplets,
  LogOut,
  ArrowLeft,
  Search,
  Smartphone,
  Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { sound } from '../../lib/sound';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, timeAgo, buildUpiPaymentUri } from '../../lib/utils';
import { restaurantConfig as initialRestaurantConfig } from '../../lib/mockData';
import type {
  Order,
  Table,
  TableStatus,
  MenuItem,
  PaymentMethod,
  RestaurantConfig,
} from '../../lib/types';
import { StatusBadge } from '../../components/ui/Badge';

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<RestaurantConfig>(initialRestaurantConfig);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'ready' | 'orders'>('tables');

  // Modals
  const [selectedTableForBill, setSelectedTableForBill] = useState<Table | null>(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isProcessingBill, setIsProcessingBill] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Manual Order state
  const [orderCart, setOrderCart] = useState<{ [itemId: string]: number }>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { user, logout } = useAuth();
  const { toast } = useToast();
  const prevReadyCountRef = useRef<number>(0);

  useEffect(() => {
    const unsubConfig = dataService.subscribeConfig(setConfig);
    const unsubOrders = dataService.subscribeOrders(setOrders);
    const unsubTables = dataService.subscribeTables(setTables);
    const unsubMenu = dataService.subscribeMenuItems(setMenuItems);

    return () => {
      unsubConfig();
      unsubOrders();
      unsubTables();
      unsubMenu();
    };
  }, []);

  const readyOrders = orders.filter((o) => o.status === 'ready');
  const activeOrders = orders.filter((o) => !['served', 'cancelled'].includes(o.status));

  // Audio & Toast Alert when Cooker marks an order Ready
  useEffect(() => {
    if (readyOrders.length > prevReadyCountRef.current) {
      sound.playAlertBell();
      const latest = readyOrders[readyOrders.length - 1];
      const tableInfo = latest ? `Table ${latest.tableNumber || latest.tableId}` : 'A table';
      toast(`🔔 Cooker Alert: ${tableInfo} is ready for pickup!`, 'success');
    }
    prevReadyCountRef.current = readyOrders.length;
  }, [readyOrders.length, toast]);

  const handleMarkServed = async (orderId: string) => {
    await dataService.updateOrderStatus(orderId, 'served');
    toast('Order delivered & marked served!', 'success');
  };

  const handleTableStatusChange = async (tableId: string, status: TableStatus) => {
    await dataService.updateTableStatus(tableId, status);
    toast(`Table status updated to ${status}`, 'success');
  };

  // Settle Bill
  const handleGenerateBill = async () => {
    if (!selectedTableForBill) return;
    setIsProcessingBill(true);
    try {
      const bill = await dataService.generateBillForTable(
        selectedTableForBill.id,
        paymentMethod,
        discountVal,
        discountVal > 0 ? 'Staff Discount' : undefined
      );
      toast(`Bill #${bill.billNumber} settled successfully!`, 'success');
      setSelectedTableForBill(null);
      setDiscountVal(0);
    } catch {
      toast('Failed to settle bill', 'error');
    } finally {
      setIsProcessingBill(false);
    }
  };

  // Submit Order Taken at Table
  const handleManualOrderSubmit = async () => {
    if (!selectedTableForOrder) return;
    const rawItems = Object.entries(orderCart)
      .filter(([_, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (rawItems.length === 0) {
      toast('Please add at least one dish to the ticket', 'warning');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const created = await dataService.createOrder({
        tableId: selectedTableForOrder.id,
        tableNumber: selectedTableForOrder.number,
        sessionToken: `waiter_${user?.uid || 'staff'}_${Date.now()}`,
        waiterName: user?.name || 'Floor Waiter',
        rawItems,
        specialRequests: orderNotes.trim() || undefined,
      });
      toast(`Ticket #${created.orderNumber} sent directly to Cooker!`, 'success');
      setSelectedTableForOrder(null);
      setOrderCart({});
      setOrderNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      toast(msg, 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map((i) => i.categoryId)));

  const filteredMenuItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchQuery =
      !menuSearch ||
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchQuery;
  });

  // Calculate cart total
  const orderCartTotal = Object.entries(orderCart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#08090b] text-slate-100 font-sans pb-24 selection:bg-orange-500 selection:text-white">
      {/* ── Top 3D Bar ──────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0f1115]/90 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-4 py-2.5 sm:py-3 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-colors shrink-0"
              title="Return to Staff Hub"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-1 ring-white/20 shrink-0">
              <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-serif font-bold text-sm sm:text-base text-white truncate">Waiter Station</h1>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  FLOOR
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
                Server: {user?.name || 'Floor Staff'} · Table Orders & Billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {readyOrders.length > 0 && (
              <button
                onClick={() => setActiveTab('ready')}
                className="flex items-center gap-1 bg-emerald-500 text-black text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-pulse transition-all shrink-0"
              >
                <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />
                <span className="hidden sm:inline">{readyOrders.length} Ready to Pick!</span>
                <span className="sm:hidden">{readyOrders.length} Ready</span>
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-xl transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Persistent Ready-to-Deliver Alert Bar for Mobile & Desktop ── */}
      {readyOrders.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-xl border-b border-emerald-400/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center shrink-0 text-white shadow">
                <Bell className="h-4 w-4 text-emerald-300 animate-bounce" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wide truncate">
                    🔥 Cooker Alert: Order Ready!
                  </span>
                  <span className="bg-white/25 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {readyOrders.length} {readyOrders.length === 1 ? 'table' : 'tables'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium truncate">
                  {readyOrders
                    .map((o) => `Table ${o.tableNumber || o.tableId}`)
                    .join(' · ')}
                </p>
              </div>
            </div>

            {/* 1-Tap Delivery Action Buttons horizontally scrollable on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 shrink-0">
              {readyOrders.map((ro) => (
                <button
                  key={ro.id}
                  type="button"
                  onClick={() => handleMarkServed(ro.id)}
                  className="bg-black/60 hover:bg-black/80 border border-emerald-300/40 text-emerald-200 hover:text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 whitespace-nowrap shadow"
                >
                  <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                  <span>Delivered T{ro.tableNumber || ro.tableId}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Switcher ────────────────────────────────────────────────────── */}
      <div className="bg-[#12151b] border-b border-white/10 px-4 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex gap-1 sm:gap-2">
          {[
            { id: 'tables', label: `Floor Tables (${tables.length})` },
            {
              id: 'ready',
              label: `🔔 Ready to Pick (${readyOrders.length})`,
              isAlert: readyOrders.length > 0,
            },
            { id: 'orders', label: `All Orders (${activeOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? tab.id === 'ready'
                    ? 'border-emerald-400 text-emerald-400 shadow-[0_2px_12px_rgba(16,185,129,0.4)]'
                    : 'border-orange-500 text-orange-400 shadow-[0_2px_12px_rgba(249,115,22,0.4)]'
                  : tab.isAlert
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 animate-pulse'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Workspace ──────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* VIEW 1: 3D TABLES MAP */}
        {activeTab === 'tables' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold text-white">Interactive Table Floor</h2>
                <p className="text-xs text-slate-400">
                  Tap any table to punch customer orders directly or generate final bills
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Occupied
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cleaning
                </span>
              </div>
            </div>

            {/* 3D Tables Grid */}
            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {tables.map((table) => {
                const tableOrders = orders.filter(
                  (o) =>
                    (o.tableId === table.id || o.tableNumber === table.number) &&
                    !['served', 'cancelled'].includes(o.status)
                );
                const hasReady = tableOrders.some((o) => o.status === 'ready');
                const isOccupied = table.status === 'occupied';

                const statusBorders: Record<TableStatus, string> = {
                  available: 'border-emerald-500/40 hover:border-emerald-400',
                  occupied: 'border-orange-500/50 hover:border-orange-400 shadow-orange-500/10',
                  billing: 'border-blue-500/50 hover:border-blue-400',
                  cleaning: 'border-amber-500/40 hover:border-amber-400',
                  reserved: 'border-purple-500/40 hover:border-purple-400',
                };

                const statusBadges: Record<TableStatus, string> = {
                  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                  occupied: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                  billing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                  cleaning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                  reserved: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                };

                return (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`table-block-3d rounded-3xl p-4 sm:p-5 border ${
                      hasReady
                        ? 'border-2 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/30'
                        : statusBorders[table.status]
                    } flex flex-col justify-between relative overflow-hidden`}
                  >
                    {/* Ready Alert Header Ribbon - in normal flow to avoid any overlapping */}
                    {hasReady && (
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-3 py-1 flex items-center justify-between -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-2.5 border-b border-emerald-300 shadow">
                        <span className="flex items-center gap-1 animate-pulse">
                          <Bell className="h-3 w-3 stroke-[3]" /> READY AT PASS!
                        </span>
                        <span className="text-[9px] bg-black/25 text-white font-mono px-1.5 py-0.5 rounded">Deliver</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-wide">
                            {table.number}
                          </h3>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <Users className="h-3 w-3 shrink-0" /> {table.seats} Seats · {table.section || 'Indoor'}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${statusBadges[table.status]}`}
                        >
                          {table.status}
                        </span>
                      </div>

                      {/* Running Tab */}
                      <div className="my-2.5 bg-black/40 border border-white/5 rounded-2xl p-2 sm:p-2.5 text-xs flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Running Tab:</span>
                        <span className="font-mono font-bold text-white text-xs sm:text-sm">
                          {formatPrice(table.activeTotal || 0)}
                        </span>
                      </div>
                    </div>

                    {/* 3D Action Controls */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTableForOrder(table)}
                          className="btn-3d bg-orange-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Order
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTableForBill(table);
                            setPaymentMethod('upi');
                          }}
                          className="btn-3d-blue bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Receipt className="h-3.5 w-3.5" /> Bill
                        </button>
                      </div>

                      {/* Cooker Ready to Pick Alert Action */}
                      {hasReady && (
                        <button
                          type="button"
                          onClick={() => {
                            const ro = tableOrders.find((o) => o.status === 'ready');
                            if (ro) handleMarkServed(ro.id);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 text-black font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 animate-pulse border border-emerald-300"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" /> Plated! Pick & Deliver
                        </button>
                      )}

                      {(table.activeTotal || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTableForBill(table);
                            setPaymentMethod('upi');
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all border border-emerald-400/30 truncate"
                        >
                          <QrCode className="h-3.5 w-3.5 shrink-0" /> Pay {formatPrice(table.activeTotal || 0)} UPI QR
                        </button>
                      )}

                      {table.status === 'cleaning' && (
                        <button
                          type="button"
                          onClick={() => handleTableStatusChange(table.id, 'available')}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          Mark Clean & Ready
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED READY TO PICK VIEW */}
        {activeTab === 'ready' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-emerald-400 animate-bounce" />
                  Cooker Orders Ready for Pickup ({readyOrders.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Pick up hot from kitchen pass and deliver to customer table
                </p>
              </div>
            </div>

            {readyOrders.length === 0 ? (
              <div className="py-20 text-center glass-card-3d rounded-3xl border border-white/10 p-8">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  No orders waiting at the kitchen pass right now. When the Cooker marks dishes ready, they will chime and appear here immediately.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card-3d rounded-3xl p-5 border-2 border-emerald-400 shadow-xl shadow-emerald-500/20 flex flex-col justify-between bg-gradient-to-b from-[#14231b] via-[#0d1712] to-[#090d0b]"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3 pb-3 border-b border-emerald-500/30">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-2xl text-white">
                              {order.tableNumber || order.tableId}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              #{order.orderNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> Ready {timeAgo(order.updatedAt || order.createdAt)}
                          </span>
                        </div>

                        <span className="bg-emerald-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-full animate-pulse shadow">
                          PLATED & HOT 🔥
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-black/60 border border-emerald-500/20 rounded-2xl p-3 text-xs space-y-1.5 mb-4">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between items-center text-white font-medium">
                            <span>{i.name}</span>
                            <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-emerald-300">
                              ×{i.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.specialRequests && (
                        <p className="text-xs text-amber-300 font-semibold mb-3">
                          ⚠️ {order.specialRequests}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkServed(order.id)}
                      className="btn-3d w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Mark Delivered: Table {order.tableNumber || order.tableId}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ACTIVE KITCHEN ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Priority Ready Orders */}
            {readyOrders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Ready to Deliver to Table
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="glass-card-3d rounded-3xl p-5 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="font-serif font-bold text-xl text-white">
                              Table {order.tableNumber}
                            </span>
                            <p className="text-xs text-slate-400 font-mono">#{order.orderNumber}</p>
                          </div>
                          <span className="bg-emerald-500 text-black text-xs font-black px-2.5 py-0.5 rounded-full">
                            PLATED & READY
                          </span>
                        </div>

                        <div className="bg-black/50 border border-white/5 rounded-2xl p-3 text-xs space-y-1 mb-4">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300">
                              <span>
                                {i.name} <span className="text-orange-400">×{i.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkServed(order.id)}
                        className="btn-3d-emerald bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        <span>Deliver & Mark Served</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Active Tickets */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                All Current Active Tickets ({activeOrders.length})
              </h3>

              {activeOrders.length === 0 ? (
                <div className="py-20 text-center glass-card-3d rounded-3xl border border-white/10 p-8">
                  <div className="text-5xl mb-3">🍽️</div>
                  <h4 className="font-bold text-white text-base">No active orders</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a table and click "+ Order" to punch a new order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="glass-card-3d rounded-2xl p-3.5 sm:p-4 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">Table</span>
                          <span className="font-bold text-xs sm:text-sm text-white">{order.tableNumber}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-white">
                              #{order.orderNumber}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                            {order.items.length} items · Placed {timeAgo(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs sm:text-sm text-orange-400 block">
                          {formatPrice(order.total)}
                        </span>
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleMarkServed(order.id)}
                            className="mt-1 text-[11px] sm:text-xs text-emerald-400 font-bold hover:underline"
                          >
                            Mark Delivered →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── 3D Modal: Punch Order at Table ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedTableForOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => {
                  setSelectedTableForOrder(null);
                  setOrderCart({});
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4 shrink-0">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  Table-Side POS
                </span>
                <h3 className="font-serif font-bold text-xl text-white">
                  Punch Order · Table {selectedTableForOrder.number}
                </h3>
              </div>

              {/* Search & Category Filter */}
              <div className="mb-3 space-y-2 shrink-0">
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />

                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                      selectedCategory === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#1b1f27] text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap capitalize ${
                        selectedCategory === c
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#1b1f27] text-slate-400'
                      }`}
                    >
                      {c.replace('cat-', 'Category ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dish Selector List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                {filteredMenuItems.map((dish) => {
                  const qty = orderCart[dish.id] || 0;
                  return (
                    <div
                      key={dish.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        qty > 0
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-[#161a22] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{dish.name}</p>
                        <p className="font-mono text-[11px] text-orange-400">{formatPrice(dish.price)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setOrderCart((prev) => ({
                                ...prev,
                                [dish.id]: Math.max(0, qty - 1),
                              }))
                            }
                            className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center font-bold text-sm"
                          >
                            -
                          </button>
                        )}

                        {qty > 0 && (
                          <span className="w-5 text-center font-mono font-bold text-xs text-white">
                            {qty}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setOrderCart((prev) => ({
                              ...prev,
                              [dish.id]: (prev[dish.id] || 0) + 1,
                            }))
                          }
                          className="w-7 h-7 bg-orange-600 hover:bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes & Actions */}
              <div className="shrink-0 space-y-3 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Special instructions (e.g. less spicy, allergy notes)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Amount:</span>
                    <span className="font-mono font-bold text-base text-white">
                      {formatPrice(orderCartTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualOrderSubmit}
                    disabled={isSubmittingOrder || orderCartTotal === 0}
                    className="btn-3d bg-orange-600 disabled:opacity-40 text-white px-6 py-3 rounded-2xl font-bold text-xs"
                  >
                    {isSubmittingOrder ? 'Sending...' : 'Send Order to Cooker 👨‍🍳'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 3D Modal: Settle Bill ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTableForBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedTableForBill(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl">
                  🧾
                </div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Settle Table {selectedTableForBill.number}
                </h3>
                <p className="text-xs text-slate-400">Record final payment & free table</p>
              </div>

              <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-4 text-xs space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>Running Total:</span>
                  <span className="font-mono text-orange-400 text-sm">
                    {formatPrice(selectedTableForBill.activeTotal || 0)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountVal || ''}
                  onChange={(e) => setDiscountVal(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Payment selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: '📱 UPI QR' },
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'card', label: '💳 Card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === m.id
                          ? m.id === 'upi'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-950/40'
                            : 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-white/10 bg-[#1b1f27] text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic UPI Payment QR Code Box */}
              {(() => {
                const payableAmount = Math.max(1, (selectedTableForBill.activeTotal || 0) - discountVal);
                return (
                  <>
                    {paymentMethod === 'upi' && (
                      <div className="mb-4 bg-gradient-to-b from-[#141e17] via-[#0f1511] to-[#0a0e0c] border border-emerald-500/40 rounded-2xl p-4 text-center relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-emerald-500/20 blur-xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Dynamic UPI QR
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            ₹{payableAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* QR SVG */}
                        <div className="bg-white p-3 rounded-2xl inline-block shadow-lg border-2 border-emerald-500/40 my-1">
                          <QRCodeSVG
                            value={buildUpiPaymentUri({
                              upiId: config.upiId || 'royalsaffron@okaxis',
                              payeeName: config.upiName || config.name,
                              amount: payableAmount,
                              note: `Table ${selectedTableForBill.number} Bill`,
                            })}
                            size={165}
                            level="H"
                            includeMargin
                          />
                        </div>

                        <p className="text-xs font-bold text-white mt-1.5">
                          Scan with PhonePe / GPay / Paytm
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Amount is pre-filled & locked to <strong className="text-emerald-400 font-mono">₹{payableAmount.toLocaleString('en-IN')}</strong>
                        </p>

                        <div className="mt-3 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>VPA: <strong className="text-emerald-300">{config.upiId || 'royalsaffron@okaxis'}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              const uri = buildUpiPaymentUri({
                                upiId: config.upiId || 'royalsaffron@okaxis',
                                payeeName: config.upiName || config.name,
                                amount: payableAmount,
                                note: `Table ${selectedTableForBill.number} Bill`,
                              });
                              navigator.clipboard.writeText(uri);
                              setCopiedUpi(true);
                              toast('UPI link copied!', 'info');
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            {copiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateBill}
                      disabled={isProcessingBill}
                      className={`w-full py-3 rounded-2xl font-bold text-xs shadow-lg transition-all ${
                        paymentMethod === 'upi'
                          ? 'btn-3d bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                          : 'btn-3d-blue bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
                      } disabled:opacity-50`}
                    >
                      {isProcessingBill
                        ? 'Settling...'
                        : paymentMethod === 'upi'
                        ? `✓ Payment Received (₹${payableAmount}) — Release Table`
                        : 'Confirm Payment & Release Table'}
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
