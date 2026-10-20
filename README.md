# 🍛 Spice Garden — Restaurant Ordering & Management System

A complete, production-ready, mobile-first restaurant ordering and management web application built with **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Firebase (Authentication, Cloud Firestore, Security Rules, Hosting)**.

Designed for real-world table QR scanning, instant contactless ordering, live kitchen ticket display, floor waiter management, and administrative control.

---

## 🌟 Key Architectural Features

### 1. Four Separate Portals in One System
- **Customer Portal (`/`, `/menu`, `/cart`, `/order-status/:orderNumber`)**:
  - Scan table QR code to automatically bind to table (`?table=tbl-1&num=T01`)
  - No customer account registration required (session-scoped ordering via secure tokens)
  - Search dishes with instant debounced lookup
  - Dietary tag filters (🟢 Pure Veg, 🔴 Non-Veg, 🌱 Vegan, 🌶️ Spicy, 👨‍🍳 Chef's Special)
  - Dish detail modal with allergen warnings, spice level, and custom instructions
  - In-cart quantity steppers and table-level special notes for the kitchen
  - **Live Order Status Tracker** with real-time stage updates (`Received` → `Confirmed` → `Cooking` → `Ready` → `Served`)
  - **Table Service / Call Waiter** action with instant alerts (Water Refill, Call Server, Request Bill, Clean Table)
  - Store info drawer with guest Wi-Fi copy, contact number, opening hours, and address

- **Kitchen Display System (KDS) (`/kitchen`)**:
  - High-contrast, dark-mode display optimized for kitchen tablets and wall monitors
  - Live real-time incoming tickets with Web Audio API chime notifications
  - Item checklist: chefs can tap items to strike them through as prepared
  - **Urgency elapsed timers**:
    - 🟢 Green: `< 10m`
    - 🟡 Amber: `10m – 20m`
    - 🔴 Red Pulse: `> 20m` (Urgent Attention)
  - One-tap status progression: `Start Cooking` → `Bump / Mark Ready`
  - Audio mute/unmute toggle and HTML5 Fullscreen button

- **Waiter / Service Portal (`/waiter`)**:
  - Interactive Table Map displaying live table statuses (`available`, `occupied`, `billing`, `cleaning`, `reserved`)
  - Running balance and active order counts per table
  - **Real-time Table Call Banner**: instantly alerts when customers tap "Water Refill" or "Call Server"
  - **Punch Order at Table**: servers can take manual orders on behalf of walk-in guests
  - **Ready-to-Serve Priority Feed**: quick action to deliver and mark served
  - **Bill Settlement Modal**: calculate final bill, apply manager discounts, record payment method (Cash, UPI, Card), and release tables for cleaning

- **Admin / Manager Portal (`/admin`)**:
  - **Analytics Dashboard**: today's revenue, active orders, occupancy rate, top items
  - **Live Order Ledger**: inspect all tickets with real-time status selector
  - **Menu Catalog CRUD**: add/edit/delete dishes, update prices, change prep times, and toggle 86 / Sold Out instantly
  - **Table & QR Code Generator**: customize tables, generate high-resolution QR codes, and print official Table QR Cards
  - **Invoices & Billing History**: log of all settled bills with payment methods
  - **Staff User Management**: administer accounts and roles (`admin`, `kitchen`, `waiter`)
  - **Restaurant Settings**: update restaurant name, tagline, GST tax rate, service charge, Wi-Fi password, and promotional announcement banners

---

## 🔒 Security & Server-Side Price Calculation

> [!IMPORTANT]
> **Client-submitted prices and totals are NEVER trusted.**

1. **Authoritative Price Recalculation**:
   - When an order is submitted from the customer cart, `dataService.createOrder` takes only the `menuItemId` and `quantity`.
   - It fetches the canonical, authoritative price from the menu registry, calculates line totals, verifies item availability (rejecting 86'd items), recomputes the tax from the verified `taxRate`, and produces the genuine subtotal and total.
2. **Granular Firebase Security Rules (`firestore.rules`)**:
   - Public read on `/settings/restaurant` and `/menu_items` for browsing.
   - Customers can create orders only if the initial status is `'new'`, items list is non-empty, and totals are valid numbers.
   - Only verified staff can mutate order status or access internal kitchen feeds.
   - Only administrators can create or delete menu items, modify tax rates, or manage staff records.
3. **No Secret Leaks**:
   - Firebase Admin SDK private keys are never exposed in frontend code.
   - Only client-safe Web SDK configurations are used via `import.meta.env`.

---

## 💰 Firebase Plan Architecture: Spark (Free) vs. Blaze (Paid)

| Feature | Firebase Spark (Free Plan) | Firebase Blaze (Pay-as-you-go) |
|---|---|---|
| **Firebase Authentication** | ✅ Supported (Email/Password, Anonymous) | ✅ Supported |
| **Cloud Firestore** | ✅ Supported (1 GiB storage, 50k reads/day, 20k writes/day) | ✅ Supported |
| **Firebase Hosting** | ✅ Supported (10 GB storage, 360 MB/day transfer) | ✅ Supported |
| **Security Rules** | ✅ Supported (RBAC & schema validation) | ✅ Supported |
| **App Check** | ✅ Supported (reCAPTCHA v3 / Play Integrity) | ✅ Supported |
| **Cloud Functions (Node.js backend)** | ❌ **Requires Blaze Plan** (Outbound networking requires billing) | ✅ Supported |

### How This App Optimizes for the Free Spark Plan:
- This application is architected so that **Cloud Functions are NOT required for core operations**.
- The frontend enforces canonical menu pricing against Firestore document records directly through secure, constrained transactions and Firestore Security Rules.
- If you upgrade to the Blaze plan in the future, you can easily offload order creation to a Cloud Function using the exact same interface in `dataService.ts`.

---

## 🚀 Quick Start & Development

### 1. Installation
```bash
git clone <repo-url>
cd restaurant-app
npm install
```

### 2. Run Locally in Demo Mode (No Firebase Account Required)
The app includes a built-in reactive multi-tab event bus (`BroadcastChannel` + `localStorage`). You can test the entire restaurant flow immediately out of the box:
```bash
npm run dev
```

Open multiple browser windows or tabs side by side:
- **Tab 1 (Customer)**: `http://localhost:5173/?table=tbl-2&num=T02`
- **Tab 2 (Kitchen)**: `http://localhost:5173/kitchen`
- **Tab 3 (Waiter)**: `http://localhost:5173/waiter`
- **Tab 4 (Admin)**: `http://localhost:5173/admin`

> Place an order in Tab 1, and watch it chime and pop up in Tab 2 and Tab 3 in real-time!

### 3. Demo Staff Credentials
When accessing `/staff/login`, use any of the pre-configured accounts:
- **Admin**: `admin@spicegarden.in` (password: `password123`)
- **Kitchen**: `kitchen@spicegarden.in` (password: `password123`)
- **Waiter**: `waiter@spicegarden.in` (password: `password123`)

---

## 🌐 Connecting Real Firebase in Production

1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password provider).
3. Create a **Cloud Firestore** database (Production mode).
4. Register a Web App in Project Settings and copy the configuration keys into a `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
5. Deploy Security Rules and Indexes using the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,firestore:indexes
   ```
6. Build and Deploy Hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📱 Mobile-First Responsive Breakpoints Tested
- **Mobile Phones (360px – 390px)**: Bottom cart navigation bar, touch-friendly increment steppers, swipeable category tags, safe area padding.
- **Tablets (768px)**: Dual-column menu layout, 2-column kitchen ticket display, split waiter table views.
- **Desktops (1440px)**: Expanded admin sidebar, 4-column KDS monitor, printable QR card grid.
