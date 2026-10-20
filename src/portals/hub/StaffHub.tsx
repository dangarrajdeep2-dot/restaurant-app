import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ChefHat,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Bell,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { formatPrice } from '../../lib/utils';
import type { Order, Table, RestaurantConfig } from '../../lib/types';
import { restaurantConfig as initialRestaurantConfig } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';

export default function StaffHub() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [config, setConfig] = useState<RestaurantConfig>(initialRestaurantConfig);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubConfig = dataService.subscribeConfig(setConfig);
    const unsubOrders = dataService.subscribeOrders(setOrders);
    const unsubTables = dataService.subscribeTables(setTables);

    return () => {
      unsubConfig();
      unsubOrders();
      unsubTables();
    };
  }, []);

  const activeOrders = orders.filter((o) => !['served', 'cancelled'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const cookingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'new');
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const todayRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const handleLaunchStation = (route: string) => {
    navigate(route);
  };

  const stations = [
    {
      id: 'waiter',
      title: 'Waiter Floor Station',
      subtitle: 'Table Service & Billing',
      role: 'Waiter / Captain',
      email: 'waiter@royalsaffron.in',
      icon: <UtensilsCrossed className="h-8 w-8 text-orange-400" />,
      color: 'from-orange-500/20 to-amber-500/10',
      borderGlow: 'hover:border-orange-500/70 hover:shadow-orange-500/20',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      btnColor: 'btn-3d bg-orange-600',
      accentColor: 'text-orange-400',
      route: '/waiter',
      stats: [
        { label: 'Occupied Tables', val: `${occupiedTables} / ${tables.length}` },
        { label: 'Ready to Serve', val: readyOrders.length, alert: readyOrders.length > 0 },
      ],
      desc: 'Punch orders directly at tables, manage table floor map, and settle customer bills.',
    },
    {
      id: 'kitchen',
      title: 'Cook & Kitchen Station',
      subtitle: 'Kitchen Display System (KDS)',
      role: 'Head Chef / Cooker',
      email: 'kitchen@royalsaffron.in',
      icon: <ChefHat className="h-8 w-8 text-amber-400" />,
      color: 'from-amber-500/20 to-red-500/10',
      borderGlow: 'hover:border-amber-500/70 hover:shadow-amber-500/20',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      btnColor: 'btn-3d bg-amber-600 text-white',
      accentColor: 'text-amber-400',
      route: '/kitchen',
      stats: [
        { label: 'Active Tickets', val: activeOrders.length },
        { label: 'Cooking Now', val: cookingOrders.length, alert: cookingOrders.length > 0 },
      ],
      desc: 'Live high-contrast ticket stream, dish preparation checklists, and urgency timers.',
    },
    {
      id: 'admin',
      title: 'Executive Admin Hub',
      subtitle: 'Store Oversight & Analytics',
      role: 'Manager / Owner',
      email: 'admin@royalsaffron.in',
      icon: <LayoutDashboard className="h-8 w-8 text-blue-400" />,
      color: 'from-blue-500/20 to-cyan-500/10',
      borderGlow: 'hover:border-blue-500/70 hover:shadow-blue-500/20',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      btnColor: 'btn-3d-blue bg-blue-600 text-white',
      accentColor: 'text-blue-400',
      route: '/admin',
      stats: [
        { label: "Today's Revenue", val: formatPrice(todayRevenue) },
        { label: 'Active Staff', val: '3 Online' },
      ],
      desc: 'Real-time sales revenue, menu catalog editor (86 stock), table management, and settings.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090b] text-slate-100 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* 3D Dynamic Ambient Glows */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0f1115]/80 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-1 ring-white/20 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide truncate">
                  {config.name}
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3D STAFF OS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate hidden xs:block">{config.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-right hidden md:block">
              <p className="font-mono text-sm font-bold text-white tracking-wider">
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Internal Operations Hub</p>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold hidden sm:inline">{user.name}</span>
                <button
                  onClick={logout}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 transition-all hover:text-white shrink-0"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-white/5 hover:bg-white/10 border border-white/15 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 transition-all hover:text-white shrink-0"
              >
                Staff Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main 3D Hero Workspace ───────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 flex flex-col justify-center">
        {/* Title Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 text-xs text-orange-300 font-bold uppercase tracking-wider mb-3 shadow-lg"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Authorized Restaurant Operations Only</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-md mb-2"
          >
            Select Your 3D Operations Station
          </motion.h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Customer self-ordering is turned off. Orders are taken at the table by Waiters,
            prepared by Kitchen Cookers, and managed by Admins.
          </p>
        </div>

        {/* 3D Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000 mb-8">
          {stations.map((st, idx) => (
            <motion.div
              key={st.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * idx, duration: 0.4 }}
              onClick={() => handleLaunchStation(st.route)}
              className={`group glass-card-3d rounded-3xl p-6 flex flex-col justify-between cursor-pointer border border-white/10 ${st.borderGlow} relative overflow-hidden`}
            >
              {/* Top ambient highlight */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${st.color} opacity-60 group-hover:opacity-100 transition-opacity`}
              />

              <div>
                {/* Station Badge & Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                    {st.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${st.badgeColor}`}
                  >
                    {st.role}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xl text-white mb-1 group-hover:text-orange-300 transition-colors">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{st.desc}</p>

                {/* Metrics Blocks */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {st.stats.map((stat, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {stat.label}
                      </span>
                      <span
                        className={`text-base font-bold font-mono ${
                          stat.alert ? 'text-emerald-400 animate-pulse' : 'text-white'
                        }`}
                      >
                        {stat.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3D Action Button */}
              <button
                type="button"
                className={`w-full ${st.btnColor} text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform group-hover:scale-[1.02] active:scale-[0.98]`}
              >
                <span>Launch {st.title.split(' ')[0]} Station</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Live Status Bar */}
        <div className="glass-card-3d rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live System Status: Fully Operational
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Active Tables: {occupiedTables} Occupied</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Need digital menu showcase?</span>
            <button
              onClick={() => navigate('/menu')}
              className="text-xs text-orange-400 font-bold hover:underline"
            >
              View Menu Board →
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="text-center py-4 border-t border-white/5 text-[11px] text-slate-600">
        <p>
          {config.name} Management Suite · Mobile-First 3D Architecture · Waiter, Cook & Admin
          Exclusive
        </p>
      </footer>
    </div>
  );
}
