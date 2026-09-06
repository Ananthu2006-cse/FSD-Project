import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

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
      case 'ADMIN': return 'System Administrator';
      case 'MANAGER': return 'Operations Manager';
      default: return 'Floor Staff';
    }
  };

  const getRoleDescription = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'Full administrative authority across all warehouse modules, security parameters, and operator directory.';
      case 'MANAGER':
        return 'Management clearance for warehouse catalogs, inventory levels, logistics routing, and operational analytics.';
      default:
        return 'Floor operational clearance for inventory, stock movements, orders, and dispatch processing.';
    }
  };

  const getCardsForRole = (r: string): ModuleCard[] => {
    if (r === 'ADMIN') {
      return [
        { title: 'Products', code: 'MOD-PRD-02', path: '/products', description: 'Manage master item catalogue, barcodes, categories, and specs.', badge: 'CATALOGUE' },
        { title: 'Warehouses', code: 'MOD-WAR-03', path: '/warehouses', description: 'Configure warehouse facilities, storage aisles, racks, and bin locations.', badge: 'FACILITIES' },
        { title: 'Inventory', code: 'MOD-INV-04', path: '/inventory', description: 'Audit current stock levels, thresholds, reservations, and valuations.', badge: 'CORE STOCK' },
        { title: 'Stock Movement', code: 'MOD-MOV-05', path: '/movements', description: 'Track internal relocations, inbound receipts, and replenishment transfers.', badge: 'LOGISTICS' },
        { title: 'Orders', code: 'MOD-ORD-06', path: '/orders', description: 'Supervise fulfillment pipelines, packing workflows, and order queues.', badge: 'ORDERS' },
        { title: 'Dispatch', code: 'MOD-DSP-07', path: '/dispatch', description: 'Manage outbound shipments, staging, carrier manifests, and bay operations.', badge: 'DISPATCH' },
        { title: 'Damaged Stock', code: 'MOD-DAM-08', path: '/damaged', description: 'Record and review damaged or defective items for write-off or return.', badge: 'QUALITY' },
        { title: 'Reports', code: 'MOD-REP-09', path: '/reports', description: 'Generate turnover rates, throughput metrics, and audit logs.', badge: 'ANALYTICS' },
        { title: 'User Management', code: 'MOD-USR-01', path: '/users', description: 'Control operator credentials, access clearance levels, and account statuses.', badge: 'ADMIN ONLY' },
      ];
    }

    if (r === 'MANAGER') {
      return [
        { title: 'Products', code: 'MOD-PRD-02', path: '/products', description: 'Manage master item catalogue, barcodes, categories, and specs.', badge: 'CATALOGUE' },
        { title: 'Warehouses', code: 'MOD-WAR-03', path: '/warehouses', description: 'Configure warehouse facilities, storage aisles, racks, and bin locations.', badge: 'FACILITIES' },
        { title: 'Inventory', code: 'MOD-INV-04', path: '/inventory', description: 'Audit current stock levels, thresholds, reservations, and valuations.', badge: 'CORE STOCK' },
        { title: 'Stock Movement', code: 'MOD-MOV-05', path: '/movements', description: 'Track internal relocations, inbound receipts, and replenishment transfers.', badge: 'LOGISTICS' },
        { title: 'Orders', code: 'MOD-ORD-06', path: '/orders', description: 'Supervise fulfillment pipelines, packing workflows, and order queues.', badge: 'ORDERS' },
        { title: 'Dispatch', code: 'MOD-DSP-07', path: '/dispatch', description: 'Manage outbound shipments, staging, carrier manifests, and bay operations.', badge: 'DISPATCH' },
        { title: 'Damaged Stock', code: 'MOD-DAM-08', path: '/damaged', description: 'Record and review damaged or defective items for write-off or return.', badge: 'QUALITY' },
        { title: 'Reports', code: 'MOD-REP-09', path: '/reports', description: 'Generate turnover rates, throughput metrics, and audit logs.', badge: 'ANALYTICS' },
      ];
    }

    // STAFF
    return [
      { title: 'Inventory', code: 'MOD-INV-04', path: '/inventory', description: 'View current available stock across designated floor picking bins.', badge: 'FLOOR STOCK' },
      { title: 'Stock Movement', code: 'MOD-MOV-05', path: '/movements', description: 'Execute bin-to-bin transfers, replenishments, and incoming putaways.', badge: 'TRANSFERS' },
      { title: 'Orders', code: 'MOD-ORD-06', path: '/orders', description: 'View and process assigned order tasks from the fulfillment queue.', badge: 'ORDERS' },
      { title: 'Dispatch', code: 'MOD-DSP-07', path: '/dispatch', description: 'Update shipment status, stage outbound pallets, and label parcels.', badge: 'DISPATCH' },
    ];
  };

  const cards = getCardsForRole(role);

  return (
    <div className="selection:bg-amber-300 selection:text-black">
      {/* Welcome Banner */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917] mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-stone-900 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                {role} Dashboard
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                JWT Validated
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
              Welcome, {user?.name || 'Operator'}
            </h1>
            <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
              {getRoleTitle(role)} &mdash; {getRoleDescription(role)}
            </p>
          </div>
          <div className="bg-amber-100 border-2 border-stone-900 p-3 rounded shadow-[2px_2px_0px_0px_#1c1917] font-mono text-xs text-right">
            <span className="text-stone-500 text-[10px] uppercase block">Clearance Level</span>
            <span className="font-black text-stone-950 uppercase">{role} Role</span>
          </div>
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t-2 border-dashed border-stone-300">
          <div className="p-2.5 bg-stone-50 border border-stone-300 rounded">
            <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">Operator ID</span>
            <p className="font-mono text-sm font-black text-stone-900">#{user?.id}</p>
          </div>
          <div className="p-2.5 bg-stone-50 border border-stone-300 rounded">
            <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">Email</span>
            <p className="font-mono text-xs font-bold text-stone-900 truncate">{user?.email}</p>
          </div>
          <div className="p-2.5 bg-stone-50 border border-stone-300 rounded">
            <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">Session Role</span>
            <p className="font-mono text-xs font-black text-stone-900 uppercase">ROLE_{role}</p>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-stone-900 uppercase tracking-tight">
            Accessible Modules
          </h2>
          <span className="font-mono text-[11px] text-stone-500 uppercase">
            {cards.length} modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group p-5 bg-[#fffdf7] border-2 border-stone-900 rounded-lg shadow-[4px_4px_0px_0px_#1c1917] hover:bg-amber-50 hover:shadow-[6px_6px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col justify-between"
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
                <p className="font-mono text-xs text-stone-600 mt-1">{card.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-stone-300 flex items-center justify-between font-mono text-xs font-bold text-stone-800">
                <span>Open Module</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
