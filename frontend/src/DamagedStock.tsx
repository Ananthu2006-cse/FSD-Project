import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  DamagedItem,
  DamagedFormData,
  Product,
  Warehouse,
  LocationItem,
  fetchDamagedStock,
  createDamagedStock,
  resolveDamagedStock,
  fetchProducts,
  fetchWarehouses,
  fetchLocationsByWarehouse,
} from './api';

export const DamagedStock: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const canResolve = role === 'ADMIN' || role === 'MANAGER';

  const [damagedList, setDamagedList] = useState<DamagedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Report Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<DamagedFormData>({
    productId: '',
    warehouseId: '',
    locationId: '',
    quantity: 1,
    reason: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Resolve Modal
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [itemToResolve, setItemToResolve] = useState<DamagedItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [damData, prodData, whData] = await Promise.all([
        fetchDamagedStock(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setDamagedList(damData);
      setProducts(prodData);
      setWarehouses(whData);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load damaged stock.');
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = async () => {
    const initialWh = warehouses.length > 0 ? warehouses[0].id : '';
    let locs: LocationItem[] = [];
    if (initialWh) {
      try { locs = await fetchLocationsByWarehouse(initialWh); } catch { locs = []; }
    }
    setLocations(locs);
    setFormData({
      productId: products.length > 0 ? products[0].id : '',
      warehouseId: initialWh,
      locationId: locs.length > 0 ? locs[0].id : '',
      quantity: 1,
      reason: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleWhChange = async (whId: string) => {
    setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: '' }));
    if (whId) {
      try {
        const locs = await fetchLocationsByWarehouse(whId);
        setLocations(locs);
        if (locs.length > 0) setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: locs[0].id }));
      } catch {
        setLocations([]);
      }
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.productId) errors.productId = 'Product is required';
    if (!formData.warehouseId) errors.warehouseId = 'Warehouse is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be at least 1';
    if (!formData.reason.trim()) errors.reason = 'Damage reason is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createDamagedStock(formData);
      setSuccessMessage('Damaged stock reported & deducted from usable inventory.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsModalOpen(false);
      const updated = await fetchDamagedStock();
      setDamagedList(updated);
    } catch (err: any) {
      setFormErrors({ general: err.response?.data?.message || 'Failed to submit report.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!itemToResolve) return;
    setIsResolving(true);
    try {
      await resolveDamagedStock(itemToResolve.id, resolutionNotes);
      setSuccessMessage('Damage report marked as resolved/written off.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsResolveOpen(false);
      setItemToResolve(null);
      const updated = await fetchDamagedStock();
      setDamagedList(updated);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to resolve report.');
    } finally {
      setIsResolving(false);
    }
  };

  const filteredDamaged = damagedList.filter((d) => {
    return statusFilter === 'ALL' || d.status === statusFilter;
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
              MOD-DAM-08
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 8 &bull; Defective &amp; Damaged Stock Isolation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Damaged Stock Registry
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Quarantine Defective Items &bull; Prevent Faulty Dispatch &bull; Write-Off Approvals
          </p>
        </div>

        <button
          onClick={openReportModal}
          className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-black px-4 py-2.5 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span>⚠</span>
          <span>REPORT DAMAGED ITEMS</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-3 shadow-[4px_4px_0px_0px_#1c1917] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-stone-700 uppercase">Status:</span>
          {['ALL', 'REPORTED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                statusFilter === st
                  ? 'bg-stone-900 text-amber-300 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs font-bold text-stone-600">
          {filteredDamaged.length} incidents recorded
        </div>
      </div>

      {/* Damaged Stock Table */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_#1c1917]">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="font-mono text-xs text-stone-600 uppercase">Loading incident records...</p>
          </div>
        ) : filteredDamaged.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-stone-500 uppercase">
            No damaged stock records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Damaged Units</th>
                  <th className="py-3 px-4">Incident Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported By</th>
                  {canResolve && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300 bg-white">
                {filteredDamaged.map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-950 uppercase">{d.productId?.name}</span>
                      <div className="text-[10px] text-stone-500">{d.productId?.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold">{d.warehouseId?.code}</span> &bull; {d.locationId?.code}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-red-700 text-sm">
                      {d.quantity}
                    </td>
                    <td className="py-3 px-4 text-stone-700 max-w-xs">
                      <div>{d.reason}</div>
                      {d.resolutionNotes && (
                        <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                          ✓ Note: {d.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                          d.status === 'REPORTED'
                            ? 'bg-red-100 text-red-900 border border-red-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {d.reportedBy?.name || 'Operator'}
                    </td>
                    {canResolve && (
                      <td className="py-3 px-4 text-right">
                        {d.status === 'REPORTED' ? (
                          <button
                            onClick={() => {
                              setItemToResolve(d);
                              setResolutionNotes('Item verified damaged and officially written off from books.');
                              setIsResolveOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded shadow text-[10px]"
                          >
                            RESOLVE
                          </button>
                        ) : (
                          <span className="text-stone-400 text-[10px]">RESOLVED</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <h3 className="text-xl font-black text-stone-900 uppercase">Log Damaged Stock</h3>
              <button onClick={() => setIsModalOpen(false)} className="font-mono font-bold text-stone-700 hover:text-black">✕</button>
            </div>

            {formErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Damaged Product</label>
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
                  <label className="block font-bold text-stone-800 uppercase mb-1">Warehouse Facility</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => handleWhChange(e.target.value)}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Location Bin</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.code} &mdash; {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Damaged Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Incident Details / Cause</label>
                <textarea
                  rows={3}
                  placeholder="Describe damage cause (e.g. moisture leak, pallet crush, broken seal)..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                />
                {formErrors.reason && <p className="text-red-600 text-[11px] mt-1">{formErrors.reason}</p>}
              </div>

              <div className="p-3 bg-red-50 border border-red-300 rounded text-[11px] text-red-900">
                ⚠️ Units will be deducted immediately from usable floor stock.
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
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]"
                >
                  {isSubmitting ? 'REPORTING...' : 'COMMIT DAMAGE REPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {isResolveOpen && itemToResolve && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#1c1917]">
            <h3 className="text-xl font-black text-stone-900 uppercase">Resolve Incident</h3>
            <p className="font-mono text-xs text-stone-700 mt-2">
              Resolve report for {itemToResolve.quantity}x <strong>{itemToResolve.productId?.name}</strong>?
            </p>

            <div className="mt-4 font-mono text-xs">
              <label className="block font-bold text-stone-800 uppercase mb-1">Resolution / Write-Off Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t-2 border-stone-900 font-mono text-xs">
              <button onClick={() => setIsResolveOpen(false)} className="px-4 py-2 border-2 border-stone-400 rounded">
                CANCEL
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={isResolving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]"
              >
                {isResolving ? 'SAVING...' : 'CONFIRM RESOLUTION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamagedStock;
