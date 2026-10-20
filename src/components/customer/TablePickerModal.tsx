import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Utensils, X, Check, Users } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import type { Table } from '../../lib/types';
import { useCart } from '../../context/CartContext';
import { generateSessionToken } from '../../lib/utils';

interface TablePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TablePickerModal({ isOpen, onClose }: TablePickerModalProps) {
  const { tableNumber, setTable } = useCart();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribeTables((data) => {
      setTables(data);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const sections = ['all', ...Array.from(new Set(tables.map((t) => t.section).filter(Boolean)))];

  const filteredTables =
    selectedSection === 'all'
      ? tables
      : tables.filter((t) => t.section === selectedSection);

  const handleSelectTable = (table: Table) => {
    setTable(table.id, table.number, generateSessionToken());
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const cleanNum = manualInput.trim().toUpperCase();
    const found = tables.find((t) => t.number.toUpperCase() === cleanNum);
    const tableId = found ? found.id : `tbl-${cleanNum.toLowerCase()}`;
    setTable(tableId, cleanNum, generateSessionToken());
    onClose();
  };

  const handleTakeaway = () => {
    setTable('takeaway', 'Takeaway', generateSessionToken());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-5 shrink-0">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl">
            🪑
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Select Your Table</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tableNumber
              ? `Currently seated at Table ${tableNumber}`
              : 'Choose your table to start ordering'}
          </p>
        </div>

        {/* Manual Input */}
        <form onSubmit={handleManualSubmit} className="mb-4 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type table number (e.g. T01)..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium"
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Confirm
          </button>
        </form>

        {/* Section Tabs */}
        {sections.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-3 shrink-0">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSection(s as string)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-all ${
                  selectedSection === s
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto mb-4 pr-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {filteredTables.map((t) => {
              const isCurrent = tableNumber === t.number;
              const isOccupied = t.status === 'occupied' && !isCurrent;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTable(t)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative ${
                    isCurrent
                      ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400'
                      : isOccupied
                      ? 'border-gray-200 bg-gray-50/70 hover:border-orange-200'
                      : 'border-gray-200 hover:border-orange-300 bg-white hover:shadow-sm'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-1.5 right-1.5 text-orange-600">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="font-bold text-gray-900 text-sm">{t.number}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                    <Users className="h-2.5 w-2.5" /> {t.seats}
                  </span>
                  <span
                    className={`text-[9px] font-medium mt-1 px-1.5 py-0.2 rounded-full ${
                      isCurrent
                        ? 'text-orange-700 bg-orange-100'
                        : isOccupied
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-green-700 bg-green-50'
                    }`}
                  >
                    {isCurrent ? 'Your Table' : t.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Takeaway Option */}
        <div className="pt-2 border-t border-gray-100 shrink-0">
          <button
            onClick={handleTakeaway}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-orange-400 text-gray-600 hover:text-orange-600 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <Utensils className="h-3.5 w-3.5" />
            Ordering for Takeaway / Pick-up instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}
