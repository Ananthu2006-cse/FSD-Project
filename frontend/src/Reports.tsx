import React, { useEffect, useState } from 'react';
import {
  DashboardSummary,
  fetchDashboardStats,
  InventoryItem,
  fetchInventory,
  DamagedItem,
  fetchDamagedStock,
  OrderRecord,
  fetchOrders,
} from './api';

export const Reports: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [damaged, setDamaged] = useState<DamagedItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'LOW_STOCK' | 'DAMAGED' | 'ORDERS'>('INVENTORY');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [statsData, invData, damData, ordData] = await Promise.all([
        fetchDashboardStats(),
        fetchInventory(),
        fetchDamagedStock(),
        fetchOrders(),
      ]);
      setSummary(statsData.summary);
      setInventory(invData);
      setDamaged(damData);
      setOrders(ordData);
    } catch {
      // Graceful error state
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= i.minimumStock);

  return (
    <div className="space-y-6 selection:bg-amber-300 selection:text-black">
      {/* Header Banner */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
              MOD-REP-09
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 10 &bull; Operational Reports &amp; Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Operational Intelligence
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Stock Valuations &bull; Replenishment Alerts &bull; Incident Write-Offs &bull; Throughput
          </p>
        </div>

        <button
          onClick={loadReportsData}
          className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-4 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]"
        >
          REFRESH AUDIT
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="bg-[#fffdf7] border-2 border-stone-900 p-4 rounded-lg shadow-[3px_3px_0px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Stock Valuation</span>
            <span className="text-xl font-black text-stone-950">${summary.totalStockValuation.toLocaleString()}</span>
            <span className="text-[10px] text-stone-600 block mt-1">{summary.totalStockUnits} total units</span>
          </div>

          <div className="bg-[#fffdf7] border-2 border-stone-900 p-4 rounded-lg shadow-[3px_3px_0px_0px_#1c1917]">
            <span className="text-[10px] text-amber-700 uppercase font-bold block">Low Stock Warnings</span>
            <span className="text-xl font-black text-amber-700">{summary.lowStockCount} items</span>
            <span className="text-[10px] text-stone-600 block mt-1">Below min safety threshold</span>
          </div>

          <div className="bg-[#fffdf7] border-2 border-stone-900 p-4 rounded-lg shadow-[3px_3px_0px_0px_#1c1917]">
            <span className="text-[10px] text-red-700 uppercase font-bold block">Damaged Write-Offs</span>
            <span className="text-xl font-black text-red-700">{summary.totalDamagedItems} units</span>
            <span className="text-[10px] text-stone-600 block mt-1">{summary.unresolvedDamagedCount} pending resolution</span>
          </div>

          <div className="bg-[#fffdf7] border-2 border-stone-900 p-4 rounded-lg shadow-[3px_3px_0px_0px_#1c1917]">
            <span className="text-[10px] text-blue-700 uppercase font-bold block">Fulfillment Queue</span>
            <span className="text-xl font-black text-blue-900">{summary.totalOrders} total</span>
            <span className="text-[10px] text-stone-600 block mt-1">{summary.dispatchedOrders} dispatched</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-2 shadow-[4px_4px_0px_0px_#1c1917] flex flex-wrap gap-2">
        {[
          { key: 'INVENTORY', label: 'Inventory Valuation' },
          { key: 'LOW_STOCK', label: 'Low Stock Alerts' },
          { key: 'DAMAGED', label: 'Damaged Losses' },
          { key: 'ORDERS', label: 'Orders Throughput' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`font-mono text-xs px-3 py-1.5 rounded font-black uppercase border-2 transition-all ${
              activeTab === t.key
                ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-[2px_2px_0px_0px_#d97706]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]">
        {loading ? (
          <div className="py-16 text-center font-mono text-xs text-stone-500 uppercase">
            Compiling audit report...
          </div>
        ) : activeTab === 'INVENTORY' ? (
          <div>
            <h3 className="font-mono text-sm font-black text-stone-900 uppercase mb-3">Inventory Ledger &amp; Valuation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product / SKU</th>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3">Location Bin</th>
                    <th className="py-2.5 px-3 text-center">In-Stock Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {inventory.map((inv) => {
                    const price = inv.productId?.unitPrice || 0;
                    return (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-bold text-stone-900 uppercase">{inv.productId?.name}</td>
                        <td className="py-2 px-3">{inv.warehouseId?.code}</td>
                        <td className="py-2 px-3">{inv.locationId?.code}</td>
                        <td className="py-2 px-3 text-center font-black">{inv.quantity}</td>
                        <td className="py-2 px-3 text-right">${price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-black">${(inv.quantity * price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'LOW_STOCK' ? (
          <div>
            <h3 className="font-mono text-sm font-black text-amber-800 uppercase mb-3">⚠️ Critical Replenishment Alerts</h3>
            {lowStockItems.length === 0 ? (
              <p className="font-mono text-xs text-stone-500">All inventory items are currently above their safety thresholds.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-amber-900 text-amber-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3 text-center">Available Qty</th>
                      <th className="py-2 px-3 text-center">Safety Threshold</th>
                      <th className="py-2 px-3 text-center">Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 bg-amber-50/40">
                    {lowStockItems.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-bold text-stone-900">{inv.productId?.name}</td>
                        <td className="py-2 px-3">{inv.warehouseId?.code} - {inv.locationId?.code}</td>
                        <td className="py-2 px-3 text-center font-black text-amber-800">{inv.quantity}</td>
                        <td className="py-2 px-3 text-center">{inv.minimumStock}</td>
                        <td className="py-2 px-3 text-center font-bold text-red-600">-{inv.minimumStock - inv.quantity} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'DAMAGED' ? (
          <div>
            <h3 className="font-mono text-sm font-black text-red-900 uppercase mb-3">Damaged &amp; Quarantined Losses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-red-900 text-red-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Lost Units</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200">
                  {damaged.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 px-3 text-stone-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-bold text-stone-900">{d.productId?.name}</td>
                      <td className="py-2 px-3 text-center font-black text-red-700">{d.quantity}</td>
                      <td className="py-2 px-3">{d.reason}</td>
                      <td className="py-2 px-3 font-bold">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-mono text-sm font-black text-stone-900 uppercase mb-3">Order Fulfillment Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Order #</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Dispatch Bay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 px-3 font-bold">{o.orderNumber}</td>
                      <td className="py-2 px-3">{o.customerName}</td>
                      <td className="py-2 px-3 text-center font-bold">{o.status}</td>
                      <td className="py-2 px-3 text-right font-black">${o.totalAmount.toFixed(2)}</td>
                      <td className="py-2 px-3">{o.dispatchBay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
