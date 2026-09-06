import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { AccessDenied } from './AccessDenied';
import { PlaceholderModule } from './PlaceholderModule';

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

            {/* ADMIN + MANAGER */}
            <Route
              path="/products"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PlaceholderModule
                    moduleKey="products"
                    title="Products"
                    stationCode="MOD-PRD-02"
                    description="Product master records, categories, and dimension specs"
                    plannedFeatures={['Product SKU Directory', 'Category Taxonomy', 'Unit Hierarchy']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/warehouses"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PlaceholderModule
                    moduleKey="warehouses"
                    title="Warehouses"
                    stationCode="MOD-WAR-03"
                    description="Facility blueprints, aisles, racks, shelves, and storage bin registry"
                    plannedFeatures={['Multi-Warehouse Registry', 'Bin Capacities', 'Zone & Hazard Flags']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/damaged"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PlaceholderModule
                    moduleKey="damaged"
                    title="Damaged Stock"
                    stationCode="MOD-DAM-08"
                    description="Record and review damaged or defective items for write-off or return"
                    plannedFeatures={['Damage Report Logging', 'Write-Off Approvals', 'Supplier Return Tracking']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <PlaceholderModule
                    moduleKey="reports"
                    title="Reports & Analytics"
                    stationCode="MOD-REP-09"
                    description="Inventory turnover analytics, fulfillment velocity, and operational reports"
                    plannedFeatures={['Inventory Valuation', 'Order Velocity Metrics', 'Stock Variance Analytics']}
                  />
                </RoleRoute>
              }
            />

            {/* All roles */}
            <Route
              path="/inventory"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PlaceholderModule
                    moduleKey="inventory"
                    title="Inventory"
                    stationCode="MOD-INV-04"
                    description="Stock balance visibility, reservations, safety margins, and batch tracking"
                    plannedFeatures={['Real-Time Stock Balances', 'Reorder Point & Alerts', 'Batch & Expiry Ledger']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/movements"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PlaceholderModule
                    moduleKey="movements"
                    title="Stock Movement"
                    stationCode="MOD-MOV-05"
                    description="Relocations between warehouse bins, replenishment triggers, and adjustments"
                    plannedFeatures={['Bin-to-Bin Relocations', 'Putaway Workflows', 'Transfer Audit Trail']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PlaceholderModule
                    moduleKey="orders"
                    title="Orders"
                    stationCode="MOD-ORD-06"
                    description="Customer order queues, fulfillment routing, and manifest tracking"
                    plannedFeatures={['Order Fulfillment Pipeline', 'Carrier Integration', 'Order Status Tracking']}
                  />
                </RoleRoute>
              }
            />
            <Route
              path="/dispatch"
              element={
                <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                  <PlaceholderModule
                    moduleKey="dispatch"
                    title="Dispatch"
                    stationCode="MOD-DSP-07"
                    description="Staging area tracking, pallet loading verification, and outbound status updates"
                    plannedFeatures={['Outbound Bay Staging', 'Pallet Labeling & Inspection', 'Carrier Pickup Logging']}
                  />
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
