import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  InventoryItem,
  InventoryFormData,
  Product,
  Warehouse,
  LocationItem,
  fetchInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  fetchProducts,
  fetchWarehouses,
  fetchLocationsByWarehouse,
} from './api';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modalLocations, setModalLocations] = useState<LocationItem[]>([]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    productId: '',
    warehouseId: '',
    locationId: '',
    quantity: 0,
    minimumStock: 10,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, prodData, whData] = await Promise.all([
        fetchInventory(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setInventory(invData);
      setProducts(prodData);
      setWarehouses(whData);
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChangeInForm = async (whId: string) => {
    setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: '' }));
    if (whId) {
      try {
        const locs = await fetchLocationsByWarehouse(whId);
        setModalLocations(locs);
        if (locs.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: whId, locationId: locs[0].id }));
        }
      } catch {
        setModalLocations([]);
      }
    } else {
      setModalLocations([]);
    }
  };

  const openCreateModal = async () => {
    setModalMode('create');
    setEditingId(null);
    const initialWh = warehouses.length > 0 ? warehouses[0].id : '';
    let locs: LocationItem[] = [];
    if (initialWh) {
      try { locs = await fetchLocationsByWarehouse(initialWh); } catch { locs = []; }
    }
    setModalLocations(locs);
    setFormData({
      productId: products.length > 0 ? products[0].id : '',
      warehouseId: initialWh,
      locationId: locs.length > 0 ? locs[0].id : '',
      quantity: 10,
      minimumStock: 10,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (item: InventoryItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    const whId = item.warehouseId?.id || (item.warehouseId as any)?._id || '';
    const locId = item.locationId?.id || (item.locationId as any)?._id || '';
    const prodId = item.productId?.id || (item.productId as any)?._id || '';

    if (whId) {
      try {
        const locs = await fetchLocationsByWarehouse(whId);
        setModalLocations(locs);
      } catch {
        setModalLocations([]);
      }
    }

    setFormData({
      productId: prodId,
      warehouseId: whId,
      locationId: locId,
      quantity: item.quantity,
      minimumStock: item.minimumStock,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.productId) errors.productId = 'Product is required';
    if (!formData.warehouseId) errors.warehouseId = 'Warehouse is required';
    if (!formData.locationId) errors.locationId = 'Storage location is required';
    if (formData.quantity < 0) errors.quantity = 'Quantity cannot be negative';
    if (formData.minimumStock < 0) errors.minimumStock = 'Minimum threshold cannot be negative';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createInventory(formData);
        notifySuccess('Stock inventory entry registered successfully.');
      } else if (editingId) {
        await updateInventory(editingId, {
          quantity: formData.quantity,
          minimumStock: formData.minimumStock,
          locationId: formData.locationId,
        });
        notifySuccess('Stock inventory updated successfully.');
      }
      setIsModalOpen(false);
      const updated = await fetchInventory();
      setInventory(updated);
    } catch (err: any) {
      setFormErrors({ general: err.response?.data?.message || 'Submission error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventory(itemToDelete.id);
      notifySuccess('Inventory record removed.');
      setIsDeleteOpen(false);
      setItemToDelete(null);
      const updated = await fetchInventory();
      setInventory(updated);
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to remove inventory record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const prodName = item.productId?.name || '';
    const sku = item.productId?.sku || '';
    const whId = item.warehouseId?.id || (item.warehouseId as any)?._id || '';

    const matchesSearch =
      prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'ALL' || whId === warehouseFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesWarehouse && matchesStatus;
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
              MOD-INV-04
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 6 &bull; Inventory &amp; Stock Levels
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Inventory Management
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Product &rarr; Warehouse &rarr; Storage Location &rarr; Quantity Balances
          </p>
        </div>

        {canManage ? (
          <button
            onClick={openCreateModal}
            className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-4 py-2.5 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>+</span>
            <span>ASSIGN STOCK TO BIN</span>
          </button>
        ) : (
          <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-400 px-3 py-1.5 rounded">
            VIEW CLEARANCE ({role})
          </span>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-4 shadow-[4px_4px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#fcfaf2] border-2 border-stone-900 px-3 py-1.5 font-mono text-xs rounded focus:outline-none focus:bg-white flex-1 min-w-[200px]"
          />

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="bg-[#fcfaf2] border-2 border-stone-900 px-3 py-1.5 font-mono text-xs rounded focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.code} - {wh.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#fcfaf2] border-2 border-stone-900 px-3 py-1.5 font-mono text-xs rounded focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">IN STOCK</option>
            <option value="LOW_STOCK">LOW STOCK</option>
            <option value="OUT_OF_STOCK">OUT OF STOCK</option>
          </select>
        </div>

        <div className="font-mono text-xs font-bold text-stone-700">
          {filteredInventory.length} records found
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_#1c1917]">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="font-mono text-xs text-stone-600 uppercase">Loading stock ledger...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-stone-500 uppercase">
            No stock records match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Facility / Warehouse</th>
                  <th className="py-3 px-4">Location Bin</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300 bg-white">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-950 uppercase">{item.productId?.name || 'Unnamed Product'}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{item.productId?.sku || 'NO-SKU'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-stone-100 border border-stone-300 px-2 py-0.5 rounded font-bold">
                        {item.warehouseId?.code || 'WH'}
                      </span>
                      <span className="ml-2 text-stone-700">{item.warehouseId?.name}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      📍 {item.locationId?.code || 'UNASSIGNED'} &mdash; {item.locationId?.name}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-sm">
                      <span className={item.quantity <= item.minimumStock ? 'text-amber-700' : 'text-stone-900'}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-stone-500">
                      {item.minimumStock}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.status === 'IN_STOCK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'LOW_STOCK'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-stone-800 hover:text-black font-bold mr-3 underline"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteOpen(true);
                          }}
                          className="text-red-700 hover:text-red-900 font-bold underline"
                        >
                          DEL
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Inventory */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <h3 className="text-xl font-black text-stone-900 uppercase">
                {modalMode === 'create' ? 'Assign Product to Storage' : 'Update Stock Balance'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="font-mono font-bold text-stone-700 hover:text-black">✕</button>
            </div>

            {formErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Product</label>
                <select
                  disabled={modalMode === 'edit'}
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} &mdash; {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Warehouse</label>
                <select
                  disabled={modalMode === 'edit'}
                  value={formData.warehouseId}
                  onChange={(e) => handleWarehouseChangeInForm(e.target.value)}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.code} &mdash; {w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Storage Location Bin</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                >
                  {modalLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.code} &mdash; {l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  />
                </div>
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
                  {isSubmitting ? 'SAVING...' : 'SAVE RECORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && itemToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-red-700 rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#b91c1c]">
            <h3 className="text-xl font-black text-stone-900 uppercase">Remove Inventory Entry?</h3>
            <p className="font-mono text-xs text-stone-700 mt-2">
              Are you sure you want to remove the inventory balance for <strong>{itemToDelete.productId?.name}</strong> at <strong>{itemToDelete.locationId?.code}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t-2 border-stone-900 font-mono text-xs">
              <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 border-2 border-stone-400 rounded">
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]"
              >
                {isDeleting ? 'REMOVING...' : 'CONFIRM REMOVAL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
