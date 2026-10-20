import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/utils';
import { dataService } from '../../lib/dataService';
import type { RestaurantConfig } from '../../lib/types';
import { restaurantConfig as defaultRestaurantConfig } from '../../lib/mockData';
import { TablePickerModal } from '../../components/customer/TablePickerModal';

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    tax,
    total,
    updateQuantity,
    removeItem,
    updateInstructions,
    clearCart,
    tableId,
    tableNumber,
    sessionToken,
  } = useCart();

  const [config, setConfig] = useState<RestaurantConfig>(defaultRestaurantConfig);
  const [specialRequest, setSpecialRequest] = useState('');
  const [editingInstructions, setEditingInstructions] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsub = dataService.subscribeConfig(setConfig);
    return unsub;
  }, []);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (!tableNumber) {
      toast('Please assign your table before placing the order', 'warning');
      setIsTableModalOpen(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Execute trusted order creation with server-side price validation
      const createdOrder = await dataService.createOrder({
        tableId: tableId || 'tbl-1',
        tableNumber: tableNumber || 'T01',
        sessionToken: sessionToken || `sess_${Date.now()}`,
        rawItems: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions,
        })),
        specialRequests: specialRequest.trim() || undefined,
      });

      toast(`Order placed successfully! #${createdOrder.orderNumber}`, 'success');
      clearCart();
      navigate(`/order-status/${createdOrder.orderNumber}`, {
        state: {
          orderNumber: createdOrder.orderNumber,
          tableNumber: createdOrder.tableNumber,
          orderId: createdOrder.id,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      toast(msg, 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif font-bold text-lg text-gray-900">Your Cart</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm mx-auto">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-5xl mb-2">
            🛒
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Looks like you haven't added any dishes yet. Explore our freshly prepared menu!
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-36">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif font-bold text-base text-gray-900 leading-tight">Your Order</h1>
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="text-xs text-orange-600 font-semibold flex items-center gap-1 hover:underline"
            >
              {tableNumber ? `Seated at Table ${tableNumber}` : 'Assign Table ⚠️'}
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            clearCart();
            toast('Cart emptied', 'info');
          }}
          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg"
        >
          Clear all
        </button>
      </header>

      {/* Table Warning Banner */}
      {!tableNumber && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Table number is missing. Select your table to submit order.</span>
          </div>
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="underline font-bold text-amber-900 shrink-0 ml-2"
          >
            Select
          </button>
        </div>
      )}

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        {/* Cart Items List */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-4">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-xs flex items-center gap-2 uppercase tracking-wide">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              {totalItems} Item{totalItems !== 1 ? 's' : ''} in Cart
            </h2>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
            >
              + Add More
            </button>
          </div>

          <AnimatePresence>
            {items.map((cartItem, index) => (
              <motion.div
                key={cartItem.menuItem.id}
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
                className={`p-4 ${index < items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex gap-3">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                    {cartItem.menuItem.image ? (
                      <img
                        src={cartItem.menuItem.image}
                        alt={cartItem.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                        {cartItem.menuItem.name}
                      </h3>
                      <button
                        onClick={() => removeItem(cartItem.menuItem.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-orange-600 font-bold text-xs mt-0.5">
                      {formatPrice(cartItem.menuItem.price)} each
                    </p>

                    {/* Special Instructions */}
                    {editingInstructions === cartItem.menuItem.id ? (
                      <div className="mt-2 flex gap-1.5">
                        <input
                          autoFocus
                          value={instructionText}
                          onChange={(e) => setInstructionText(e.target.value)}
                          placeholder="e.g. less spicy, no onion..."
                          className="flex-1 text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateInstructions(cartItem.menuItem.id, instructionText);
                              setEditingInstructions(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            updateInstructions(cartItem.menuItem.id, instructionText);
                            setEditingInstructions(null);
                          }}
                          className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-xl font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingInstructions(cartItem.menuItem.id);
                          setInstructionText(cartItem.specialInstructions || '');
                        }}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400 hover:text-orange-600 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>{cartItem.specialInstructions || 'Add custom note'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50/60">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 p-0.5">
                    <button
                      onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                      className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-gray-800 w-6 text-center">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                      className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="font-bold text-gray-900 text-sm">
                    {formatPrice(cartItem.menuItem.price * cartItem.quantity)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Special Instructions for Chef */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            Kitchen Notes & Dietary Allergies
          </label>
          <textarea
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            placeholder="Please mention any severe allergies, special celebration, or dietary preferences..."
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none leading-relaxed"
          />
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Order Price Breakdown</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Item Subtotal ({totalItems} items)</span>
              <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>GST / Government Tax ({(config.taxRate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-gray-800">{formatPrice(tax)}</span>
            </div>

            {config.serviceChargeRate ? (
              <div className="flex justify-between text-gray-600">
                <span>Service Charge ({(config.serviceChargeRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-gray-800">
                  {formatPrice(Math.round(subtotal * config.serviceChargeRate))}
                </span>
              </div>
            ) : null}

            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-gray-900">
              <span>To Pay</span>
              <span className="text-orange-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Place Order Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 safe-pb z-30 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="min-w-[100px]">
            <span className="text-[11px] text-gray-400 block -mb-0.5">Grand Total</span>
            <span className="font-serif font-bold text-lg text-gray-900">{formatPrice(total)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isPlacingOrder ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Sending to Kitchen...</span>
              </>
            ) : (
              <span>Place Order · Table {tableNumber || '?'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Table Picker Modal */}
      <TablePickerModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </div>
  );
}
