import { restaurantConfig } from './mockData';

/** Format price with currency symbol */
export function formatPrice(amount: number): string {
  return `${restaurantConfig.currencySymbol}${amount.toLocaleString('en-IN')}`;
}

/** Calculate order totals from items */
export function calculateTotals(items: { price: number; quantity: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * restaurantConfig.taxRate);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/** Generate a short unique order number */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

/** Generate a session token for anonymous customers */
export function generateSessionToken(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

/** Format time ago string */
export function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/** Get display label for order status */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'New Order',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready to Serve',
    served: 'Served',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/** Get color classes for order status */
export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    new:       { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
    confirmed: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    preparing: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
    ready:     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
    served:    { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200' },
    cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  };
  return colors[status] || colors.new;
}

/** Debounce utility */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds a standard NPCI / UPI payment deep link URI
 * Compatible with Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, etc.
 */
export function buildUpiPaymentUri(params: {
  upiId: string;
  payeeName?: string;
  amount: number;
  note?: string;
}): string {
  const { upiId, payeeName = 'The Royal Saffron', amount, note = 'Restaurant Bill' } = params;
  const cleanUpi = (upiId || '').trim();
  const cleanAmount = amount > 0 ? amount.toFixed(2) : '0.00';
  const cleanName = encodeURIComponent((payeeName || 'Restaurant').trim());
  const cleanNote = encodeURIComponent((note || 'Bill Payment').trim());
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}
