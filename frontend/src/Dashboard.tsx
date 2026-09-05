import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Navigation } from './Navigation';

interface ModuleCard {
  title: string;
  code: string;
  path: string;
  description: string;
  badge: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';

  const getRoleTitle = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'System Administrator Terminal';
      case 'MANAGER':
        return 'Operations Manager Terminal';
      case 'STAFF':
      default:
        return 'Floor Operations Staff Terminal';
    }
  };

  const getRoleDescription = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'Full administrative authority across all warehouse modules, security parameters, and operator directory.';
      case 'MANAGER':
        return 'Management clearance for warehouse catalogs, inventory levels, logistics routing, and operational analytics.';
      case 'STAFF':
      default:
        return 'Floor operational clearance for stock movements, order picking queue, and dispatch processing.';
    }
  };

  // Module cards tailored specifically per role
  const getCardsForRole = (r: string): ModuleCard[] => {
    if (r === 'ADMIN') {
      return [
        {
          title: 'User Management',
          code: 'MOD-USR-01',
          path: '/users',
          description: 'Control operator credentials, access clearance levels, and account statuses.',
          badge: 'ADMIN EXCLUSIVE',
        },
        {
          title: 'Products & Catalog',
          code: 'MOD-PRD-02',
          path: '/products',
          description: 'Manage master item catalogue, barcodes, categories, and dimension specs.',
          badge: 'CATALOGUE',
        },
        {
          title: 'Warehouses & Locations',
          code: 'MOD-WAR-03',
          path: '/warehouses',
          description: 'Configure warehouse facilities, storage aisles, racks, and bin locations.',
          badge: 'FACILITIES',
        },
        {
          title: 'Inventory Control',
          code: 'MOD-INV-04',
          path: '/inventory',
          description: 'Audit current stock levels, thresholds, reservations, and valuations.',
          badge: 'CORE STOCK',
        },
        {
          title: 'Stock Movements',
          code: 'MOD-MOV-05',
          path: '/movements',
          description: 'Track internal relocations, inbound receipts, and replenishment transfers.',
          badge: 'LOGISTICS',
        },
        {
          title: 'Orders & Dispatch',
          code: 'MOD-ORD-06',
          path: '/orders',
          description: 'Supervise fulfillment pipelines, packing workflows, and carrier manifests.',
          badge: 'FULFILLMENT',
        },
        {
          title: 'Reports & Analytics',
          code: 'MOD-REP-07',
          path: '/reports',
          description: 'Generate turnover rates, throughput metrics, and audit logs.',
          badge: 'EXECUTIVE',
        },
      ];
    }

    if (r === 'MANAGER') {
      return [
        {
          title: 'Products & Catalog',
          code: 'MOD-PRD-02',
          path: '/products',
          description: 'Manage master item catalogue, barcodes, categories, and dimension specs.',
          badge: 'CATALOGUE',
        },
        {
          title: 'Warehouses & Locations',
          code: 'MOD-WAR-03',
          path: '/warehouses',
          description: 'Configure warehouse facilities, storage aisles, racks, and bin locations.',
          badge: 'FACILITIES',
        },
        {
          title: 'Inventory Control',
          code: 'MOD-INV-04',
          path: '/inventory',
          description: 'Audit current stock levels, thresholds, reservations, and valuations.',
          badge: 'CORE STOCK',
        },
        {
          title: 'Stock Movements',
          code: 'MOD-MOV-05',
          path: '/movements',
          description: 'Track internal relocations, inbound receipts, and replenishment transfers.',
          badge: 'LOGISTICS',
        },
        {
          title: 'Orders & Dispatch',
          code: 'MOD-ORD-06',
          path: '/orders',
          description: 'Supervise fulfillment pipelines, packing workflows, and carrier manifests.',
          badge: 'FULFILLMENT',
        },
        {
          title: 'Reports & Analytics',
          code: 'MOD-REP-07',
          path: '/reports',
          description: 'Generate turnover rates, throughput metrics, and audit logs.',
          badge: 'ANALYTICS',
        },
      ];
    }

    // STAFF
    return [
      {
        title: 'Assigned Inventory',
        code: 'MOD-INV-04',
        path: '/inventory',
        description: 'View current available stock across designated floor picking bins.',
        badge: 'FLOOR STOCK',
      },
      {
        title: 'Stock Movements',
        code: 'MOD-MOV-05',
        path: '/movements',
        description: 'Execute bin-to-bin transfers, replenishments, and incoming putaways.',
        badge: 'TRANSFERS',
      },
      {
        title: 'Picking Operations',
        code: 'MOD-PCK-08',
        path: '/picking',
        description: 'Process picking slips, barcode scanning, and order tote batching.',
        badge: 'PICK QUEUE',
      },
      {
        title: 'Dispatch Operations',
        code: 'MOD-DSP-09',
        path: '/dispatch',
        description: 'Update shipment status, stage outbound pallets, and label parcels.',
        badge: 'DISPATCH',
      },
    ];
  };

  const cards = getCardsForRole(role);

  return (
    <div className="min-h-screen bg-[#f4eedb] font-sans selection:bg-amber-300 selection:text-black">
      <Navigation />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1c1917]">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b-2 border-dashed border-stone-300 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-stone-900 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                  {role} DASHBOARD
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  STATION ONLINE // JWT VALIDATED
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase mt-1">
                Welcome, {user?.name || 'Operator'}
              </h1>
              <p className="font-mono text-xs text-stone-600 uppercase mt-0.5">
                {getRoleTitle(role)} • {getRoleDescription(role)}
              </p>
            </div>

            <div className="bg-amber-100 border-2 border-stone-900 p-2.5 rounded shadow-[2px_2px_0px_0px_#1c1917] font-mono text-xs">
              <span className="text-stone-500 text-[10px] uppercase block">Security Clearance</span>
              <span className="font-black text-stone-950 uppercase tracking-wide">
                {role} ROLE GRANTED
              </span>
            </div>
          </div>

          {/* Operator Details Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="p-3 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">
                [OPERATOR ID]
              </span>
              <p className="font-mono text-base font-black text-stone-900">#{user?.id}</p>
            </div>
            <div className="p-3 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">
                [AUTHENTICATED EMAIL]
              </span>
              <p className="font-mono text-xs font-bold text-stone-900 truncate">{user?.email}</p>
            </div>
            <div className="p-3 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">
                [SESSION CLEARANCE]
              </span>
              <p className="font-mono text-xs font-black text-stone-900">
                ROLE_{role} (PHASE 2 ACTIVE)
              </p>
            </div>
          </div>

          {/* Role Authorized Modules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-stone-900 uppercase tracking-tight">
                Authorized Operational Modules ({role})
              </h2>
              <span className="font-mono text-[11px] text-stone-500 uppercase">
                {cards.length} MODULES ACCESSIBLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <Link
                  key={card.path}
                  to={card.path}
                  className="group p-5 bg-[#fdfbf7] border-3 border-stone-900 rounded-lg shadow-[4px_4px_0px_0px_#1c1917] hover:bg-amber-50 hover:shadow-[6px_6px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
                        {card.code}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-stone-600 uppercase border border-stone-400 px-1.5 py-0.5 rounded">
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-stone-900 uppercase group-hover:text-amber-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="font-mono text-xs text-stone-600 mt-1">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-stone-300 flex items-center justify-between font-mono text-xs font-bold text-stone-800">
                    <span>ENTER MODULE</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-300 flex items-center justify-between text-stone-500 font-mono text-xs flex-wrap gap-2">
            <span>// ACCESS CONTROL: ROLE-BASED ACCESS CONTROL (RBAC) ACTIVE</span>
            <span>CLEARANCE VERIFIED: {role}</span>
          </div>

        </div>
      </main>
    </div>
  );
};
