import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Clock, Star, Info, X } from 'lucide-react';
import type { MenuItem } from '../../lib/types';
import { ItemTag } from '../ui/Badge';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  onViewDetails?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onViewDetails }: MenuItemCardProps) {
  const { addItem, removeItem, updateQuantity, getItemQuantity } = useCart();
  const [imgError, setImgError] = useState(false);
  const quantity = getItemQuantity(item.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    addItem(item);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onViewDetails?.(item)}
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 flex flex-col justify-between cursor-pointer ${
        !item.isAvailable ? 'opacity-60' : ''
      }`}
    >
      {/* Top Image & Badge */}
      <div>
        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
          {item.image && !imgError ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
          )}

          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                Sold Out
              </span>
            </div>
          )}

          {item.isPopular && item.isAvailable && (
            <div className="absolute top-2.5 left-2.5">
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="h-3 w-3 fill-white" /> Popular
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(item);
            }}
            className="absolute top-2.5 right-2.5 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
            title="View Details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(item.tags as string[]).map((tag) => (
              <ItemTag key={tag} tag={tag} />
            ))}
          </div>

          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>

          {item.preparationTime && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
              <Clock className="h-3 w-3" /> ~{item.preparationTime} mins
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Price + Add Button */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-gray-50">
        <div>
          <span className="text-xs text-gray-400 block -mb-0.5">Price</span>
          <span className="text-base font-bold text-gray-900">{formatPrice(item.price)}</span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleAdd}
                disabled={!item.isAvailable}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </motion.button>
            ) : (
              <motion.div
                key="counter"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl overflow-hidden p-0.5"
              >
                <button
                  type="button"
                  onClick={() =>
                    quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, quantity - 1)
                  }
                  className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="w-5 text-center font-bold text-orange-700 text-xs"
                >
                  {quantity}
                </motion.span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/** Item Details Modal */
export function ItemDetailModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const { addItem, getItemQuantity, updateQuantity, removeItem } = useCart();
  const [instructions, setInstructions] = useState('');

  if (!item) return null;
  const quantity = getItemQuantity(item.id);

  const handleAdd = () => {
    if (!item.isAvailable) return;
    addItem(item, instructions.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Image Header */}
        <div className="relative aspect-video bg-gray-100 shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(item.tags as string[]).map((t) => (
              <ItemTag key={t} tag={t} />
            ))}
          </div>

          <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">{item.name}</h2>
          <p className="text-orange-600 font-bold text-lg mb-3">{formatPrice(item.price)}</p>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.description}</p>

          {item.allergens && item.allergens.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-800">
              <span className="font-semibold">Allergens:</span> {item.allergens.join(', ')}
            </div>
          )}

          <div className="space-y-1.5 mb-4 text-xs text-gray-500">
            {item.preparationTime && (
              <p>⏱️ Estimated preparation: {item.preparationTime} minutes</p>
            )}
            <p>🌿 Freshly prepared to order</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. less spicy, sauce on the side..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          {quantity > 0 ? (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-3 py-2">
              <button
                onClick={() =>
                  quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, quantity - 1)
                }
                className="text-gray-500 hover:text-orange-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-sm w-4 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="text-gray-500 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <button
            onClick={handleAdd}
            disabled={!item.isAvailable}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            {item.isAvailable ? `Add to Order · ${formatPrice(item.price)}` : 'Sold Out'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** Mini floating cart summary bar */
export function CartBar({ onViewCart }: { onViewCart: () => void }) {
  const { totalItems, total } = useCart();
  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-pb"
    >
      <button
        onClick={onViewCart}
        className="w-full max-w-md mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 text-white px-5 py-3.5 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
              {totalItems}
            </span>
          </div>
          <span className="font-semibold text-sm">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">{formatPrice(total)}</span>
          <span className="text-orange-200 text-sm">View Cart →</span>
        </div>
      </button>
    </motion.div>
  );
}
