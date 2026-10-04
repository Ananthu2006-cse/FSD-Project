import React, { useEffect, useState } from 'react';
import {
  StockMovementItem,
  MovementFormData,
  Product,
  Warehouse,
  LocationItem,
  fetchMovements,
  createMovement,
  fetchProducts,
  fetchWarehouses,
  fetchLocationsByWarehouse,
} from './api';

export const StockMovements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sourceLocations, setSourceLocations] = useState<LocationItem[]>([]);
  const [destLocations, setDestLocations] = useState<LocationItem[]>([]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<MovementFormData>({
    type: 'TRANSFER',
    productId: '',
    warehouseId: '',
    locationId: '',
    toWarehouseId: '',
    toLocationId: '',
    quantity: 1,
    reason: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movData, prodData, whData] = await Promise.all([
        fetchMovements(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setMovements(movData);
      setProducts(prodData);
      setWarehouses(whData);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load movements.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    const initialWh = warehouses.length > 0 ? warehouses[0].id : '';
    let locs: LocationItem[] = [];
    if (initialWh) {
      try { locs = await fetchLocationsByWarehouse(initialWh); } catch { locs = []; }
    }
    setSourceLocations(locs);
    setDestLocations(locs);

    setFormData({
      type: 'TRANSFER',
      productId: products.length > 0 ? products[0].id : '',
      warehouseId: initialWh,
      locationId: locs.length > 0 ? locs[0].id : '',
      toWarehouseId: initialWh,
      toLocationId: locs.length > 1 ? locs[1].id : locs.length > 0 ? locs[0].id : '',
      quantity: 5,
      reason: 'Routine bin replenishment',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSourceWhChange = async (whId: string) => {
    setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: '' }));
    if (whId) {
      try {
        const locs = await fetchLocationsByWarehouse(whId);
        setSourceLocations(locs);
        if (locs.length > 0) setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: locs[0].id }));
      } catch {
        setSourceLocations([]);
      }
    }
  };

  const handleDestWhChange = async (whId: string) => {
    setFormData((prev) => ({ ...prev, toWarehouseId: whId, toLocationId: '' }));
    if (whId) {
      try {
        const locs = await fetchLocationsByWarehouse(whId);
        setDestLocations(locs);
        if (locs.length > 0) setFormData((prev) => ({ ...prev, toWarehouseId: whId, toLocationId: locs[0].id }));
      } catch {
        setDestLocations([]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.productId) errors.productId = 'Product is required';
    if (!formData.warehouseId) errors.warehouseId = 'Warehouse is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be at least 1';

    if (formData.type === 'TRANSFER') {
      if (!formData.toWarehouseId) errors.toWarehouseId = 'Destination warehouse required';
      if (!formData.toLocationId) errors.toLocationId = 'Destination location required';
      if (formData.warehouseId === formData.toWarehouseId && formData.locationId === formData.toLocationId) {
        errors.toLocationId = 'Destination location must differ from source';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createMovement(formData);
      setSuccessMessage('Stock movement logged & inventory updated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsModalOpen(false);
      const updated = await fetchMovements();
      setMovements(updated);
    } catch (err: any) {
      setFormErrors({ general: err.response?.data?.message || 'Failed to process movement.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    return typeFilter === 'ALL' || m.type === typeFilter;
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
              MOD-MOV-05
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 7 &bull; Stock Movement &amp; Relocations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Stock Movements
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Inbound Receipts &bull; Internal Transfers &bull; Outbound Shipments &bull; Adjustments
          </p>
        </div>

        <button
          onClick={openModal}
          className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-4 py-2.5 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span>⇄</span>
          <span>EXECUTE STOCK MOVEMENT</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-3 shadow-[4px_4px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-stone-700 uppercase">Filter Type:</span>
          {['ALL', 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                typeFilter === t
                  ? 'bg-stone-900 text-amber-300 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs font-bold text-stone-600">
          {filteredMovements.length} log records
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_#1c1917]">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="font-mono text-xs text-stone-600 uppercase">Loading movement audit trail...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-stone-500 uppercase">
            No stock movements found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Source Location</th>
                  <th className="py-3 px-4">Destination Location</th>
                  <th className="py-3 px-4 text-center">Units Moved</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300 bg-white">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                          m.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : m.type === 'OUT'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : m.type === 'TRANSFER'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-950 uppercase">{m.productId?.name}</span>
                      <div className="text-[10px] text-stone-500">{m.productId?.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold">{m.warehouseId?.code}</span> &bull; {m.locationId?.code}
                    </td>
                    <td className="py-3 px-4">
                      {m.toWarehouseId ? (
                        <>
                          <span className="font-bold">{m.toWarehouseId.code}</span> &bull; {m.toLocationId?.code}
                        </>
                      ) : (
                        <span className="text-stone-400">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-sm">
                      {m.quantity}
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                      {m.reason}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {m.userId?.name || 'Operator'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <h3 className="text-xl font-black text-stone-900 uppercase">Execute Stock Movement</h3>
              <button onClick={() => setIsModalOpen(false)} className="font-mono font-bold text-stone-700 hover:text-black">✕</button>
            </div>

            {formErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Movement Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`py-1.5 rounded font-black border-2 ${
                        formData.type === t
                          ? 'bg-stone-900 text-amber-300 border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} &mdash; {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Source Facility</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => handleSourceWhChange(e.target.value)}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Source Bin</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  >
                    {sourceLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.code} &mdash; {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === 'TRANSFER' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 border-2 border-amber-300 rounded">
                  <div>
                    <label className="block font-bold text-amber-950 uppercase mb-1">Destination Facility</label>
                    <select
                      value={formData.toWarehouseId}
                      onChange={(e) => handleDestWhChange(e.target.value)}
                      className="w-full bg-white border-2 border-stone-900 p-2 rounded focus:outline-none"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-950 uppercase mb-1">Destination Bin</label>
                    <select
                      value={formData.toLocationId}
                      onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                      className="w-full bg-white border-2 border-stone-900 p-2 rounded focus:outline-none"
                    >
                      {destLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.code} &mdash; {l.name}</option>
                      ))}
                    </select>
                    {formErrors.toLocationId && (
                      <p className="text-red-600 text-[10px] mt-1">{formErrors.toLocationId}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Reason / Manifest Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound purchase order PO-881, or damaged transfer"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-stone-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-stone-400 rounded text-stone-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]"
                >
                  {isSubmitting ? 'PROCESSING...' : 'COMMIT MOVEMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;
