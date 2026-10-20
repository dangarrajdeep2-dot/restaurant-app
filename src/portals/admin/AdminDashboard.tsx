import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Users,
  TrendingUp,
  ChefHat,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Settings,
  Printer,
  X,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Check,
  Copy,
  Receipt,
  AlertCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { formatPrice, timeAgo, buildUpiPaymentUri } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type {
  MenuItem,
  MenuCategory,
  Order,
  Table,
  RestaurantConfig,
  Bill,
  StaffUser,
  StaffRole,
  OrderStatus,
} from '../../lib/types';
import { restaurantConfig as initialRestaurantConfig } from '../../lib/mockData';

type AdminTab = 'dashboard' | 'orders' | 'menu' | 'tables' | 'qrcodes' | 'bills' | 'staff' | 'settings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [config, setConfig] = useState<RestaurantConfig>(initialRestaurantConfig);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);

  // Modals
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffFormData, setStaffFormData] = useState<{
    name: string;
    email: string;
    username: string;
    role: StaffRole;
    password: string;
    phone: string;
  }>({
    name: '',
    email: '',
    username: '',
    role: 'waiter',
    password: '',
    phone: '',
  });
  const [showStaffPasswords, setShowStaffPasswords] = useState<Record<string, boolean>>({});
  const [printableTable, setPrintableTable] = useState<Table | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // UPI Dynamic QR Generator State
  const [qrCategory, setQrCategory] = useState<'upi' | 'menu'>('upi');
  const [upiAmount, setUpiAmount] = useState<number>(750);
  const [upiTableSelect, setUpiTableSelect] = useState<string>('');
  const [upiCustomNote, setUpiCustomNote] = useState<string>('The Royal Saffron Bill');
  const [editingUpiId, setEditingUpiId] = useState<string>('royalsaffron@okaxis');
  const [editingUpiName, setEditingUpiName] = useState<string>('The Royal Saffron');
  const [isPrintingUpi, setIsPrintingUpi] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const unsubConfig = dataService.subscribeConfig(setConfig);
    const unsubItems = dataService.subscribeMenuItems(setMenuItems);
    const unsubCats = dataService.subscribeCategories(setCategories);
    const unsubOrders = dataService.subscribeOrders(setOrders);
    const unsubTables = dataService.subscribeTables(setTables);
    const unsubBills = dataService.subscribeBills(setBills);
    const unsubStaff = dataService.subscribeStaff(setStaff);

    return () => {
      unsubConfig();
      unsubItems();
      unsubCats();
      unsubOrders();
      unsubTables();
      unsubBills();
      unsubStaff();
    };
  }, []);

  useEffect(() => {
    if (config.upiId) setEditingUpiId(config.upiId);
    if (config.upiName) setEditingUpiName(config.upiName || config.name);
  }, [config]);

  const handleSaveUpiConfig = async () => {
    if (!editingUpiId.trim()) {
      toast('Please enter a valid UPI ID', 'error');
      return;
    }
    await dataService.updateConfig({
      upiId: editingUpiId.trim(),
      upiName: (editingUpiName || config.name).trim(),
    });
    toast('UPI details saved! Waiter & billing stations updated.', 'success');
  };

  const handleSelectTableForUpi = (tableId: string) => {
    setUpiTableSelect(tableId);
    if (!tableId) return;
    const tbl = tables.find((t) => t.id === tableId);
    if (tbl) {
      setUpiAmount(tbl.activeTotal || 0);
      setUpiCustomNote(`Table ${tbl.number} Bill`);
    }
  };

  const handleCopyUpiLink = () => {
    const uri = buildUpiPaymentUri({
      upiId: editingUpiId || config.upiId || 'royalsaffron@okaxis',
      payeeName: editingUpiName || config.upiName || config.name,
      amount: upiAmount,
      note: upiCustomNote,
    });
    navigator.clipboard.writeText(uri);
    setCopiedUpi(true);
    toast('UPI payment URI copied to clipboard!', 'info');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;

  const adminTabs: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Analytics' },
    { id: 'orders',    icon: <TrendingUp className="h-4 w-4" />,      label: 'Live Orders' },
    { id: 'menu',      icon: <UtensilsCrossed className="h-4 w-4" />, label: 'Menu Catalog' },
    { id: 'tables',    icon: <Users className="h-4 w-4" />,           label: 'Table Layout' },
    { id: 'qrcodes',   icon: <QrCode className="h-4 w-4" />,          label: 'QR Generator' },
    { id: 'bills',     icon: <FileText className="h-4 w-4" />,        label: 'Invoices & Bills' },
    { id: 'staff',     icon: <Users className="h-4 w-4" />,           label: 'Staff Users' },
    { id: 'settings',  icon: <Settings className="h-4 w-4" />,        label: 'Store Settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#07080a] text-slate-100 font-sans overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* ── Desktop 3D Obsidian Sidebar (hidden on mobile) ──────────────────── */}
      <aside className="hidden md:flex md:w-16 lg:w-64 bg-[#0d0f14] flex-col h-screen shrink-0 border-r border-white/10 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20 shrink-0">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="font-serif font-bold text-white text-sm truncate">{config.name}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Admin Command
              </p>
            </div>
          </div>
        </div>

        {/* Return to Staff Hub link */}
        <div className="p-2 border-b border-white/5">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">Staff Hub</span>
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="hidden lg:block text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile & Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="hidden lg:flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header (Phone only) ─────────────────────────────────── */}
      <header className="md:hidden border-b border-white/10 bg-[#0d0f14] px-3.5 py-2.5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-colors shrink-0"
            title="Open Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-xs sm:text-sm text-white truncate">{config.name}</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider truncate">
              Admin · {adminTabs.find((t) => t.id === activeTab)?.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl text-xs"
            title="Staff Hub"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-red-400 hover:text-white bg-red-500/10 border border-red-500/20 rounded-xl text-xs"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile Horizontal Tab Scroll Bar ──────────────────────────────── */}
      <div className="md:hidden bg-[#101319] border-b border-white/10 px-2 py-1.5 overflow-x-auto hide-scrollbar flex items-center gap-1.5 shrink-0 z-20">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#181c24] text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile Slide Drawer Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-72 max-w-[80vw] bg-[#0d0f14] border-r border-white/10 h-full flex flex-col p-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
                    👑
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">{config.name}</h3>
                    <p className="text-[10px] text-blue-400 font-semibold">Admin Panel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as AdminTab);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setIsMobileNavOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Staff Hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileNavOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Workspace ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto p-3.5 sm:p-6 lg:p-8">
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white">Executive Command</h1>
                  <p className="text-xs text-slate-400">Live 3D analytics and floor metrics</p>
                </div>
              </div>

              {/* 3D Stat Hologram Cubes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { label: "Today's Revenue", value: formatPrice(totalRevenue), icon: '💰', border: 'border-emerald-500/40', text: 'text-emerald-400' },
                  { label: 'Active Orders', value: orders.filter(o => !['served', 'cancelled'].includes(o.status)).length, icon: '📋', border: 'border-blue-500/40', text: 'text-blue-400' },
                  { label: 'Occupied Tables', value: `${occupiedTables} / ${tables.length}`, icon: '🪑', border: 'border-orange-500/40', text: 'text-orange-400' },
                  { label: 'Active Dishes', value: menuItems.filter(i => i.isAvailable).length, icon: '🍽️', border: 'border-purple-500/40', text: 'text-purple-400' },
                ].map((stat) => (
                  <div key={stat.label} className={`glass-card-3d rounded-3xl p-3.5 sm:p-5 border ${stat.border}`}>
                    <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-2">{stat.icon}</div>
                    <p className={`text-lg sm:text-2xl font-mono font-bold truncate ${stat.text}`}>{stat.value}</p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 font-semibold truncate">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Orders table */}
              <div className="glass-card-3d rounded-3xl overflow-hidden border border-white/10">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Recent Floor Transactions</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-blue-400 font-bold hover:underline">
                    View All Orders →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-black/40 text-slate-400 font-bold uppercase border-b border-white/5">
                      <tr>
                        <th className="px-5 py-3 text-left">Order #</th>
                        <th className="px-5 py-3 text-left">Table</th>
                        <th className="px-5 py-3 text-left">Items</th>
                        <th className="px-5 py-3 text-left">Total</th>
                        <th className="px-5 py-3 text-left">Placed</th>
                        <th className="px-5 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.slice(0, 6).map((order) => (
                        <tr key={order.id} className="hover:bg-white/5">
                          <td className="px-5 py-3 font-mono font-bold text-white">#{order.orderNumber}</td>
                          <td className="px-5 py-3 font-bold text-slate-300">Table {order.tableNumber}</td>
                          <td className="px-5 py-3 text-slate-400">{order.items.length} dishes</td>
                          <td className="px-5 py-3 font-mono font-bold text-orange-400">{formatPrice(order.total)}</td>
                          <td className="px-5 py-3 text-slate-500">{timeAgo(order.createdAt)}</td>
                          <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white">Live Order Control</h1>
                  <p className="text-xs text-slate-400">Manage all tickets and override statuses</p>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card-3d rounded-3xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-white">#{order.orderNumber}</span>
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2.5 py-0.5 rounded-full text-xs">
                          Table {order.tableNumber}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Placed: {timeAgo(order.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-mono font-bold text-base text-orange-400">{formatPrice(order.total)}</span>

                      <select
                        value={order.status}
                        onChange={(e) => dataService.updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="text-xs bg-[#1b1f27] border border-white/15 rounded-xl px-2.5 py-1.5 font-bold text-white focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Cooking</option>
                        <option value="ready">Ready</option>
                        <option value="served">Served</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MENU MANAGEMENT */}
          {activeTab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white">Menu Catalog</h1>
                  <p className="text-xs text-slate-400">Manage dishes, pricing, tags, and 86 stock status</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="btn-3d bg-orange-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Dish
                </button>
              </div>

              <div className="glass-card-3d rounded-3xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-black/40 text-slate-400 font-bold uppercase border-b border-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left">Dish</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Availability</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {menuItems.map((item) => {
                        const cat = categories.find((c) => c.id === item.categoryId);
                        return (
                          <tr key={item.id} className={`hover:bg-white/5 ${!item.isAvailable ? 'opacity-40' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{cat?.name || 'Main'}</td>
                            <td className="px-4 py-3 font-mono font-bold text-orange-400">{formatPrice(item.price)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => dataService.toggleItemAvailability(item.id, !item.isAvailable)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                  item.isAvailable
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {item.isAvailable ? 'In Stock' : '86 / Sold Out'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsItemModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-400"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => dataService.deleteMenuItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TABLE LAYOUT */}
          {activeTab === 'tables' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white">Table Configuration</h1>
                  <p className="text-xs text-slate-400">Configure floor layout, seating, and QR binding</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="btn-3d bg-orange-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Table
                </button>
              </div>

              <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {tables.map((t) => (
                  <div key={t.id} className="table-block-3d rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-serif font-bold text-2xl text-white">{t.number}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-white/10 text-slate-300">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{t.seats} Seats · {t.section || 'Indoor'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => setPrintableTable(t)}
                        className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" /> View QR
                      </button>
                      <button
                        onClick={() => dataService.deleteTable(t.id)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: QR GENERATOR & DYNAMIC UPI BILL PAYMENTS */}
          {activeTab === 'qrcodes' && (
            <div className="space-y-6">
              {/* Header & Sub-tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-emerald-400" />
                    QR Command & Payments Center
                  </h1>
                  <p className="text-xs text-slate-400">
                    Generate live UPI dynamic payment QRs with exact bill amounts & table dining cards
                  </p>
                </div>

                {/* Sub-tab Pills */}
                <div className="flex bg-[#12151b] p-1 rounded-2xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQrCategory('upi')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      qrCategory === 'upi'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Dynamic UPI Payment QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrCategory('menu')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      qrCategory === 'menu'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>Table Menu QRs</span>
                  </button>
                </div>
              </div>

              {/* ── SUB-TAB 1: DYNAMIC UPI BILL PAYMENT QR GENERATOR ── */}
              {qrCategory === 'upi' && (
                <div className="space-y-6">
                  {/* Top Bar: Merchant UPI ID Settings Bar */}
                  <div className="glass-card-3d rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-[#0e1713] to-[#0d1217]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">Restaurant UPI Payment Address</h3>
                          <p className="text-[11px] text-slate-400">
                            Customer payments go directly to this UPI ID (PhonePe / GPay / Paytm / Bank VPA)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#1b2320] border border-emerald-500/30 rounded-xl px-3 py-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">UPI ID:</span>
                          <input
                            type="text"
                            placeholder="e.g. royalsaffron@okaxis"
                            value={editingUpiId}
                            onChange={(e) => setEditingUpiId(e.target.value)}
                            className="bg-transparent text-xs font-mono font-bold text-emerald-300 focus:outline-none w-48"
                          />
                        </div>

                        <div className="flex items-center gap-2 bg-[#1b2320] border border-emerald-500/30 rounded-xl px-3 py-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Payee:</span>
                          <input
                            type="text"
                            placeholder="Business Name"
                            value={editingUpiName}
                            onChange={(e) => setEditingUpiName(e.target.value)}
                            className="bg-transparent text-xs font-bold text-white focus:outline-none w-36"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveUpiConfig}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" /> Save UPI ID
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Interface: Bill Controls & Live 3D QR */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Amount & Bill Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* Section 1: Quick Pick Table Bill */}
                      <div className="glass-card-3d rounded-3xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-orange-400" />
                            1. Select Table with Active Bill
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {tables.filter((t) => (t.activeTotal || 0) > 0).length} active tables
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {tables.map((t) => {
                            const isOccupied = (t.activeTotal || 0) > 0;
                            const isSelected = upiTableSelect === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleSelectTableForUpi(t.id)}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500'
                                    : isOccupied
                                    ? 'border-orange-500/40 bg-orange-500/10 hover:border-orange-500/70'
                                    : 'border-white/5 bg-white/5 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">{t.number}</span>
                                  {isOccupied && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  )}
                                </div>
                                <p className="font-mono font-bold text-xs mt-1 text-emerald-400">
                                  {isOccupied ? `₹${(t.activeTotal || 0).toLocaleString('en-IN')}` : 'Vacant'}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Custom Amount & Bill Details */}
                      <div className="glass-card-3d rounded-3xl p-5 border border-white/10 space-y-4">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-emerald-400" />
                          2. Or Enter Custom Bill Amount
                        </h3>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Payable Amount (₹ INR) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={upiAmount || ''}
                              onChange={(e) => {
                                setUpiAmount(Math.max(1, Number(e.target.value)));
                                setUpiTableSelect('');
                              }}
                              className="w-full bg-[#161a22] border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <p className="text-[11px] text-slate-400 mb-2">Quick Presets:</p>
                          <div className="flex flex-wrap gap-2">
                            {[100, 250, 500, 750, 1000, 1500, 2500, 5000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setUpiAmount(amt)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                  upiAmount === amt
                                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                    : 'border-white/10 bg-[#161a22] text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                ₹{amt.toLocaleString('en-IN')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Bill Reference Note */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Payment / Bill Note (Shown on Customer's Phone)
                          </label>
                          <input
                            type="text"
                            value={upiCustomNote}
                            onChange={(e) => setUpiCustomNote(e.target.value)}
                            placeholder="e.g. Table 3 Bill or Dinner Order"
                            className="w-full bg-[#161a22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: 3D Dynamic Live UPI QR Code Display (5 cols) */}
                    <div className="lg:col-span-5">
                      <div className="glass-card-3d rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-b from-[#141d18] via-[#0f1412] to-[#0a0d0c] text-center relative overflow-hidden shadow-2xl">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/20 blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                              BHIM UPI Dynamic QR
                            </span>
                          </div>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            Locked Amount
                          </span>
                        </div>

                        {/* Restaurant Name */}
                        <h2 className="text-lg font-serif font-bold text-white mb-0.5">
                          {editingUpiName || config.upiName || config.name}
                        </h2>
                        <p className="text-[11px] font-mono text-slate-400 mb-4">
                          VPA: <strong className="text-emerald-300">{editingUpiId || config.upiId || 'royalsaffron@okaxis'}</strong>
                        </p>

                        {/* Large White QR Frame */}
                        <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block mb-4 border-2 border-emerald-500/30">
                          <QRCodeSVG
                            value={buildUpiPaymentUri({
                              upiId: editingUpiId || config.upiId || 'royalsaffron@okaxis',
                              payeeName: editingUpiName || config.upiName || config.name,
                              amount: upiAmount,
                              note: upiCustomNote,
                            })}
                            size={190}
                            level="H"
                            includeMargin
                          />
                        </div>

                        {/* Amount Display */}
                        <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-3 mb-4">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Exact Amount to Pay</p>
                          <p className="text-3xl font-mono font-bold text-emerald-400">
                            ₹{upiAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Note: {upiCustomNote}
                          </p>
                        </div>

                        {/* Supported UPI Apps Badges */}
                        <p className="text-[10px] text-slate-400 mb-4">
                          Scan with <strong>Google Pay · PhonePe · Paytm · BHIM · CRED</strong>
                        </p>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setIsPrintingUpi(true)}
                            className="btn-3d bg-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                          >
                            <Printer className="h-3.5 w-3.5" /> Print QR Slip
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyUpiLink}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/10"
                          >
                            {copiedUpi ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedUpi ? 'Copied!' : 'Copy UPI Link'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUB-TAB 2: TABLE MENU DIGITAL CARDS ── */}
              {qrCategory === 'menu' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-serif font-bold text-white">Table Dining Menu Cards</h3>
                    <p className="text-xs text-slate-400">Printable cards for table-tops for customers to view the digital menu</p>
                  </div>

                  <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {tables.map((table) => {
                      const url = `${window.location.origin}/menu?table=${table.id}&num=${table.number}`;
                      return (
                        <div key={table.id} className="glass-card-3d rounded-3xl p-5 border border-white/10 text-center">
                          <div className="bg-white p-3.5 rounded-2xl inline-block mb-3 shadow-md">
                            <QRCodeSVG value={url} size={130} level="H" includeMargin />
                          </div>
                          <h3 className="font-serif font-bold text-lg text-white">{table.number}</h3>
                          <p className="text-xs text-slate-400 mb-3">{table.seats} Seats · {table.section || 'Indoor'}</p>
                          <button
                            onClick={() => setPrintableTable(table)}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" /> Print QR Card
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SETTLED BILLS */}
          {activeTab === 'bills' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white">Settled Invoices & Bills</h1>
                  <p className="text-xs text-slate-400">Floor payments and ledger history</p>
                </div>
              </div>

              {bills.length === 0 ? (
                <div className="py-20 text-center glass-card-3d rounded-3xl border border-white/10 p-8">
                  <div className="text-5xl mb-2">🧾</div>
                  <h3 className="font-bold text-white text-base">No settled bills yet</h3>
                  <p className="text-xs text-slate-400">Bills settled by waiters will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((b) => (
                    <div key={b.id} className="glass-card-3d rounded-3xl p-5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">#{b.billNumber}</span>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            Paid via {b.paymentMethod?.toUpperCase() || 'CASH'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Table {b.tableNumber} · {b.items.length} items · {timeAgo(b.createdAt)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-base text-orange-400">{formatPrice(b.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STAFF USERS & PASSWORD CONTROLS */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                    <Key className="h-6 w-6 text-orange-400" />
                    Staff Accounts & Passwords
                  </h1>
                  <p className="text-xs text-slate-400">
                    Admin sets usernames and passwords for Waiters and Cookers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setStaffFormData({
                      name: '',
                      email: '',
                      username: '',
                      role: 'waiter',
                      password: 'waiter123',
                      phone: '',
                    });
                    setIsStaffModalOpen(true);
                  }}
                  className="btn-3d bg-orange-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add Staff Member
                </button>
              </div>

              {/* Master Admin Notice Banner */}
              <div className="glass-card-3d rounded-3xl p-4 border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-[#0e141d] to-[#0a0d14] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                      <span>👑 Master Admin Account Active</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">Owner</span>
                    </h3>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      Account: <strong className="text-white">adminmain23@gmail.com</strong> · Status: <span className="text-emerald-400 font-semibold">Protected Master Key</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 sm:text-right">
                  Use this to access full owner administrative control
                </span>
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 perspective-1000">
                {staff.map((s) => {
                  const isMaster = s.email === 'adminmain23@gmail.com';
                  const isPassVisible = !!showStaffPasswords[s.uid];
                  const displayPass = s.password || (s.role === 'admin' ? 'royalchef200' : 'password123');
                  const roleColors = {
                    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    kitchen: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    waiter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                  };

                  return (
                    <div
                      key={s.uid}
                      className={`glass-card-3d rounded-3xl p-5 border flex flex-col justify-between ${
                        isMaster ? 'border-blue-500/40 bg-blue-950/10' : 'border-white/10'
                      }`}
                    >
                      <div>
                        {/* Header: Avatar, Name, Role */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/30 to-orange-600/20 border border-white/10 text-white flex items-center justify-center font-bold text-base shadow">
                              {s.name ? s.name[0].toUpperCase() : 'S'}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                                {s.name}
                                {isMaster && <span className="text-xs">👑</span>}
                              </h3>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {s.email}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                              roleColors[s.role] || roleColors.waiter
                            }`}
                          >
                            {s.role === 'kitchen' ? '👨‍🍳 Cooker' : s.role === 'waiter' ? '🛎️ Waiter' : '👑 Admin'}
                          </span>
                        </div>

                        {/* Credentials Box */}
                        <div className="bg-black/50 border border-white/10 rounded-2xl p-3 my-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Lock className="h-3 w-3 text-slate-500" /> Login ID:
                            </span>
                            <span className="font-mono text-white font-bold">{s.username || s.email}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Key className="h-3 w-3 text-slate-500" /> Password:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-bold">
                                {isPassVisible ? displayPass : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowStaffPasswords((prev) => ({
                                    ...prev,
                                    [s.uid]: !prev[s.uid],
                                  }))
                                }
                                className="text-slate-400 hover:text-white p-0.5"
                                title={isPassVisible ? 'Hide password' : 'Show password'}
                              >
                                {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaff(s);
                            setStaffFormData({
                              name: s.name,
                              email: s.email,
                              username: s.username || s.email.split('@')[0],
                              role: s.role,
                              password: displayPass,
                              phone: s.phone || '',
                            });
                            setIsStaffModalOpen(true);
                          }}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                        >
                          <Key className="h-3.5 w-3.5 text-orange-400" />
                          <span>Set Password / Edit</span>
                        </button>

                        {!isMaster && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete staff member ${s.name}?`)) {
                                dataService.deleteStaff(s.uid);
                                toast(`Staff ${s.name} deleted`, 'info');
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-xl transition-colors"
                            title="Delete Staff"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS & FIREBASE SEEDER */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl glass-card-3d rounded-3xl p-6 border border-white/10">
              <h1 className="text-xl font-serif font-bold text-white mb-1">Restaurant Profile & Settings</h1>
              <p className="text-xs text-slate-400 mb-6">Configure store information and taxes</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dataService.updateConfig(config);
                  toast('Restaurant settings saved!', 'success');
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={config.phone}
                      onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                      className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tax Rate (e.g. 0.05 = 5%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.taxRate}
                      onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* ── UPI Payment Gateway Configuration ──────────────────── */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-emerald-300 text-xs">UPI Digital Payments (PhonePe, GPay, Paytm)</span>
                      <p className="text-[10px] text-slate-400">Used by Waiters and Cashier to generate dynamic bill payment QR codes with exact bill amounts.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Merchant UPI ID (VPA) *</label>
                      <input
                        type="text"
                        placeholder="e.g. royalsaffron@okaxis or 9876543210@paytm"
                        value={config.upiId || ''}
                        onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                        className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Payment goes directly to this UPI address</p>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Business / Payee Name</label>
                      <input
                        type="text"
                        placeholder="e.g. The Royal Saffron"
                        value={config.upiName || ''}
                        onChange={(e) => setConfig({ ...config, upiName: e.target.value })}
                        className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Displayed in customer's payment app</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-3d bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl text-xs"
                >
                  Save Configuration
                </button>
              </form>

              {/* 3D Free Firebase Initializer Card */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔥</span>
                    <h3 className="font-serif font-bold text-sm text-white">
                      Free Firebase Cloud Firestore Seeder
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Running on the <strong>100% Free Firebase Spark Plan</strong> (zero billing, no credit card required).
                    Click below to populate or reset your Cloud Firestore database with default menu dishes, categories, tables, and staff profiles in one click.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isSeeding}
                      onClick={async () => {
                        setIsSeeding(true);
                        try {
                          const res = await dataService.seedFreeFirebase(true);
                          toast(
                            `🔥 Database seeded: ${res.categoriesCount} categories, ${res.menuItemsCount} dishes, ${res.tablesCount} tables!`,
                            'success'
                          );
                        } catch {
                          toast('Failed to seed Firebase database', 'error');
                        } finally {
                          setIsSeeding(false);
                        }
                      }}
                      className="btn-3d bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2"
                    >
                      {isSeeding ? 'Populating...' : '⚡ Populate / Reset Free Firebase Data'}
                    </button>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Status: {dataService.isDemoMode() ? '🟡 Offline / Demo Bus' : '🟢 Live Firebase Cloud Firestore'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal: Add / Edit Dish ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-serif font-bold text-lg text-white mb-4">
                {editingItem ? 'Edit Dish' : 'Add New Dish'}
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const price = parseFloat((form.elements.namedItem('price') as HTMLInputElement).value) || 0;
                  const description = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
                  const image = (form.elements.namedItem('image') as HTMLInputElement).value;
                  const categoryId = (form.elements.namedItem('category') as HTMLSelectElement).value;

                  dataService.saveMenuItem({
                    id: editingItem?.id,
                    name,
                    price,
                    description,
                    image,
                    categoryId,
                    tags: editingItem?.tags || ['veg'],
                    isAvailable: editingItem ? editingItem.isAvailable : true,
                    isPopular: editingItem ? editingItem.isPopular : false,
                    sortOrder: editingItem ? editingItem.sortOrder : menuItems.length + 1,
                  });

                  toast('Dish saved!', 'success');
                  setIsItemModalOpen(false);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dish Name</label>
                  <input
                    name="name"
                    defaultValue={editingItem?.name}
                    required
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Price (₹)</label>
                    <input
                      name="price"
                      type="number"
                      defaultValue={editingItem?.price}
                      required
                      className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      name="category"
                      defaultValue={editingItem?.categoryId || categories[0]?.id}
                      className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
                  <input
                    name="image"
                    defaultValue={editingItem?.image}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    name="desc"
                    defaultValue={editingItem?.description}
                    rows={2}
                    required
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-xs mt-4"
                >
                  Save Dish
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Add Table ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-serif font-bold text-lg text-white mb-4">Add Dining Table</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const number = (form.elements.namedItem('number') as HTMLInputElement).value;
                  const seats = parseInt((form.elements.namedItem('seats') as HTMLInputElement).value) || 4;
                  const section = (form.elements.namedItem('section') as HTMLInputElement).value || 'Indoor';

                  dataService.saveTable({
                    number,
                    seats,
                    section,
                    status: 'available',
                  });

                  toast('Table added!', 'success');
                  setIsTableModalOpen(false);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Table Number (e.g. T09)</label>
                  <input
                    name="number"
                    required
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Capacity (Seats)</label>
                  <input
                    name="seats"
                    type="number"
                    defaultValue={4}
                    required
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Section</label>
                  <input
                    name="section"
                    defaultValue="Indoor"
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-xs mt-4"
                >
                  Create Table
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Add / Edit Staff & Set Password ───────────────────────── */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    {editingStaff ? 'Edit Staff & Password' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-400">Set custom login credentials</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!staffFormData.name || !staffFormData.email || !staffFormData.password) {
                    toast('Please fill all required fields', 'error');
                    return;
                  }

                  dataService.saveStaff({
                    uid: editingStaff?.uid || `staff-${Date.now()}`,
                    name: staffFormData.name.trim(),
                    email: staffFormData.email.trim(),
                    username: staffFormData.username ? staffFormData.username.trim() : staffFormData.email.split('@')[0],
                    role: staffFormData.role,
                    password: staffFormData.password.trim(),
                    phone: staffFormData.phone ? staffFormData.phone.trim() : undefined,
                    isActive: true,
                  });

                  toast(`Credentials for ${staffFormData.name} saved!`, 'success');
                  setIsStaffModalOpen(false);
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                    placeholder="e.g. Ramesh Singh"
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Username or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    placeholder="e.g. waiter1 or waiter@royalsaffron.in"
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Staff can type this directly on the login screen</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) =>
                      setStaffFormData({ ...staffFormData, role: e.target.value as StaffRole })
                    }
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="waiter">🛎️ Waiter (Floor Staff)</option>
                    <option value="kitchen">👨‍🍳 Cooker (Kitchen KDS)</option>
                    <option value="admin">👑 Admin (Manager / Owner)</option>
                  </select>
                </div>

                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-1.5">
                  <label className="block font-semibold text-orange-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" /> Staff Login Password *
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Visible to Admin</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    placeholder="Set staff password (e.g. ••••••••)"
                    className="w-full bg-[#14171c] border border-orange-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    The waiter or cooker will type this exact password to enter their station.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full bg-[#1b1f27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d w-full bg-orange-600 text-white font-bold py-3 rounded-2xl text-xs mt-2"
                >
                  {editingStaff ? 'Update Credentials & Password' : 'Save & Register Staff'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Print QR Table Card ──────────────────────────────────────── */}
      <AnimatePresence>
        {printableTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-white/15 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative text-center"
            >
              <button
                onClick={() => setPrintableTable(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ChefHat className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-serif font-bold text-white mb-0.5">{config.name}</h2>
              <p className="text-xs text-orange-400 italic mb-6">{config.tagline}</p>

              <div className="bg-white p-4 rounded-3xl shadow-xl inline-block mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/menu?table=${printableTable.id}&num=${printableTable.number}`}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-3 mb-6">
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-0.5">Table Number</p>
                <p className="text-2xl font-serif font-bold text-white">{printableTable.number}</p>
                <p className="text-[11px] text-slate-400 mt-1">Scan to view digital dining menu showcase</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-3d bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Card
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableTable(null)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* UPI Payment Slip Print Modal */}
        {isPrintingUpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12151b] border border-emerald-500/30 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative text-center"
            >
              <button
                onClick={() => setIsPrintingUpi(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Smartphone className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-serif font-bold text-white mb-0.5">
                {editingUpiName || config.upiName || config.name}
              </h2>
              <p className="text-xs text-emerald-400 font-mono mb-4">
                VPA: {editingUpiId || config.upiId || 'royalsaffron@okaxis'}
              </p>

              <div className="bg-white p-4 rounded-3xl shadow-xl inline-block mb-4 border border-emerald-500/20">
                <QRCodeSVG
                  value={buildUpiPaymentUri({
                    upiId: editingUpiId || config.upiId || 'royalsaffron@okaxis',
                    payeeName: editingUpiName || config.upiName || config.name,
                    amount: upiAmount,
                    note: upiCustomNote,
                  })}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="bg-black/50 border border-emerald-500/20 rounded-2xl p-3 mb-6">
                <p className="text-xs text-slate-400 uppercase font-bold">Total Bill Payable</p>
                <p className="text-3xl font-mono font-bold text-emerald-400">
                  ₹{upiAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{upiCustomNote}</p>
                <p className="text-[10px] text-emerald-400/80 font-medium mt-1">
                  Scan with Google Pay, PhonePe, Paytm, BHIM, CRED
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-3d bg-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintingUpi(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
