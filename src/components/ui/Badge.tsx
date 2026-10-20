import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'veg' | 'nonveg' | 'vegan' | 'spicy' | 'new' | 'chef' | 'popular' | 'unavailable';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default:     'bg-gray-100 text-gray-600',
  veg:         'bg-green-100 text-green-700',
  nonveg:      'bg-red-100 text-red-700',
  vegan:       'bg-emerald-100 text-emerald-700',
  spicy:       'bg-orange-100 text-orange-700',
  new:         'bg-blue-100 text-blue-700',
  chef:        'bg-amber-100 text-amber-700',
  popular:     'bg-purple-100 text-purple-700',
  unavailable: 'bg-gray-100 text-gray-400',
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

/** Tag chip for menu item dietary/type tags */
export function ItemTag({ tag }: { tag: string }) {
  const tagConfig: Record<string, { label: string; variant: BadgeProps['variant']; icon: string }> = {
    veg:         { label: 'Veg', variant: 'veg', icon: '🟢' },
    'non-veg':   { label: 'Non-Veg', variant: 'nonveg', icon: '🔴' },
    vegan:       { label: 'Vegan', variant: 'vegan', icon: '🌱' },
    spicy:       { label: 'Spicy', variant: 'spicy', icon: '🌶️' },
    new:         { label: 'New', variant: 'new', icon: '✨' },
    'chef-special': { label: "Chef's Special", variant: 'chef', icon: '👨‍🍳' },
  };
  const config = tagConfig[tag] || { label: tag, variant: 'default' as const, icon: '' };
  return (
    <Badge variant={config.variant} size="sm">
      {config.icon && <span className="text-[10px]">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

/** Order status badge */
export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; classes: string }> = {
    new:       { label: '🔵 New', classes: 'bg-blue-100 text-blue-700' },
    confirmed: { label: '🟣 Confirmed', classes: 'bg-indigo-100 text-indigo-700' },
    preparing: { label: '🟡 Preparing', classes: 'bg-amber-100 text-amber-700' },
    ready:     { label: '🟢 Ready', classes: 'bg-green-100 text-green-700' },
    served:    { label: '✅ Served', classes: 'bg-gray-100 text-gray-600' },
    cancelled: { label: '❌ Cancelled', classes: 'bg-red-100 text-red-700' },
  };
  const config = statusConfig[status] || statusConfig.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
