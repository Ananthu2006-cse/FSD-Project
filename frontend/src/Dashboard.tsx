import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  DashboardSummary,
  CategoryBreakdownItem,
  StatusBreakdown,
  StockMovementItem,
  fetchDashboardStats,
  fetchIntelligence,
  IntelligenceResponse,
} from './api';
import { SkeletonCard } from './components/UIComponents';

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
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null);
  const [recentMovements, setRecentMovements] = useState<StockMovementItem[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboardStats(),
      (role === 'ADMIN' || role === 'MANAGER') ? fetchIntelligence().catch(() => null) : Promise.resolve(null),
    ])
      .then(([statsRes, intelRes]) => {
        setStats(statsRes.summary);
        setCategoryBreakdown(statsRes.categoryBreakdown || []);
        setStatusBreakdown(statsRes.statusBreakdown || null);
        setRecentMovements((statsRes.recentMovements as StockMovementItem[]) || []);
        if (intelRes) setIntelligence(intelRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

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
        { title: 'Intelligence', code: 'MOD-INT-11', path: '/intelligence', description: 'Smart stock predictions, restock suggestions, and demand velocity analytics.', badge: 'AI INSIGHTS' },
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
        { title: 'Intelligence', code: 'MOD-INT-11', path: '/intelligence', description: 'Smart stock predictions, restock suggestions, and demand velocity analytics.', badge: 'AI INSIGHTS' },
      ];
    }

    // STAFF
    return [
      { title: 'Products', code: 'MOD-PRD-02', path: '/products', description: 'View master item catalogue, item specifications, and unit balances.', badge: 'CATALOGUE' },
      { title: 'Warehouses', code: 'MOD-WAR-03', path: '/warehouses', description: 'View warehouse facilities, storage aisles, racks, and bin locations.', badge: 'FACILITIES' },
      { title: 'Inventory', code: 'MOD-INV-04', path: '/inventory', description: 'View current available stock across designated floor picking bins.', badge: 'FLOOR STOCK' },
      { title: 'Stock Movement', code: 'MOD-MOV-05', path: '/movements', description: 'Execute bin-to-bin transfers, replenishments, and incoming putaways.', badge: 'TRANSFERS' },
      { title: 'Orders', code: 'MOD-ORD-06', path: '/orders', description: 'View and process assigned order tasks from the fulfillment queue.', badge: 'ORDERS' },
      { title: 'Dispatch', code: 'MOD-DSP-07', path: '/dispatch', description: 'Update shipment status, stage outbound pallets, and label parcels.', badge: 'DISPATCH' },
    ];
  };

  const cards = getCardsForRole(role);

  return (
    <div className="selection:bg-amber-300 selection:text-black space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-stone-900 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                {role} Dashboard
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Active Session
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
            <span className="text-stone-500 text-[10px] uppercase block">Clearance</span>
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
            <span className="font-mono text-[10px] font-bold text-stone-500 uppercase block">Session Clearance</span>
            <p className="font-mono text-xs font-black text-stone-900 uppercase">ROLE_{role}</p>
          </div>
        </div>
      </div>

      {/* ── 1. Core Stock Metrics Strip (Prompt 1) ─────────────────────────── */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : stats ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
              <span>Core Stock Ledger</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <span className="font-mono text-[11px] text-stone-500 uppercase">Real-Time MongoDB Sync</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
            {/* 1. Total Products */}
            <div className="bg-[#fffdf7] border-2 border-stone-900 p-3.5 rounded shadow-[3px_3px_0px_0px_#1c1917] hover:bg-stone-50 transition-colors">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Products</span>
              <span className="text-2xl font-black text-stone-900">{stats.totalProducts}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">master catalog items</span>
            </div>

            {/* 2. Total Stock Units */}
            <div className="bg-[#fffdf7] border-2 border-emerald-600 p-3.5 rounded shadow-[3px_3px_0px_0px_#059669] hover:bg-emerald-50/50 transition-colors">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Total Stock Units</span>
              <span className="text-2xl font-black text-emerald-800">{stats.totalStockUnits.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">valuation: ${stats.totalStockValuation.toLocaleString()}</span>
            </div>

            {/* 3. Low-Stock Products */}
            <div className="bg-[#fffdf7] border-2 border-amber-500 p-3.5 rounded shadow-[3px_3px_0px_0px_#f59e0b] hover:bg-amber-50/50 transition-colors">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Low-Stock Items</span>
              <span className="text-2xl font-black text-amber-700">{stats.lowStockCount}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">&le; minimum safety buffer</span>
            </div>

            {/* 4. Out-of-Stock Products */}
            <div className="bg-[#fffdf7] border-2 border-red-500 p-3.5 rounded shadow-[3px_3px_0px_0px_#ef4444] hover:bg-red-50/50 transition-colors">
              <span className="text-[10px] text-red-700 uppercase font-bold block">Out-of-Stock</span>
              <span className="text-2xl font-black text-red-700">{stats.outOfStockCount}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">zero inventory available</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 2. Inventory Summary Charts (Prompt 1) ─────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
          {/* Stock Health Distribution Bar */}
          <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-4 shadow-[4px_4px_0px_0px_#1c1917] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-stone-900 uppercase">Stock Status Distribution</h3>
                <span className="text-[10px] text-stone-500 uppercase">
                  {statusBreakdown?.totalRecords || (stats.lowStockCount + stats.outOfStockCount + (stats.inStockCount || 0))} bins
                </span>
              </div>
              <p className="text-[10px] text-stone-500 uppercase mb-3">
                Health breakdown across all warehouse bins
              </p>

              {/* Stacked Progress Bar */}
              {(() => {
                const total = (statusBreakdown?.totalRecords || 1);
                const inStock = statusBreakdown?.inStock || Math.max(0, total - stats.lowStockCount - stats.outOfStockCount);
                const low = stats.lowStockCount;
                const out = stats.outOfStockCount;

                const inPct = Math.round((inStock / total) * 100);
                const lowPct = Math.round((low / total) * 100);
                const outPct = Math.round((out / total) * 100);

                return (
                  <div className="space-y-3">
                    <div className="w-full h-4 bg-stone-200 rounded border border-stone-900 overflow-hidden flex">
                      <div style={{ width: `${inPct}%` }} className="bg-emerald-500 h-full" title={`In Stock: ${inPct}%`} />
                      <div style={{ width: `${lowPct}%` }} className="bg-amber-400 h-full" title={`Low Stock: ${lowPct}%`} />
                      <div style={{ width: `${outPct}%` }} className="bg-red-500 h-full" title={`Out of Stock: ${outPct}%`} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-dashed border-stone-300">
                      <div>
                        <span className="text-[9px] text-emerald-800 font-bold block uppercase">Healthy</span>
                        <span className="text-sm font-black text-stone-900">{inStock}</span>
                        <span className="text-[9px] text-stone-500 block">({inPct}%)</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-amber-700 font-bold block uppercase">Low</span>
                        <span className="text-sm font-black text-stone-900">{low}</span>
                        <span className="text-[9px] text-stone-500 block">({lowPct}%)</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-red-700 font-bold block uppercase">Depleted</span>
                        <span className="text-sm font-black text-stone-900">{out}</span>
                        <span className="text-[9px] text-stone-500 block">({outPct}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center text-[10px]">
              <span className="text-stone-500 uppercase">Automated threshold check</span>
              <Link to="/inventory" className="font-bold text-amber-700 uppercase hover:underline">
                View Bins &rarr;
              </Link>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          <div className="lg:col-span-2 bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-4 shadow-[4px_4px_0px_0px_#1c1917]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-stone-900 uppercase">Stock Volume by Category</h3>
              <span className="text-[10px] text-stone-500 uppercase">Top Storage Groups</span>
            </div>
            <p className="text-[10px] text-stone-500 uppercase mb-3">Units stored and capital valuation per segment</p>

            <div className="space-y-2.5">
              {categoryBreakdown.slice(0, 4).map((cat) => {
                const maxStock = Math.max(...categoryBreakdown.map((c) => c.totalStock), 1);
                const pct = Math.max(6, Math.round((cat.totalStock / maxStock) * 100));

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-black text-stone-900 uppercase truncate max-w-[50%]">{cat.category}</span>
                      <span className="text-stone-600 font-bold">
                        {cat.totalStock.toLocaleString()} units &bull; <strong className="text-stone-900">${cat.valuation.toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 border border-stone-400 rounded h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 border-r border-stone-900 h-full rounded transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {categoryBreakdown.length === 0 && (
                <p className="text-xs text-stone-400 uppercase py-4 text-center">No category data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Inventory Intelligence Section (Prompt 2) ───────────────────── */}
      {intelligence && (role === 'ADMIN' || role === 'MANAGER') && (
        <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded uppercase border border-stone-900">
                  ⚡ AI Intelligence Module
                </span>
                <span className="font-mono text-[10px] text-stone-500 uppercase">
                  Estimates from real 90-day OUT movements
                </span>
              </div>
              <h3 className="text-base font-black text-stone-900 uppercase">
                Stock-Out Risk &amp; Restock Recommendations
              </h3>
            </div>
            <Link
              to="/intelligence"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-mono text-xs font-black uppercase rounded shadow-[2px_2px_0px_0px_#d97706] transition-all"
            >
              Open Full Intelligence &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            {/* High Risk */}
            <div className="p-3 bg-red-50 border-2 border-red-500 rounded shadow-[2px_2px_0px_0px_#ef4444]">
              <span className="text-[10px] text-red-700 uppercase font-bold block">🚨 High Risk (&le;7 Days)</span>
              <span className="text-xl font-black text-red-700">{intelligence.summary.highRiskCount ?? intelligence.summary.criticalCount}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">imminent stock-out</span>
            </div>

            {/* Medium Risk */}
            <div className="p-3 bg-amber-50 border-2 border-amber-500 rounded shadow-[2px_2px_0px_0px_#f59e0b]">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">⚠️ Medium Risk (8-14 Days)</span>
              <span className="text-xl font-black text-amber-700">{intelligence.summary.mediumRiskCount ?? intelligence.summary.warningCount}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">buffer eroding</span>
            </div>

            {/* Low Risk */}
            <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded shadow-[2px_2px_0px_0px_#3b82f6]">
              <span className="text-[10px] text-blue-700 uppercase font-bold block">ℹ️ Low Risk (15-30 Days)</span>
              <span className="text-xl font-black text-blue-900">{intelligence.summary.lowRiskCount ?? 0}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">monitor trends</span>
            </div>

            {/* Suggested Restocks */}
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded shadow-[2px_2px_0px_0px_#059669]">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">📦 Recommended Orders</span>
              <span className="text-xl font-black text-emerald-800">{intelligence.summary.pendingRestockCount}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">action items ready</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Recent Stock Activities (Prompt 1) ──────────────────────────── */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-stone-900 uppercase tracking-tight">
              Recent Stock Activities
            </h2>
            <p className="font-mono text-xs text-stone-500 uppercase">Live transaction audit trail</p>
          </div>
          <Link
            to="/movements"
            className="font-mono text-xs font-black text-amber-700 uppercase hover:underline"
          >
            All Movements &rarr;
          </Link>
        </div>

        {recentMovements.length === 0 ? (
          <p className="font-mono text-xs text-stone-500 uppercase py-6 text-center">
            No stock movements recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Product / SKU</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {recentMovements.map((mov) => {
                  const typeColors: Record<string, string> = {
                    IN: 'bg-emerald-100 text-emerald-900 border-emerald-400',
                    OUT: 'bg-red-100 text-red-900 border-red-400',
                    TRANSFER: 'bg-blue-100 text-blue-900 border-blue-400',
                    ADJUSTMENT: 'bg-amber-100 text-amber-900 border-amber-400',
                  };

                  return (
                    <tr key={mov.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className={`inline-block font-bold uppercase text-[10px] px-2 py-0.5 border rounded ${typeColors[mov.type] || 'bg-stone-100'}`}>
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">
                        {mov.productId?.name}
                        <span className="text-[10px] text-stone-500 block">{mov.productId?.sku}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-stone-900">
                        {mov.type === 'OUT' ? `-${mov.quantity}` : `+${mov.quantity}`}
                      </td>
                      <td className="py-2.5 px-3 text-stone-700">
                        {mov.warehouseId?.code}
                        {mov.toWarehouseId && ` \u2192 ${mov.toWarehouseId.code}`}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {mov.userId?.name || 'System Operator'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-500 text-[10px]">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Accessible Modules Grid ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-stone-900 uppercase tracking-tight">
            Accessible Modules
          </h2>
          <span className="font-mono text-[11px] text-stone-500 uppercase">
            {cards.length} clearance stations
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
                <span>Launch Station</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
