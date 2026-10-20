import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Sparkles,
  ArrowLeft,
  Clock,
  Star,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { formatPrice } from '../../lib/utils';
import type { MenuItem, MenuCategory, RestaurantConfig } from '../../lib/types';
import { mockCategories, mockMenuItems, restaurantConfig as defaultRestaurantConfig } from '../../lib/mockData';
import { ItemTag } from '../../components/ui/Badge';
import { RestaurantInfoModal } from '../../components/customer/RestaurantInfoModal';

export default function MenuPage() {
  const [config, setConfig] = useState<RestaurantConfig>(defaultRestaurantConfig);
  const [categories, setCategories] = useState<MenuCategory[]>(mockCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('num');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubConfig = dataService.subscribeConfig(setConfig);
    const unsubCats = dataService.subscribeCategories(setCategories);
    const unsubItems = dataService.subscribeMenuItems(setMenuItems);

    return () => {
      unsubConfig();
      unsubCats();
      unsubItems();
    };
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        filterTag === 'all' ||
        (Array.isArray(item.tags) && (item.tags as string[]).includes(filterTag));
      return matchesCategory && matchesSearch && matchesTag;
    });
  }, [menuItems, activeCategory, searchQuery, filterTag]);

  return (
    <div className="min-h-screen bg-[#08090b] text-slate-100 font-sans pb-16 selection:bg-orange-500 selection:text-white">
      {/* ── Top Notice Bar ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white px-4 py-2 text-center text-xs font-semibold shadow-md">
        <span>📖 Digital Menu Showcase {tableNum ? `· Table ${tableNum}` : ''}</span>
        <span className="opacity-90 ml-2 font-normal">
          (Orders are placed directly through your floor waiter)
        </span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#0f1115]/90 backdrop-blur-xl sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Staff Hub</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif font-bold text-base text-white">{config.name}</h1>
            <p className="text-[10px] text-orange-400 font-medium">Fine Dining Menu</p>
          </div>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-colors"
            title="Restaurant Info"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search dishes, curries, breads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14171d] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dietary Filter Tags */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'veg', label: '🟢 Veg' },
            { id: 'non-veg', label: '🔴 Non-Veg' },
            { id: 'vegan', label: '🌱 Vegan' },
            { id: 'spicy', label: '🌶️ Spicy' },
            { id: 'chef-special', label: "👨‍🍳 Chef's Special" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterTag(f.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterTag === f.id
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-[#14171d] text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#14171d] text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter((c) => c.isActive)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#14171d] text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                <span>{cat.icon || '🍽️'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`glass-card-3d rounded-3xl p-4 flex gap-3 border border-white/10 relative overflow-hidden ${
                !item.isAvailable ? 'opacity-50' : ''
              }`}
            >
              {/* Dish Image */}
              <div className="w-24 h-24 rounded-2xl bg-black/40 overflow-hidden shrink-0 border border-white/10">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                )}
              </div>

              {/* Dish Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {(item.tags as string[]).map((t) => (
                      <ItemTag key={t} tag={t} />
                    ))}
                  </div>

                  <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                  <span className="font-mono font-bold text-orange-400 text-sm">
                    {formatPrice(item.price)}
                  </span>

                  {item.isAvailable ? (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      Sold Out (86)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Server Order Note */}
        <div className="mt-8 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-3xl p-5 text-center">
          <p className="text-xs text-orange-300 font-semibold">
            🛎️ To order any of these dishes, please let your floor waiter know.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Our waiters have digital table stations to punch your order directly to the kitchen.
          </p>
        </div>
      </main>

      <RestaurantInfoModal
        config={config}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
