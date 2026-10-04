import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { AccessDenied } from './AccessDenied';
import { PlaceholderModule } from './PlaceholderModule';
import { Products } from './Products';
import { Warehouses } from './Warehouses';
import { Inventory } from './Inventory';
import { StockMovements } from './StockMovements';
import { DamagedStock } from './DamagedStock';
import { Orders } from './Orders';
import { Dispatch } from './Dispatch';
import { Reports } from './Reports';

// ─── Route Guards ──────────────────────────────────────────────────────────────

interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactElement;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4eedb]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-amber-500 rounded-full animate-spin" />
          <p className="mt-4 font-mono text-xs font-bold text-stone-700 uppercase tracking-widest">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRoles={allowedRoles} />;
  }

  return children;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4eedb]">
        <div className="w-10 h-10 border-4 border-stone-900 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// ─── App ───────────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Authenticated — all wrapped in Layout (sidebar + header) */}
          <Route
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <Layout />
              </RoleRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* ADMIN only */}
            <Route
              path="/users"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <PlaceholderModule
                    moduleKey="users"
                    title="User Management"
                    stationCode="MOD-USR-01"
                    description="Administration of system operators, clearance roles, and credentials"
                    plannedFeatures={['Role Permissions Mapping', 'Session Token Revocation', 'Audit Trail Logs']}
                  />
                </RoleRoute>
              }
            />

            {/* Products — Full CRUD for ADMIN & MANAGER, View-Only for STAFF */}
            <Route
              path="/products"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Products />
                </RoleRoute>
              }
            />
            {/* Warehouses — Full CRUD for ADMIN & MANAGER, View-Only for STAFF */}
            <Route
              path="/warehouses"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Warehouses />
                </RoleRoute>
              }
            />
            {/* Damaged Stock — Isolation & Reporting */}
            <Route
              path="/damaged"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <DamagedStock />
                </RoleRoute>
              }
            />

            {/* Reports & Analytics — Operational Ledger & Loss Audits */}
            <Route
              path="/reports"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <Reports />
                </RoleRoute>
              }
            />

            {/* Inventory Management — Stock Balances & Bin Allocations */}
            <Route
              path="/inventory"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Inventory />
                </RoleRoute>
              }
            />

            {/* Stock Movement — Transfers & Relocations */}
            <Route
              path="/movements"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <StockMovements />
                </RoleRoute>
              }
            />

            {/* Orders — Fulfillment Workflow */}
            <Route
              path="/orders"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Orders />
                </RoleRoute>
              }
            />

            {/* Dispatch — Outbound Bay Staging */}
            <Route
              path="/dispatch"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <Dispatch />
                </RoleRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
