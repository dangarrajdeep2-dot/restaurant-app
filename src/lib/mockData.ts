import type { MenuCategory, MenuItem, Table, Order, RestaurantConfig } from './types';

export const restaurantConfig: RestaurantConfig = {
  name: 'The Royal Saffron',
  tagline: 'Crafted Flavors & Royal Dining Experience',
  phone: '+91 98765 43210',
  email: 'hello@royalsaffron.in',
  address: 'Level 3, The Grand Heritage, MG Road, New Delhi - 110001',
  hours: [
    { day: 'Mon–Thu', open: '12:00 PM', close: '11:00 PM' },
    { day: 'Fri–Sat', open: '12:00 PM', close: '11:59 PM' },
    { day: 'Sunday', open: '1:00 PM', close: '10:30 PM' },
  ],
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 0.05,
  primaryColor: '#f97316',
  upiId: 'royalsaffron@okaxis',
  upiName: 'The Royal Saffron',
};

export const mockCategories: MenuCategory[] = [
  { id: 'cat-1', name: 'Starters', description: 'Begin your journey', icon: '🥗', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Soups', description: 'Warm your soul', icon: '🥣', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Main Course', description: 'Hearty mains', icon: '🍛', sortOrder: 3, isActive: true },
  { id: 'cat-4', name: 'Breads', description: 'Fresh from tandoor', icon: '🫓', sortOrder: 4, isActive: true },
  { id: 'cat-5', name: 'Rice & Biryani', description: 'Aromatic rice dishes', icon: '🍚', sortOrder: 5, isActive: true },
  { id: 'cat-6', name: 'Desserts', description: 'Sweet endings', icon: '🍮', sortOrder: 6, isActive: true },
  { id: 'cat-7', name: 'Beverages', description: 'Refresh yourself', icon: '🥤', sortOrder: 7, isActive: true },
];

export const mockMenuItems: MenuItem[] = [
  // Starters
  {
    id: 'item-1', categoryId: 'cat-1', name: 'Paneer Tikka', description: 'Cottage cheese marinated in spiced yogurt, grilled in tandoor. Served with mint chutney.',
    price: 320, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
    tags: ['veg', 'chef-special'], isAvailable: true, isPopular: true, preparationTime: 15, sortOrder: 1,
  },
  {
    id: 'item-2', categoryId: 'cat-1', name: 'Chicken 65', description: 'Crispy deep-fried chicken with bold South Indian spices and curry leaves.',
    price: 380, image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80',
    tags: ['non-veg', 'spicy'], isAvailable: true, isPopular: true, preparationTime: 18, sortOrder: 2,
  },
  {
    id: 'item-3', categoryId: 'cat-1', name: 'Veg Spring Rolls', description: 'Crispy rolls stuffed with seasonal vegetables and glass noodles.',
    price: 240, image: 'https://images.unsplash.com/photo-1607116667981-ff9c89c32823?w=600&q=80',
    tags: ['veg', 'new'], isAvailable: true, isPopular: false, preparationTime: 12, sortOrder: 3,
  },
  {
    id: 'item-4', categoryId: 'cat-1', name: 'Seekh Kebab', description: 'Minced lamb with herbs and spices, skewered and chargrilled.',
    price: 420, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
    tags: ['non-veg', 'chef-special'], isAvailable: true, isPopular: false, preparationTime: 20, sortOrder: 4,
  },
  // Soups
  {
    id: 'item-5', categoryId: 'cat-2', name: 'Tomato Shorba', description: 'Classic Indian tomato soup with fresh herbs and a hint of cream.',
    price: 180, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 10, sortOrder: 1,
  },
  {
    id: 'item-6', categoryId: 'cat-2', name: 'Sweet Corn Chicken Soup', description: 'Thick corn and chicken soup with egg drops. Wholesome and comforting.',
    price: 220, image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&q=80',
    tags: ['non-veg'], isAvailable: true, isPopular: false, preparationTime: 10, sortOrder: 2,
  },
  // Main Course
  {
    id: 'item-7', categoryId: 'cat-3', name: 'Butter Chicken', description: 'Tender chicken in a rich, creamy tomato-based gravy. India\'s most loved curry.',
    price: 440, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    tags: ['non-veg', 'chef-special'], isAvailable: true, isPopular: true, preparationTime: 20, sortOrder: 1,
  },
  {
    id: 'item-8', categoryId: 'cat-3', name: 'Dal Makhani', description: 'Black lentils slow-cooked overnight with butter and cream. A Punjabi staple.',
    price: 320, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    tags: ['veg', 'chef-special'], isAvailable: true, isPopular: true, preparationTime: 15, sortOrder: 2,
  },
  {
    id: 'item-9', categoryId: 'cat-3', name: 'Palak Paneer', description: 'Fresh cottage cheese cubes in a velvety spinach gravy. Healthy and flavorful.',
    price: 360, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 18, sortOrder: 3,
  },
  {
    id: 'item-10', categoryId: 'cat-3', name: 'Rogan Josh', description: 'Slow-cooked lamb in a fragrant Kashmiri spice gravy. Rich and aromatic.',
    price: 520, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
    tags: ['non-veg', 'spicy'], isAvailable: true, isPopular: false, preparationTime: 25, sortOrder: 4,
  },
  {
    id: 'item-11', categoryId: 'cat-3', name: 'Paneer Butter Masala', description: 'Soft paneer in a buttery, mildly spiced tomato gravy. Crowd favorite.',
    price: 380, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    tags: ['veg'], isAvailable: false, isPopular: true, preparationTime: 15, sortOrder: 5,
  },
  // Breads
  {
    id: 'item-12', categoryId: 'cat-4', name: 'Butter Naan', description: 'Soft leavened bread baked in tandoor, brushed with butter.',
    price: 60, image: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: true, preparationTime: 8, sortOrder: 1,
  },
  {
    id: 'item-13', categoryId: 'cat-4', name: 'Garlic Naan', description: 'Naan topped with fresh garlic and coriander. Aromatic and irresistible.',
    price: 80, image: 'https://images.unsplash.com/photo-1626258572756-89ae6bdf3afe?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: true, preparationTime: 8, sortOrder: 2,
  },
  {
    id: 'item-14', categoryId: 'cat-4', name: 'Tandoori Roti', description: 'Whole wheat bread baked directly in tandoor. Light and wholesome.',
    price: 40, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 6, sortOrder: 3,
  },
  // Rice
  {
    id: 'item-15', categoryId: 'cat-5', name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken, dum-cooked to perfection.',
    price: 480, image: 'https://images.unsplash.com/photo-1563379091339-03246963d96b?w=600&q=80',
    tags: ['non-veg', 'chef-special'], isAvailable: true, isPopular: true, preparationTime: 30, sortOrder: 1,
  },
  {
    id: 'item-16', categoryId: 'cat-5', name: 'Veg Biryani', description: 'Seasonal vegetables and basmati rice slow-cooked with whole spices.',
    price: 360, image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 25, sortOrder: 2,
  },
  {
    id: 'item-17', categoryId: 'cat-5', name: 'Jeera Rice', description: 'Long-grain basmati rice tempered with cumin seeds. Simple and fragrant.',
    price: 180, image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 12, sortOrder: 3,
  },
  // Desserts
  {
    id: 'item-18', categoryId: 'cat-6', name: 'Gulab Jamun', description: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup. Served warm.',
    price: 140, image: 'https://images.unsplash.com/photo-1666280271942-f2d7e7eca7eb?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: true, preparationTime: 5, sortOrder: 1,
  },
  {
    id: 'item-19', categoryId: 'cat-6', name: 'Kulfi', description: 'Traditional Indian ice cream with saffron and pistachios. Rich and creamy.',
    price: 160, image: 'https://images.unsplash.com/photo-1591641591038-6aa4e13e8bd3?w=600&q=80',
    tags: ['veg', 'new'], isAvailable: true, isPopular: false, preparationTime: 3, sortOrder: 2,
  },
  {
    id: 'item-20', categoryId: 'cat-6', name: 'Rasgulla', description: 'Spongy cottage cheese balls in light sugar syrup. Bengali classic.',
    price: 120, image: 'https://images.unsplash.com/photo-1564671165093-20688ff1fffa?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: false, preparationTime: 3, sortOrder: 3,
  },
  // Beverages
  {
    id: 'item-21', categoryId: 'cat-7', name: 'Mango Lassi', description: 'Chilled yogurt drink blended with fresh Alphonso mango. Thick and refreshing.',
    price: 160, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: true, preparationTime: 5, sortOrder: 1,
  },
  {
    id: 'item-22', categoryId: 'cat-7', name: 'Masala Chai', description: 'Aromatic tea brewed with ginger, cardamom, and spices. The Indian classic.',
    price: 80, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
    tags: ['veg'], isAvailable: true, isPopular: true, preparationTime: 5, sortOrder: 2,
  },
  {
    id: 'item-23', categoryId: 'cat-7', name: 'Fresh Lime Soda', description: 'Freshly squeezed lime with soda, available sweet, salted, or mixed.',
    price: 100, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
    tags: ['veg', 'vegan'], isAvailable: true, isPopular: false, preparationTime: 3, sortOrder: 3,
  },
];

export const mockTables: Table[] = [
  { id: 'tbl-1', number: 'T01', seats: 2, section: 'Indoor', status: 'available' },
  { id: 'tbl-2', number: 'T02', seats: 4, section: 'Indoor', status: 'occupied' },
  { id: 'tbl-3', number: 'T03', seats: 4, section: 'Indoor', status: 'available' },
  { id: 'tbl-4', number: 'T04', seats: 6, section: 'Indoor', status: 'reserved' },
  { id: 'tbl-5', number: 'T05', seats: 2, section: 'Outdoor', status: 'available' },
  { id: 'tbl-6', number: 'T06', seats: 4, section: 'Outdoor', status: 'occupied' },
  { id: 'tbl-7', number: 'T07', seats: 8, section: 'Private', status: 'cleaning' },
  { id: 'tbl-8', number: 'T08', seats: 4, section: 'Outdoor', status: 'available' },
];

export const mockOrders: Order[] = [
  {
    id: 'ord-1', orderNumber: 'ORD-001', tableId: 'tbl-2', tableNumber: 'T02',
    sessionToken: 'mock-session-1',
    items: [
      { menuItemId: 'item-7', name: 'Butter Chicken', price: 440, quantity: 1 },
      { menuItemId: 'item-12', name: 'Butter Naan', price: 60, quantity: 3 },
      { menuItemId: 'item-21', name: 'Mango Lassi', price: 160, quantity: 2 },
    ],
    status: 'preparing', subtotal: 780, tax: 39, total: 819,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    estimatedTime: 10,
  },
  {
    id: 'ord-2', orderNumber: 'ORD-002', tableId: 'tbl-6', tableNumber: 'T06',
    sessionToken: 'mock-session-2',
    items: [
      { menuItemId: 'item-15', name: 'Chicken Biryani', price: 480, quantity: 2 },
      { menuItemId: 'item-5', name: 'Tomato Shorba', price: 180, quantity: 2 },
    ],
    status: 'ready', subtotal: 1320, tax: 66, total: 1386,
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ord-3', orderNumber: 'ORD-003', tableId: 'tbl-2', tableNumber: 'T02',
    sessionToken: 'mock-session-3',
    items: [
      { menuItemId: 'item-8', name: 'Dal Makhani', price: 320, quantity: 1 },
      { menuItemId: 'item-9', name: 'Palak Paneer', price: 360, quantity: 1 },
      { menuItemId: 'item-13', name: 'Garlic Naan', price: 80, quantity: 4 },
    ],
    status: 'new', subtotal: 1000, tax: 50, total: 1050,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    estimatedTime: 25,
  },
];
