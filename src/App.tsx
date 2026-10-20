import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Toaster } from './components/ui/Toaster';
import { ProtectedRoute } from './components/ProtectedRoute';

// 3D Staff Hub
import StaffHub from './portals/hub/StaffHub';

// Digital Showcase (view-only)
import MenuPage from './portals/customer/MenuPage';

// 3 Core Stations: Waiter, Cooker, Admin
import WaiterDashboard from './portals/waiter/WaiterDashboard';
import KitchenDashboard from './portals/kitchen/KitchenDashboard';
import AdminDashboard from './portals/admin/AdminDashboard';
import StaffLoginPage from './portals/auth/StaffLoginPage';

/**
 * Root Authentication Gate:
 * Requires username & password upon entry before granting access to stations.
 */
function RootGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-white font-mono text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping mr-3" />
        Authenticating Secure Station Terminal...
      </div>
    );
  }

  if (!user) {
    return <StaffLoginPage />;
  }

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/waiter" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Entry Gate: Demands username & password immediately on entry ─ */}
      <Route path="/" element={<RootGate />} />
      <Route path="/login" element={<StaffLoginPage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />

      {/* ── 3D Operations Command Hub for Authorized Staff ──────────── */}
      <Route
        path="/hub"
        element={
          <ProtectedRoute allowedRoles={['admin', 'waiter', 'kitchen']}>
            <StaffHub />
          </ProtectedRoute>
        }
      />

      {/* ── Digital Menu Showcase (View-only for diners) ──────────── */}
      <Route path="/menu" element={<MenuPage />} />

      {/* ── 1. Waiter Floor Station ──────────────────────────────── */}
      <Route
        path="/waiter"
        element={
          <ProtectedRoute allowedRoles={['waiter', 'admin']}>
            <WaiterDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── 2. Cooker & Kitchen Station (KDS) ────────────────────── */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
            <KitchenDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── 3. Executive Admin Station ───────────────────────────── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ─────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppRoutes />
            <Toaster />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
