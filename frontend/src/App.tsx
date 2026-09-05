import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { AccessDenied } from './AccessDenied';
import { PlaceholderModule } from './PlaceholderModule';

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
          <div className="w-10 h-10 border-4 border-stone-900 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="mt-4 font-mono text-xs font-bold text-stone-700 uppercase tracking-widest">
            AUTHENTICATING CLEARANCE TOKEN...
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
        <div className="w-10 h-10 border-4 border-stone-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Role Aware Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <Dashboard />
              </RoleRoute>
            }
          />

          {/* Admin Exclusive: User Management */}
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <PlaceholderModule
                  moduleKey="users"
                  title="User Management"
                  stationCode="MOD-USR-01"
                  description="Administration of system operators, clearance roles, and credentials"
                  plannedFeatures={[
                    'Role Permissions Mapping',
                    'Session Token Revocation',
                    'Audit Trail Security Logs',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Admin & Manager: Products */}
          <Route
            path="/products"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <PlaceholderModule
                  moduleKey="products"
                  title="Products & Catalog"
                  stationCode="MOD-PRD-02"
                  description="Product master records, barcodes, categories, and dimension specs"
                  plannedFeatures={[
                    'Product SKU Directory & Specs',
                    'Barcode Generation & Scanning',
                    'Category Taxonomy & Unit Hierarchy',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Admin & Manager: Warehouses & Locations */}
          <Route
            path="/warehouses"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <PlaceholderModule
                  moduleKey="warehouses"
                  title="Warehouses & Locations"
                  stationCode="MOD-WAR-03"
                  description="Facility blueprints, aisles, racks, shelves, and storage bin registry"
                  plannedFeatures={[
                    'Multi-Warehouse Facility Registry',
                    'Bin Dimension & Weight Capacities',
                    'Zone Temperature & Hazard Flags',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* All Roles: Inventory */}
          <Route
            path="/inventory"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <PlaceholderModule
                  moduleKey="inventory"
                  title="Inventory Management"
                  stationCode="MOD-INV-04"
                  description="Stock balance visibility, reservations, safety margins, and batch tracking"
                  plannedFeatures={[
                    'Real-Time SKU Stock Balances',
                    'Reorder Point & Low Stock Alerts',
                    'Batch & Expiry Date Ledger',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* All Roles: Stock Movements */}
          <Route
            path="/movements"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
                <PlaceholderModule
                  moduleKey="movements"
                  title="Stock Movements"
                  stationCode="MOD-MOV-05"
                  description="Relocations between warehouse bins, replenishment triggers, and internal adjustments"
                  plannedFeatures={[
                    'Bin-to-Bin Relocation Requests',
                    'Putaway Workflow Directives',
                    'Internal Transfer Audit Trail',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Admin & Manager: Orders & Dispatch */}
          <Route
            path="/orders"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <PlaceholderModule
                  moduleKey="orders"
                  title="Orders & Dispatch"
                  stationCode="MOD-ORD-06"
                  description="Customer order queues, fulfillment routing, carrier shipping, and manifest tracking"
                  plannedFeatures={[
                    'Order Fulfillment Pipeline',
                    'Carrier Integration & Shipping Labels',
                    'Outbound Dispatch Manifest Tracking',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Admin & Manager: Reports & Analytics */}
          <Route
            path="/reports"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <PlaceholderModule
                  moduleKey="reports"
                  title="Reports & Analytics"
                  stationCode="MOD-REP-07"
                  description="Inventory turnover analytics, fulfillment velocity, and operational compliance reports"
                  plannedFeatures={[
                    'Inventory Valuation Ledger',
                    'Order Turnaround Velocity Metrics',
                    'Shrinkage & Stock Variance Analytics',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Staff Exclusive: Picking Operations */}
          <Route
            path="/picking"
            element={
              <RoleRoute allowedRoles={['STAFF']}>
                <PlaceholderModule
                  moduleKey="picking"
                  title="Picking Operations"
                  stationCode="MOD-PCK-08"
                  description="Wave picking queue, tote scanning, bin navigation, and pick verification"
                  plannedFeatures={[
                    'Wave & Batch Pick Directives',
                    'Barcode Verification Scanning',
                    'Tote Allocation & Consolidation',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Staff Exclusive: Dispatch Operations */}
          <Route
            path="/dispatch"
            element={
              <RoleRoute allowedRoles={['STAFF']}>
                <PlaceholderModule
                  moduleKey="dispatch"
                  title="Dispatch Operations"
                  stationCode="MOD-DSP-09"
                  description="Staging area tracking, pallet loading verification, and outbound status updates"
                  plannedFeatures={[
                    'Outbound Bay Staging Checklist',
                    'Pallet Labeling & Inspection',
                    'Carrier Pickup Confirmation Logging',
                  ]}
                />
              </RoleRoute>
            }
          />

          {/* Fallback Routing */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
