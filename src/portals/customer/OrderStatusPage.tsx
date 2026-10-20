import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Home,
  Bell,
  Receipt,
  Utensils,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { formatPrice, timeAgo } from '../../lib/utils';
import type { Order, OrderStatus, RestaurantConfig } from '../../lib/types';
import { restaurantConfig as defaultRestaurantConfig } from '../../lib/mockData';
import { CallWaiterModal } from '../../components/customer/CallWaiterModal';
import { sound } from '../../lib/sound';

const statusFlow: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'served'];

const statusMeta: Record<
  OrderStatus,
  {
    icon: string;
    label: string;
    headline: string;
    message: string;
    color: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  new: {
    icon: '📋',
    label: 'Received',
    headline: 'Order Received!',
    message: 'Your ticket has reached the kitchen counter. Preparing will begin shortly.',
    color: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  confirmed: {
    icon: '👨‍🍳',
    label: 'Confirmed',
    headline: 'Order Accepted',
    message: 'The head chef reviewed your order and queued the prep line.',
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  },
  preparing: {
    icon: '🔥',
    label: 'Cooking',
    headline: 'Cooking with Passion',
    message: 'Your dishes are being cooked fresh in the tandoor and kitchen.',
    color: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  ready: {
    icon: '🔔',
    label: 'Ready',
    headline: 'Ready to Serve!',
    message: 'Plated hot and ready. Your server will deliver it to your table right away.',
    color: 'text-green-600',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
  },
  served: {
    icon: '🍽️',
    label: 'Served',
    headline: 'Bon Appétit!',
    message: 'Served at your table. We hope you enjoy every single bite!',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  cancelled: {
    icon: '❌',
    label: 'Cancelled',
    headline: 'Order Cancelled',
    message: 'This order was cancelled. Please speak with your server if this was unexpected.',
    color: 'text-red-600',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
  },
};

export default function OrderStatusPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<RestaurantConfig>(defaultRestaurantConfig);
  const [loading, setLoading] = useState(true);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [lastStatus, setLastStatus] = useState<OrderStatus | null>(null);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!orderNumber) return;

    const unsubOrder = dataService.subscribeSingleOrder(orderNumber, (liveOrder) => {
      setOrder(liveOrder);
      setLoading(false);

      if (liveOrder && liveOrder.status !== lastStatus) {
        if (lastStatus !== null && liveOrder.status === 'ready') {
          sound.playAlertBell();
        }
        setLastStatus(liveOrder.status);
      }
    });

    const unsubConfig = dataService.subscribeConfig(setConfig);

    return () => {
      unsubOrder();
      unsubConfig();
    };
  }, [orderNumber, lastStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <svg className="animate-spin h-8 w-8 text-orange-500 mb-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs text-gray-500 font-medium">Fetching order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
          🔍
        </div>
        <h2 className="text-lg font-serif font-bold text-gray-800 mb-1">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">
          Could not locate order #{orderNumber}. It may have been archived or removed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const currentStatus = order.status;
  const currentStepIndex = statusFlow.indexOf(currentStatus);
  const meta = statusMeta[currentStatus] || statusMeta.new;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/70 via-white to-gray-50 flex flex-col font-sans pb-28">
      {/* Top Bar */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-orange-100/60 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div>
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
            {config.name}
          </p>
          <h1 className="font-serif font-bold text-base text-gray-900">Live Order Tracker</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
            Table {order.tableNumber}
          </span>
          <button
            onClick={() => setIsCallWaiterOpen(true)}
            className="p-1.5 text-gray-500 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors"
            title="Call Waiter"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-4">
        {/* Main Status Hero Card */}
        <motion.div
          key={currentStatus}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 p-6 text-center border border-orange-100/80 mb-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

          {/* Animated Big Icon */}
          <motion.div
            key={`icon-${currentStatus}`}
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="text-6xl mb-3 drop-shadow-sm select-none"
          >
            {meta.icon}
          </motion.div>

          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 ${meta.badgeBg} ${meta.badgeText}`}
          >
            {meta.label}
          </span>

          <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">{meta.headline}</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mb-4">
            {meta.message}
          </p>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-gray-400 block uppercase font-medium">Order Reference</span>
              <span className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-medium">Placed</span>
              <span className="text-xs font-semibold text-gray-700">{timeAgo(order.createdAt)}</span>
            </div>
          </div>
        </motion.div>

        {/* Multi-step Visual Progress Timeline */}
        {currentStatus !== 'cancelled' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Kitchen Preparation Stage
            </h3>

            <div className="relative pl-6 space-y-6">
              {/* Vertical connecting line */}
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100">
                <motion.div
                  className="w-full bg-orange-500 origin-top"
                  animate={{
                    height: `${(Math.max(0, currentStepIndex) / (statusFlow.length - 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {statusFlow.map((stepKey, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const step = statusMeta[stepKey];

                return (
                  <div key={stepKey} className="relative flex items-center justify-between">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-orange-500 text-white'
                          : isCurrent
                          ? 'bg-orange-500 text-white ring-4 ring-orange-100 scale-110'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <div className="pl-3">
                      <p
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-orange-600 font-bold'
                            : isPassed
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-gray-400">{step.headline}</p>
                    </div>

                    {isCurrent && (
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Receipt Breakdown */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-orange-500" /> Itemized Bill
            </h3>
            <span className="text-xs text-gray-400">{order.items.length} items</span>
          </div>

          <div className="space-y-2.5 text-xs divide-y divide-gray-50/70">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-2 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.name} <span className="text-orange-600">×{item.quantity}</span>
                  </p>
                  {item.specialInstructions && (
                    <p className="text-[10px] text-amber-700 italic mt-0.5">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <span className="font-bold text-gray-900 shrink-0 ml-2">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.specialRequests && (
            <div className="mt-3 bg-amber-50 rounded-2xl p-2.5 text-[11px] text-amber-800">
              <span className="font-bold">Table Notes:</span> {order.specialRequests}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            {order.serviceCharge ? (
              <div className="flex justify-between text-gray-500">
                <span>Service Charge</span>
                <span>{formatPrice(order.serviceCharge)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-50">
              <span>Total Paid / Due</span>
              <span className="text-orange-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsCallWaiterOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 p-3.5 rounded-2xl text-xs font-semibold shadow-sm transition-all"
          >
            <Bell className="h-4 w-4 text-orange-500" />
            <span>Call Server / Water</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white p-3.5 rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Order More Items</span>
          </button>
        </div>

        {/* Footer Back */}
        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 flex items-center justify-center gap-1.5"
        >
          <Home className="h-3.5 w-3.5" /> Back to Dining Menu
        </button>
      </div>

      {/* Call Waiter Modal */}
      <CallWaiterModal
        tableId={order.tableId}
        tableNumber={order.tableNumber}
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
      />
    </div>
  );
}
