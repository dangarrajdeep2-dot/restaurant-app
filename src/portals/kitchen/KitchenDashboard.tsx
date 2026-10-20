import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Flame,
  Check,
  Filter,
  ArrowLeft,
  Sparkles,
  ArrowUpDown,
  UtensilsCrossed,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { sound } from '../../lib/sound';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, timeAgo } from '../../lib/utils';
import type { Order, OrderStatus } from '../../lib/types';

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  // Sort order defaults to 'fifo' (First-In, First-Out: Jo waiter ne pehle diya wo pehle)
  const [sortMode, setSortMode] = useState<'fifo' | 'lifo'>('fifo');
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user, logout } = useAuth();
  const prevOrdersCountRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = dataService.subscribeOrders((liveOrders) => {
      // Audio chime if new order arrives
      if (prevOrdersCountRef.current > 0 && liveOrders.length > prevOrdersCountRef.current) {
        sound.playOrderChime();
      }
      prevOrdersCountRef.current = liveOrders.length;
      setOrders(liveOrders);
    });
    return unsub;
  }, []);

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, nextStatus: OrderStatus) => {
    await dataService.updateOrderStatus(orderId, nextStatus);
    if (nextStatus === 'ready') {
      sound.playAlertBell();
    }
  };

  const handleToggleItem = async (orderId: string, itemIdx: number) => {
    await dataService.toggleKitchenItem(orderId, itemIdx);
  };

  const activeOrders = orders.filter((o) =>
    ['new', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );

  // FIFO (First-In First-Out): Jo order waiter ne pehle diya (earliest createdAt), wo pehle aayega!
  const sortedOrders = [...activeOrders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortMode === 'fifo' ? timeA - timeB : timeB - timeA;
  });

  const filteredTickets =
    activeFilter === 'all'
      ? sortedOrders
      : sortedOrders.filter((o) => {
          if (activeFilter === 'new') return o.status === 'new' || o.status === 'confirmed';
          return o.status === activeFilter;
        });

  const counts = {
    new: activeOrders.filter((o) => o.status === 'new' || o.status === 'confirmed').length,
    preparing: activeOrders.filter((o) => o.status === 'preparing').length,
    ready: activeOrders.filter((o) => o.status === 'ready').length,
  };

  const getElapsedMinutes = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    return Math.max(0, Math.floor(diff));
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-white">
      {/* ── 3D Top Command Bar ────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0f1115]/95 backdrop-blur-xl px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-colors shrink-0"
              title="Return to Staff Hub"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 ring-1 ring-white/20 shrink-0">
              <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-serif font-bold text-sm sm:text-base text-white truncate">Kitchen KDS</h1>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  FIFO
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
                Cooker: {user?.name || 'Head Chef Amar'} · Pehle Aaya Order Pehle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="text-right hidden md:block mr-2">
              <p className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
              <p className="text-[9px] text-slate-400">Kitchen Clock</p>
            </div>

            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors shrink-0 ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
              title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl transition-colors shrink-0 hidden sm:flex"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={logout}
              className="p-2 bg-white/5 border border-white/10 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter & Queue Sorting Bar ─────────────────────────────────────────── */}
      <div className="bg-[#12151b] border-b border-white/10 px-3 sm:px-4 py-2 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${activeOrders.length})` },
              { id: 'new', label: `New (${counts.new})`, alert: counts.new > 0 },
              { id: 'preparing', label: `Cooking (${counts.preparing})` },
              { id: 'ready', label: `Ready (${counts.ready})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 relative ${
                  activeFilter === tab.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#1b1f27] text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.alert && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                )}
              </button>
            ))}
          </div>

          {/* FIFO vs LIFO Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center bg-[#090b0f] p-1 rounded-2xl border border-white/10 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setSortMode('fifo')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                  sortMode === 'fifo'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pehle aane wala order pehle cook karein (First-In, First-Out)"
              >
                <span>⏳ Pehle Aaya (FIFO)</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('lifo')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                  sortMode === 'lifo'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Latest order pehle dikhega"
              >
                <span>🆕 Naya Pehle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3D Ticket Stream Grid ─────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="py-24 text-center glass-card-3d rounded-3xl border border-white/10 p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h2 className="text-xl font-serif font-bold text-white">All Caught Up, Chef!</h2>
            <p className="text-xs text-slate-400 mt-1">
              No orders waiting in this section. When a waiter punches an order, it will arrive here
              instantly with an audio chime in the exact sequence it was given.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((order, index) => {
                const elapsedMin = getElapsedMinutes(order.createdAt);
                const isUrgent = elapsedMin >= 20;
                const isWarning = elapsedMin >= 10 && elapsedMin < 20;
                const isNew = order.status === 'new' || order.status === 'confirmed';
                const isCooking = order.status === 'preparing';
                const isReady = order.status === 'ready';
                const isFirstPriority = sortMode === 'fifo' && index === 0 && !isReady;
                const orderTimeStr = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                      isUrgent
                        ? 'bg-[#150a0a] border-red-500 ring-2 ring-red-500/50 shadow-red-500/20'
                        : isNew
                        ? 'bg-[#0f1420] border-blue-500/60 shadow-blue-500/10'
                        : isCooking
                        ? 'bg-[#17140e] border-amber-500/60 shadow-amber-500/10'
                        : 'bg-[#0c1712] border-emerald-500/60 shadow-emerald-500/10'
                    }`}
                  >
                    {/* Ticket Metallic Clip Header */}
                    <div>
                      <div
                        className={`p-3.5 sm:p-4 border-b flex items-start justify-between gap-2.5 ${
                          isUrgent
                            ? 'bg-red-950/80 border-red-800/60'
                            : isNew
                            ? 'bg-blue-950/80 border-blue-800/60'
                            : isCooking
                            ? 'bg-amber-950/80 border-amber-800/60'
                            : 'bg-emerald-950/80 border-emerald-800/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-serif font-black text-xl sm:text-2xl text-white tracking-wide">
                              TABLE {order.tableNumber}
                            </h3>
                            {isFirstPriority && (
                              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow animate-pulse shrink-0">
                                🔥 1st Priority
                              </span>
                            )}
                            {isNew && !isFirstPriority && (
                              <span className="bg-blue-500 text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full animate-bounce shrink-0">
                                NEW
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 flex-wrap">
                            <span className="font-mono">#{order.orderNumber}</span>
                            <span>•</span>
                            <span className="font-mono text-amber-300/90 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {orderTimeStr} ({elapsedMin}m)
                            </span>
                          </div>

                          {order.waiterName && (
                            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1 truncate">
                              <span>🛎️ Waiter:</span>
                              <strong className="text-white truncate">{order.waiterName}</strong>
                            </p>
                          )}
                        </div>

                        {/* Queue Position & Elapsed Badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-xl font-mono text-[11px] font-bold border ${
                              isUrgent
                                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{elapsedMin}m</span>
                          </div>

                          <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-amber-300 font-mono">
                            Queue #{index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Items Checklist for Cook */}
                      <div className="p-4 space-y-2">
                        {order.items.map((item, idx) => {
                          const isDone = item.isCompletedInKitchen;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleItem(order.id, idx)}
                              className={`p-2.5 rounded-2xl border flex items-start justify-between gap-2 cursor-pointer transition-all ${
                                isDone
                                    ? 'bg-black/30 border-white/5 opacity-40 line-through'
                                  : 'bg-black/60 border-white/10 hover:border-amber-500/50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-black'
                                      : 'border-slate-500 bg-black/40'
                                  }`}
                                >
                                  {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-white leading-tight">
                                    {item.name}
                                  </p>
                                  {item.specialInstructions && (
                                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                                      ⚠️ {item.specialInstructions}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="font-mono font-bold text-xs bg-white/10 px-2 py-0.5 rounded-lg text-white shrink-0">
                                ×{item.quantity}
                              </span>
                            </div>
                          );
                        })}

                        {order.specialRequests && (
                          <div className="mt-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl p-2.5 text-xs text-amber-200">
                            <span className="font-bold flex items-center gap-1 mb-0.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Waiter Notes:
                            </span>
                            <p>{order.specialRequests}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3D Action Bump Controls */}
                    <div className="p-4 pt-1 border-t border-white/10">
                      {isNew && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="btn-3d w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
                        >
                          <Flame className="h-4 w-4" />
                          <span>Accept & Start Cooking</span>
                        </button>
                      )}

                      {isCooking && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="btn-3d-emerald w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Bump / Mark Ready for Waiter</span>
                        </button>
                      )}

                      {isReady && (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3 py-2 text-xs text-emerald-400">
                          <span className="font-bold flex items-center gap-1.5">
                            <Check className="h-4 w-4" /> Ready at pass
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(order.id, 'served')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-xl text-[11px] font-bold"
                          >
                            Mark Done
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
