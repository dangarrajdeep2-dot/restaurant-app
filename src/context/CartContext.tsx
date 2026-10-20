import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { CartItem, MenuItem } from '../lib/types';
import { calculateTotals } from '../lib/utils';

// ─── State ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  tableId: string;
  tableNumber: string;
  sessionToken: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: MenuItem; specialInstructions?: string } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'UPDATE_INSTRUCTIONS'; payload: { itemId: string; instructions: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_TABLE'; payload: { tableId: string; tableNumber: string; sessionToken: string } };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.menuItem.id === action.payload.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.menuItem.id === action.payload.item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, {
          menuItem: action.payload.item,
          quantity: 1,
          specialInstructions: action.payload.specialInstructions,
        }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.menuItem.id !== action.payload.itemId) };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.menuItem.id !== action.payload.itemId) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItem.id === action.payload.itemId ? { ...i, quantity: action.payload.quantity } : i
        ),
      };
    }
    case 'UPDATE_INSTRUCTIONS':
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItem.id === action.payload.itemId ? { ...i, specialInstructions: action.payload.instructions } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_TABLE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  tableId: string;
  tableNumber: string;
  sessionToken: string;
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  addItem: (item: MenuItem, specialInstructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  setTable: (tableId: string, tableNumber: string, sessionToken: string) => void;
  getItemQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = {
  items: [],
  tableId: '',
  tableNumber: '',
  sessionToken: '',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const { subtotal, tax, total } = calculateTotals(
    state.items.map(i => ({ price: i.menuItem.price, quantity: i.quantity }))
  );

  const addItem = useCallback((item: MenuItem, specialInstructions?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { item, specialInstructions } });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  }, []);

  const updateInstructions = useCallback((itemId: string, instructions: string) => {
    dispatch({ type: 'UPDATE_INSTRUCTIONS', payload: { itemId, instructions } });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const setTable = useCallback((tableId: string, tableNumber: string, sessionToken: string) => {
    dispatch({ type: 'SET_TABLE', payload: { tableId, tableNumber, sessionToken } });
  }, []);

  const getItemQuantity = useCallback(
    (itemId: string) => state.items.find(i => i.menuItem.id === itemId)?.quantity ?? 0,
    [state.items]
  );

  return (
    <CartContext.Provider value={{
      items: state.items,
      tableId: state.tableId,
      tableNumber: state.tableNumber,
      sessionToken: state.sessionToken,
      totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      tax,
      total,
      addItem,
      removeItem,
      updateQuantity,
      updateInstructions,
      clearCart,
      setTable,
      getItemQuantity,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
