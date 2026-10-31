import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchIntelligence,
  IntelligenceResponse,
  ProductPrediction,
  DemandProduct,
  DailyTrendPoint,
} from './api';
import { SkeletonCard, SkeletonTable, RiskBadge, EmptyState } from './components/UIComponents';

// ─── Utility Components ────────────────────────────────────────────────────────

const AlertBadge: React.FC<{ level: ProductPrediction['alertLevel'] }> = ({ level }) => {
  const map = {
    CRITICAL: 'bg-red-600 text-white',
    WARNING: 'bg-amber-500 text-stone-900',
    OK: 'bg-emerald-600 text-white',
    NO_DATA: 'bg-stone-400 text-white',
  };
  return (
    <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded ${map[level]}`}>
      {level === 'NO_DATA' ? 'No Data' : level}
    </span>
  );
};

const UrgencyBadge: React.FC<{ urgency: ProductPrediction['reorderUrgency'] }> = ({ urgency }) => {
  const map = {
    URGENT: 'text-red-700 border-red-400 bg-red-50',
    SOON: 'text-amber-700 border-amber-400 bg-amber-50',
    MONITOR: 'text-blue-700 border-blue-400 bg-blue-50',
    OK: 'text-emerald-700 border-emerald-400 bg-emerald-50',
  };
  return (
    <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border rounded ${map[urgency]}`}>
      {urgency}
    </span>
  );
};

// ─── Simple CSS Bar Chart ──────────────────────────────────────────────────────

const BarChart: React.FC<{
  items: { label: string; value: number; sublabel?: string }[];
  colorClass: string;
  maxValue?: number;
}> = ({ items, colorClass, maxValue }) => {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono text-[11px] font-bold text-stone-800 truncate max-w-[60%] uppercase">{item.label}</span>
            <span className="font-mono text-[11px] font-black text-stone-900">{item.value} units</span>
          </div>
          {item.sublabel && (
            <span className="font-mono text-[9px] text-stone-500 uppercase block mb-0.5">{item.sublabel}</span>
          )}
          <div className="w-full bg-stone-200 border border-stone-300 rounded h-3 overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-500 ${colorClass}`}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="font-mono text-xs text-stone-400 uppercase text-center py-3">No data available</p>
      )}
    </div>
  );
};

// Daily spark bars
const SparkBars: React.FC<{ data: DailyTrendPoint[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.totalOut), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => {
        const pct = Math.max(4, (d.totalOut / max) * 100);
        const label = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="font-mono text-[8px] text-stone-500">{d.totalOut}</span>
            <div className="w-full bg-stone-200 border border-stone-300 rounded-t overflow-hidden flex flex-col justify-end" style={{ height: '40px' }}>
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-500"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[8px] text-stone-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'PREDICTIONS' | 'RESTOCK' | 'DEMAND';

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Intelligence: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('PREDICTIONS');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'HEALTHY'>('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchIntelligence();
      setData(result);
    } catch {
      setError('Failed to load intelligence data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Derived data
  const predictions = data?.predictions ?? [];
  const filteredPredictions = riskFilter === 'ALL'
    ? predictions
    : predictions.filter((p) => (p.riskLevel || (p.alertLevel === 'CRITICAL' ? 'HIGH_RISK' : p.alertLevel === 'WARNING' ? 'MEDIUM_RISK' : 'HEALTHY')) === riskFilter);

  const restockItems = predictions
    .filter((p) => p.suggestedReorderQty > 0)
    .sort((a, b) => {
      const urgencyOrder = { URGENT: 0, SOON: 1, MONITOR: 2, OK: 3 };
      return urgencyOrder[a.reorderUrgency] - urgencyOrder[b.reorderUrgency];
    });

  const fastMoving: DemandProduct[] = data?.demandAnalytics.fastMoving ?? [];
  const slowMoving: DemandProduct[] = data?.demandAnalytics.slowMoving ?? [];
  const dailyTrend: DailyTrendPoint[] = data?.demandAnalytics.dailyTrend ?? [];

  return (
    <div className="space-y-6 selection:bg-amber-300 selection:text-black">

      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
              MOD-INT-11
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Inventory Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Smart Inventory Insights
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Stock Predictions &bull; Restock Suggestions &bull; Demand Analytics
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-mono text-xs font-black px-4 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] transition-all"
        >
          {loading ? 'COMPUTING...' : 'REFRESH DATA'}
        </button>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="bg-[#fffdf7] border-2 border-stone-900 p-3.5 rounded shadow-[3px_3px_0px_0px_#1c1917]">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Products</span>
            <span className="text-2xl font-black text-stone-900">{predictions.length}</span>
            <span className="text-[10px] text-stone-600 block mt-0.5">tracked in inventory</span>
          </div>
          <div className="bg-[#fffdf7] border-2 border-red-500 p-3.5 rounded shadow-[3px_3px_0px_0px_#ef4444]">
            <span className="text-[10px] text-red-700 uppercase font-bold block">Critical Alerts</span>
            <span className="text-2xl font-black text-red-700">{data.summary.criticalCount}</span>
            <span className="text-[10px] text-stone-600 block mt-0.5">stock-out within 7 days</span>
          </div>
          <div className="bg-[#fffdf7] border-2 border-amber-500 p-3.5 rounded shadow-[3px_3px_0px_0px_#f59e0b]">
            <span className="text-[10px] text-amber-700 uppercase font-bold block">Warnings</span>
            <span className="text-2xl font-black text-amber-700">{data.summary.warningCount}</span>
            <span className="text-[10px] text-stone-600 block mt-0.5">stock-out within 14 days</span>
          </div>
          <div className="bg-[#fffdf7] border-2 border-blue-500 p-3.5 rounded shadow-[3px_3px_0px_0px_#3b82f6]">
            <span className="text-[10px] text-blue-700 uppercase font-bold block">Pending Restocks</span>
            <span className="text-2xl font-black text-blue-900">{data.summary.pendingRestockCount}</span>
            <span className="text-[10px] text-stone-600 block mt-0.5">items need reordering</span>
          </div>
        </div>
      ) : null}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-2 shadow-[4px_4px_0px_0px_#1c1917] flex flex-wrap gap-2">
        {([
          { key: 'PREDICTIONS', label: '📊 Stock Predictions' },
          { key: 'RESTOCK',     label: '📦 Restock Suggestions' },
          { key: 'DEMAND',      label: '📈 Demand Analytics' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
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

      {/* ── Content Panel ──────────────────────────────────────────────────── */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]">
        {loading ? (
          <div className="p-2">
            <SkeletonTable rows={4} cols={8} />
          </div>
        ) : error ? (
          <EmptyState title="Intelligence Computation Notice" description={error} />
        ) : activeTab === 'PREDICTIONS' ? (

          // ── Predictions Tab ──────────────────────────────────────────────
          <div>
            {/* Real Data Disclaimer Banner (Prompt 2 requirement) */}
            <div className="bg-amber-100/70 border-2 border-stone-900 rounded p-3 mb-4 font-mono text-[11px] text-stone-800 flex items-start gap-2 shadow-[2px_2px_0px_0px_#1c1917]">
              <span className="text-base leading-none">🛡️</span>
              <div>
                <strong className="uppercase font-black text-stone-900 block">Data Integrity &amp; Estimation Policy:</strong>
                Estimations are strictly calculated from actual database stock-out movement records over the last 90 days.
                Products without historical OUT transactions are explicitly marked as <span className="font-bold underline">No OUT Data</span> rather than assuming zero consumption. Stock levels are never auto-adjusted by estimates.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-mono text-sm font-black text-stone-900 uppercase">
                Stock-Out Risk Indicators
              </h3>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {([
                  { key: 'ALL', label: 'All' },
                  { key: 'HIGH_RISK', label: '🚨 High Risk (\u22647d)' },
                  { key: 'MEDIUM_RISK', label: '⚠️ Medium (8-14d)' },
                  { key: 'LOW_RISK', label: 'ℹ️ Low (15-30d)' },
                  { key: 'HEALTHY', label: '✅ Healthy' },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRiskFilter(f.key)}
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border transition-all ${
                      riskFilter === f.key
                        ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-[1px_1px_0px_0px_#1c1917]'
                        : 'bg-white text-stone-600 border-stone-300 hover:border-stone-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product / SKU</th>
                    <th className="py-2.5 px-3 text-center">Current Stock</th>
                    <th className="py-2.5 px-3 text-center">Safety Buffer</th>
                    <th className="py-2.5 px-3 text-center">Avg Daily OUT</th>
                    <th className="py-2.5 px-3 text-center">Estimated Days Left</th>
                    <th className="py-2.5 px-3 text-center">Risk Classification</th>
                    <th className="py-2.5 px-3 text-center">7D Dispatched</th>
                    <th className="py-2.5 px-3 text-center">30D Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredPredictions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400 uppercase">
                        No products match the selected risk filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPredictions
                      .sort((a, b) => {
                        const order = { HIGH_RISK: 0, MEDIUM_RISK: 1, INSUFFICIENT_DATA: 2, LOW_RISK: 3, HEALTHY: 4 };
                        const riskA = a.riskLevel || (a.alertLevel === 'CRITICAL' ? 'HIGH_RISK' : a.alertLevel === 'WARNING' ? 'MEDIUM_RISK' : 'HEALTHY');
                        const riskB = b.riskLevel || (b.alertLevel === 'CRITICAL' ? 'HIGH_RISK' : b.alertLevel === 'WARNING' ? 'MEDIUM_RISK' : 'HEALTHY');
                        return (order[riskA as keyof typeof order] ?? 3) - (order[riskB as keyof typeof order] ?? 3);
                      })
                      .map((p) => {
                        const risk = p.riskLevel || (p.alertLevel === 'CRITICAL' ? 'HIGH_RISK' : p.alertLevel === 'WARNING' ? 'MEDIUM_RISK' : 'HEALTHY');
                        return (
                          <tr
                            key={p.inventoryId}
                            className={`transition-colors ${
                              risk === 'HIGH_RISK' ? 'bg-red-50/70' :
                              risk === 'MEDIUM_RISK' ? 'bg-amber-50/70' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              <span className="font-black text-stone-900 uppercase block">{p.productName}</span>
                              <span className="text-[10px] text-stone-500">{p.sku} &bull; {p.category}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-black text-stone-900">{p.currentStock}</td>
                            <td className="py-2 px-3 text-center text-stone-600">{p.minimumStock}</td>
                            <td className="py-2 px-3 text-center">
                              {p.avgDailyConsumption > 0
                                ? <span className="font-bold text-stone-800">{p.avgDailyConsumption}/day</span>
                                : <span className="text-stone-400">&mdash;</span>}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {p.daysRemaining !== null ? (
                                <span className={`font-black ${
                                  p.daysRemaining <= 7 ? 'text-red-700' :
                                  p.daysRemaining <= 14 ? 'text-amber-700' : 'text-emerald-700'
                                }`}>
                                  ~{p.daysRemaining} days
                                </span>
                              ) : (
                                <span className="text-stone-400 text-[10px]">Insufficient Data</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <RiskBadge risk={risk} />
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-stone-700">{p.totalOutLast7Days}</td>
                            <td className="py-2 px-3 text-center font-bold text-stone-700">{p.totalOutLast30Days}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            <p className="font-mono text-[10px] text-stone-500 uppercase mt-3">
              * Days remaining = Current On-Hand / Avg Daily OUT (90-day window). Real movements only.
            </p>
          </div>

        ) : activeTab === 'RESTOCK' ? (

          // ── Restock Suggestions Tab ──────────────────────────────────────
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-mono text-sm font-black text-stone-900 uppercase">
                Automatic Restock Suggestions
              </h3>
              {canManage && (
                <span className="font-mono text-[10px] text-stone-500 uppercase border border-stone-300 px-2 py-0.5 rounded">
                  ADMIN / MANAGER REVIEW
                </span>
              )}
            </div>

            {restockItems.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-mono text-sm font-black text-emerald-700 uppercase">All Stock Levels Healthy</p>
                <p className="font-mono text-xs text-stone-500 uppercase mt-1">No restock suggestions at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {restockItems.map((p) => (
                  <div
                    key={p.inventoryId}
                    className={`border-2 rounded-lg p-4 ${
                      p.reorderUrgency === 'URGENT' ? 'border-red-400 bg-red-50' :
                      p.reorderUrgency === 'SOON' ? 'border-amber-400 bg-amber-50' :
                      'border-blue-300 bg-blue-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <UrgencyBadge urgency={p.reorderUrgency} />
                          <AlertBadge level={p.alertLevel} />
                        </div>
                        <p className="font-black text-stone-900 uppercase text-sm">{p.productName}</p>
                        <p className="font-mono text-[10px] text-stone-500 uppercase">{p.sku} &bull; {p.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-stone-500 uppercase">Suggested Order Qty</p>
                        <p className="text-2xl font-black text-stone-900">{p.suggestedReorderQty}</p>
                        <p className="font-mono text-[10px] text-stone-500">units</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-stone-200">
                      <div>
                        <span className="font-mono text-[9px] text-stone-500 uppercase block">Current Stock</span>
                        <span className="font-mono text-xs font-black text-stone-900">{p.currentStock} units</span>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-stone-500 uppercase block">Min. Threshold</span>
                        <span className="font-mono text-xs font-black text-stone-900">{p.minimumStock} units</span>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-stone-500 uppercase block">Days Remaining</span>
                        <span className="font-mono text-xs font-black text-stone-900">
                          {p.daysRemaining !== null ? `${p.daysRemaining} days` : 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-stone-500 uppercase block">Avg Daily Use</span>
                        <span className="font-mono text-xs font-black text-stone-900">
                          {p.avgDailyConsumption > 0 ? `${p.avgDailyConsumption}/day` : 'No history'}
                        </span>
                      </div>
                    </div>

                    <p className="font-mono text-[10px] text-stone-500 mt-2 uppercase">
                      Calculation: Target = max({p.minimumStock * 2} min×2, {Math.ceil(p.avgDailyConsumption * 30)} avg×30days) &minus; {p.currentStock} current = <strong>{p.suggestedReorderQty}</strong> units
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (

          // ── Demand Analytics Tab ─────────────────────────────────────────
          <div className="space-y-6">
            {/* Daily Consumption Trend */}
            <div>
              <h3 className="font-mono text-sm font-black text-stone-900 uppercase mb-1">
                Daily Consumption Trend (Last 7 Days)
              </h3>
              <p className="font-mono text-[10px] text-stone-500 uppercase mb-3">
                Total units dispatched (OUT movements) per day
              </p>
              {dailyTrend.every((d) => d.totalOut === 0) ? (
                <p className="font-mono text-xs text-stone-400 uppercase py-4 text-center">
                  No OUT movements recorded in the last 7 days.
                </p>
              ) : (
                <SparkBars data={dailyTrend} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-stone-200">
              {/* Fast Moving */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded uppercase">
                    Fast Moving
                  </span>
                  <h4 className="font-mono text-xs font-black text-stone-900 uppercase">
                    Top 5 by 30-Day Demand
                  </h4>
                </div>
                <BarChart
                  items={fastMoving.map((p) => ({
                    label: p.productName,
                    value: p.total,
                    sublabel: p.sku,
                  }))}
                  colorClass="bg-emerald-500"
                />
                {fastMoving.length === 0 && (
                  <p className="font-mono text-xs text-stone-400 uppercase text-center py-4">
                    No OUT movement data in the last 30 days.
                  </p>
                )}
              </div>

              {/* Slow Moving */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded uppercase">
                    Slow Moving
                  </span>
                  <h4 className="font-mono text-xs font-black text-stone-900 uppercase">
                    Lowest 5 by 30-Day Demand
                  </h4>
                </div>
                <BarChart
                  items={slowMoving.map((p) => ({
                    label: p.productName,
                    value: p.total,
                    sublabel: p.sku,
                  }))}
                  colorClass="bg-amber-500"
                  maxValue={fastMoving[0]?.total ?? 1}
                />
                {slowMoving.length === 0 && (
                  <p className="font-mono text-xs text-stone-400 uppercase text-center py-4">
                    No demand data available.
                  </p>
                )}
              </div>
            </div>

            {/* Category breakdown table */}
            {data && predictions.length > 0 && (
              <div className="pt-4 border-t-2 border-dashed border-stone-200">
                <h4 className="font-mono text-xs font-black text-stone-900 uppercase mb-3">
                  30-Day Demand by Product
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-center">7D Units Out</th>
                        <th className="py-2 px-3 text-center">30D Units Out</th>
                        <th className="py-2 px-3 text-center">Avg/Day</th>
                        <th className="py-2 px-3 text-center">Velocity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {[...predictions]
                        .sort((a, b) => b.totalOutLast30Days - a.totalOutLast30Days)
                        .map((p) => {
                          const velocity =
                            p.totalOutLast30Days > 50 ? 'HIGH' :
                            p.totalOutLast30Days > 10 ? 'MEDIUM' : 'LOW';
                          const vClass =
                            velocity === 'HIGH' ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
                            velocity === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-300' :
                            'text-stone-500 bg-stone-50 border-stone-300';
                          return (
                            <tr key={p.inventoryId}>
                              <td className="py-2 px-3 font-bold text-stone-900 uppercase">{p.productName}</td>
                              <td className="py-2 px-3 text-stone-500">{p.sku}</td>
                              <td className="py-2 px-3 text-stone-600">{p.category}</td>
                              <td className="py-2 px-3 text-center font-bold">{p.totalOutLast7Days}</td>
                              <td className="py-2 px-3 text-center font-black">{p.totalOutLast30Days}</td>
                              <td className="py-2 px-3 text-center">{p.avgDailyConsumption || '—'}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 border rounded ${vClass}`}>
                                  {velocity}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Intelligence;
