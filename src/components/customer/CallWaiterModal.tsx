import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Droplets, Receipt, Sparkles, X, Check } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import type { ServiceRequestType } from '../../lib/types';
import { useToast } from '../../context/ToastContext';

interface CallWaiterModalProps {
  tableId: string;
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CallWaiterModal({ tableId, tableNumber, isOpen, onClose }: CallWaiterModalProps) {
  const [selectedType, setSelectedType] = useState<ServiceRequestType>('call_waiter');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const options: { type: ServiceRequestType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'call_waiter',
      label: 'Call Waiter',
      icon: <Bell className="h-5 w-5 text-orange-500" />,
      desc: 'Request a server to visit your table',
    },
    {
      type: 'water',
      label: 'Water Refill',
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
      desc: 'Bring a water jug or glass refills',
    },
    {
      type: 'bill',
      label: 'Request Bill',
      icon: <Receipt className="h-5 w-5 text-green-500" />,
      desc: 'Ask server to bring invoice for payment',
    },
    {
      type: 'clean_table',
      label: 'Clean Table',
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      desc: 'Request table wipe or napkin restock',
    },
  ];

  const handleSubmit = async () => {
    if (!tableNumber) {
      toast('Please select a table first', 'warning');
      return;
    }
    setLoading(true);
    try {
      await dataService.createServiceRequest(
        tableId || 'tbl-walkin',
        tableNumber,
        selectedType,
        message.trim() || undefined
      );
      setSent(true);
      toast(`Waiter alerted for Table ${tableNumber}`, 'success');
      setTimeout(() => {
        setSent(false);
        setMessage('');
        onClose();
      }, 1800);
    } catch {
      toast('Could not notify staff. Please call someone directly.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-gray-900 mb-1">Staff Notified!</h3>
            <p className="text-sm text-gray-500">
              A waiter is on the way to Table {tableNumber || 'your table'}.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🛎️</span>
              <h3 className="font-serif font-bold text-xl text-gray-900">Table Service</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Table {tableNumber || 'Unassigned'} · Need anything? Let our floor staff know instantly.
            </p>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {options.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedType(opt.type)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    selectedType === opt.type
                      ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        selectedType === opt.type ? 'text-orange-950' : 'text-gray-800'
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="mb-5">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional notes (e.g. extra napkins)..."
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Alerting Waiter...
                </>
              ) : (
                'Send Request'
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
