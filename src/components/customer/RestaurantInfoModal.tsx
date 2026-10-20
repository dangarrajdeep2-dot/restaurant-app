import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Wifi, FileText, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { RestaurantConfig } from '../../lib/types';
import { useToast } from '../../context/ToastContext';

interface RestaurantInfoModalProps {
  config: RestaurantConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantInfoModal({ config, isOpen, onClose }: RestaurantInfoModalProps) {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleCopyWifi = () => {
    if (config.wifiPassword) {
      navigator.clipboard.writeText(config.wifiPassword);
      setCopiedWifi(true);
      toast('Wi-Fi password copied!', 'info');
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl">
            🍛
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">{config.name}</h2>
          <p className="text-xs text-orange-600 italic font-medium">{config.tagline}</p>
        </div>

        <div className="space-y-4 text-xs text-gray-600">
          {/* Address */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
            <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">Location</p>
              <p className="text-gray-500 mt-0.5 leading-relaxed">{config.address}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${config.phone}`}
              className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
            >
              <Phone className="h-4 w-4 text-orange-500" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-[11px]">Call Us</p>
                <p className="text-[10px] text-gray-400 truncate">{config.phone}</p>
              </div>
            </a>
            <a
              href={`mailto:${config.email}`}
              className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-colors"
            >
              <Mail className="h-4 w-4 text-orange-500" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-[11px]">Email</p>
                <p className="text-[10px] text-gray-400 truncate">{config.email}</p>
              </div>
            </a>
          </div>

          {/* Hours */}
          <div className="p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="font-semibold text-gray-800">Operating Hours</p>
            </div>
            <div className="space-y-1 text-gray-500">
              {config.hours.map((h, i) => (
                <div key={i} className="flex justify-between">
                  <span>{h.day}</span>
                  <span className="font-medium text-gray-700">
                    {h.open} – {h.close}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Wi-Fi Details */}
          {config.wifiPassword && (
            <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="font-semibold text-gray-800">Guest Wi-Fi</p>
                  <p className="font-mono text-gray-600">{config.wifiPassword}</p>
                </div>
              </div>
              <button
                onClick={handleCopyWifi}
                className="p-2 text-orange-600 hover:bg-white rounded-xl transition-colors"
                title="Copy Password"
              >
                {copiedWifi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Tax / GST Details */}
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>Applicable Tax (GST)</span>
            </div>
            <span className="font-bold text-gray-800">
              {(config.taxRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-gray-900 text-white py-3 rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
