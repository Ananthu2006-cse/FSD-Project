import React, { useEffect, useState } from 'react';
import { OrderRecord, fetchOrders, updateOrderStatus } from './api';

export const Dispatch: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    loadDispatchOrders();
  }, []);

  const loadDispatchOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      // Focus on staging and dispatch workflow: READY and DISPATCHED
      setOrders(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load dispatch queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchCommit = async (orderId: string, bay: string) => {
    try {
      await updateOrderStatus(orderId, 'DISPATCHED', bay);
      setSuccessMessage(`Order dispatched from ${bay}. Inventory decremented.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadDispatchOrders();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch order.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const dispatchQueue = orders.filter((o) => {
    if (carrierFilter === 'READY') return o.status === 'READY';
    if (carrierFilter === 'DISPATCHED') return o.status === 'DISPATCHED';
    return o.status === 'READY' || o.status === 'DISPATCHED' || o.status === 'PICKING';
  });

  return (
    <div className="space-y-6 selection:bg-amber-300 selection:text-black">
      {/* Alerts */}
      {successMessage && (
        <div className="bg-emerald-100 border-2 border-emerald-700 text-emerald-950 p-4 rounded shadow-[3px_3px_0px_0px_#047857] flex items-center justify-between font-mono text-xs">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border-2 border-red-700 text-red-950 p-4 rounded shadow-[3px_3px_0px_0px_#b91c1c] flex items-center justify-between font-mono text-xs">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
              MOD-DSP-07
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 9 &bull; Bay Staging &amp; Carrier Outbound Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Outbound Dispatch &amp; Bay Staging
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Loading Docks &bull; Carrier Manifests &bull; Pallet Freight Staging
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-3 shadow-[4px_4px_0px_0px_#1c1917] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-stone-700 uppercase">Stage Filter:</span>
          {['ALL', 'READY', 'DISPATCHED'].map((st) => (
            <button
              key={st}
              onClick={() => setCarrierFilter(st)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                carrierFilter === st
                  ? 'bg-stone-900 text-amber-300 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs font-bold text-stone-600">
          {dispatchQueue.length} shipments
        </div>
      </div>

      {/* Staging Bays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center font-mono text-xs text-stone-500 uppercase">
            Loading bay manifests...
          </div>
        ) : dispatchQueue.length === 0 ? (
          <div className="col-span-full py-16 text-center font-mono text-xs text-stone-500 uppercase bg-[#fffdf7] border-2 border-stone-900 rounded-lg">
            No active shipments staged for dispatch.
          </div>
        ) : (
          dispatchQueue.map((o) => (
            <div
              key={o.id}
              className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-4 shadow-[4px_4px_0px_0px_#1c1917] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded">
                    {o.dispatchBay}
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                      o.status === 'READY'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : o.status === 'DISPATCHED'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="font-mono text-xs font-bold text-stone-900">{o.orderNumber}</div>
                <h3 className="font-black text-sm text-stone-900 uppercase mt-0.5">{o.customerName}</h3>

                <div className="mt-3 font-mono text-[11px] text-stone-600 space-y-1">
                  <div>Lines: {o.items.length} items</div>
                  <div>Valuation: ${o.totalAmount.toFixed(2)}</div>
                  {o.notes && <div className="text-stone-500 truncate">Notes: {o.notes}</div>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200">
                {o.status === 'READY' ? (
                  <button
                    onClick={() => handleDispatchCommit(o.id, o.dispatchBay)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-black py-2 rounded shadow"
                  >
                    CONFIRM CARRIER PICKUP &rarr;
                  </button>
                ) : (
                  <div className="font-mono text-[11px] text-emerald-700 font-bold text-center">
                    ✓ Outbound Complete
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dispatch;
