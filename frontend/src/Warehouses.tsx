import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Warehouse,
  WarehouseFormData,
  LocationItem,
  LocationFormData,
  fetchWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  fetchLocationsByWarehouse,
  createLocation,
  updateLocation,
  deleteLocation,
} from './api';

const DEFAULT_WAREHOUSE_FORM: WarehouseFormData = {
  name: '',
  code: '',
  address: '',
  description: '',
  status: 'ACTIVE',
};

const DEFAULT_LOCATION_FORM: LocationFormData = {
  warehouseId: '',
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
};

export const Warehouses: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  // Warehouses state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState<boolean>(true);
  const [warehouseSearch, setWarehouseSearch] = useState<string>('');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Locations state
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(false);
  const [locationSearch, setLocationSearch] = useState<string>('');

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Warehouse Modal state
  const [isWhModalOpen, setIsWhModalOpen] = useState<boolean>(false);
  const [whModalMode, setWhModalMode] = useState<'create' | 'edit'>('create');
  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [whFormData, setWhFormData] = useState<WarehouseFormData>(DEFAULT_WAREHOUSE_FORM);
  const [whFormErrors, setWhFormErrors] = useState<Record<string, string>>({});
  const [isWhSubmitting, setIsWhSubmitting] = useState<boolean>(false);

  // Warehouse Delete Dialog
  const [isWhDeleteOpen, setIsWhDeleteOpen] = useState<boolean>(false);
  const [whToDelete, setWhToDelete] = useState<Warehouse | null>(null);
  const [isWhDeleting, setIsWhDeleting] = useState<boolean>(false);

  // Location Modal state
  const [isLocModalOpen, setIsLocModalOpen] = useState<boolean>(false);
  const [locModalMode, setLocModalMode] = useState<'create' | 'edit'>('create');
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [locFormData, setLocFormData] = useState<LocationFormData>(DEFAULT_LOCATION_FORM);
  const [locFormErrors, setLocFormErrors] = useState<Record<string, string>>({});
  const [isLocSubmitting, setIsLocSubmitting] = useState<boolean>(false);

  // Location Delete Dialog
  const [isLocDeleteOpen, setIsLocDeleteOpen] = useState<boolean>(false);
  const [locToDelete, setLocToDelete] = useState<LocationItem | null>(null);
  const [isLocDeleting, setIsLocDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const loadWarehouses = async () => {
    setLoadingWarehouses(true);
    setErrorMessage('');
    try {
      const data = await fetchWarehouses();
      setWarehouses(data);
      // Auto-select first warehouse if none selected
      if (data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(data[0]);
        loadLocations(data[0].id);
      } else if (selectedWarehouse) {
        // Refresh selected warehouse reference
        const current = data.find((w) => w.id === selectedWarehouse.id);
        if (current) {
          setSelectedWarehouse(current);
          loadLocations(current.id);
        } else if (data.length > 0) {
          setSelectedWarehouse(data[0]);
          loadLocations(data[0].id);
        } else {
          setSelectedWarehouse(null);
          setLocations([]);
        }
      }
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to load warehouses.');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadLocations = async (warehouseId: string) => {
    setLoadingLocations(true);
    try {
      const data = await fetchLocationsByWarehouse(warehouseId);
      setLocations(data);
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to load warehouse locations.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSelectWarehouse = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    loadLocations(wh.id);
  };

  // ─── WAREHOUSE ACTIONS ────────────────────────────────────────────────────────

  const openCreateWhModal = () => {
    setWhModalMode('create');
    setEditingWhId(null);
    setWhFormData(DEFAULT_WAREHOUSE_FORM);
    setWhFormErrors({});
    setIsWhModalOpen(true);
  };

  const openEditWhModal = (wh: Warehouse) => {
    setWhModalMode('edit');
    setEditingWhId(wh.id);
    setWhFormData({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
      description: wh.description || '',
      status: wh.status,
    });
    setWhFormErrors({});
    setIsWhModalOpen(true);
  };

  const validateWhForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!whFormData.name.trim()) errors.name = 'Warehouse name is required';
    if (!whFormData.code.trim()) errors.code = 'Warehouse code is required';
    setWhFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWhForm()) return;

    setIsWhSubmitting(true);
    try {
      if (whModalMode === 'create') {
        const created = await createWarehouse(whFormData);
        notifySuccess(`Warehouse "${created.name}" created successfully.`);
        setIsWhModalOpen(false);
        await loadWarehouses();
        setSelectedWarehouse(created);
        loadLocations(created.id);
      } else if (editingWhId) {
        const updated = await updateWarehouse(editingWhId, whFormData);
        notifySuccess(`Warehouse "${updated.name}" updated successfully.`);
        setIsWhModalOpen(false);
        await loadWarehouses();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Operation failed. Check inputs.';
      setWhFormErrors({ general: msg });
    } finally {
      setIsWhSubmitting(false);
    }
  };

  const handleDeleteWhConfirm = async () => {
    if (!whToDelete) return;
    setIsWhDeleting(true);
    try {
      await deleteWarehouse(whToDelete.id);
      notifySuccess(`Warehouse "${whToDelete.name}" and its locations were deleted.`);
      setIsWhDeleteOpen(false);
      setWhToDelete(null);
      if (selectedWarehouse?.id === whToDelete.id) {
        setSelectedWarehouse(null);
        setLocations([]);
      }
      await loadWarehouses();
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete warehouse.');
    } finally {
      setIsWhDeleting(false);
    }
  };

  // ─── LOCATION ACTIONS ─────────────────────────────────────────────────────────

  const openCreateLocModal = () => {
    if (!selectedWarehouse) {
      notifyError('Please select a warehouse first.');
      return;
    }
    setLocModalMode('create');
    setEditingLocId(null);
    setLocFormData({
      ...DEFAULT_LOCATION_FORM,
      warehouseId: selectedWarehouse.id,
    });
    setLocFormErrors({});
    setIsLocModalOpen(true);
  };

  const openEditLocModal = (loc: LocationItem) => {
    setLocModalMode('edit');
    setEditingLocId(loc.id);
    const wId = typeof loc.warehouseId === 'object' ? loc.warehouseId._id : loc.warehouseId;
    setLocFormData({
      warehouseId: wId || (selectedWarehouse?.id ?? ''),
      name: loc.name,
      code: loc.code,
      description: loc.description || '',
      status: loc.status,
    });
    setLocFormErrors({});
    setIsLocModalOpen(true);
  };

  const validateLocForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!locFormData.name.trim()) errors.name = 'Location name is required';
    if (!locFormData.code.trim()) errors.code = 'Location code is required';
    if (!locFormData.warehouseId) errors.warehouseId = 'Warehouse reference is required';
    setLocFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLocForm()) return;

    setIsLocSubmitting(true);
    try {
      if (locModalMode === 'create') {
        const created = await createLocation(locFormData);
        notifySuccess(`Storage location "${created.name}" created.`);
        setIsLocModalOpen(false);
        if (selectedWarehouse) loadLocations(selectedWarehouse.id);
      } else if (editingLocId) {
        const updated = await updateLocation(editingLocId, locFormData);
        notifySuccess(`Storage location "${updated.name}" updated.`);
        setIsLocModalOpen(false);
        if (selectedWarehouse) loadLocations(selectedWarehouse.id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Operation failed. Check inputs.';
      setLocFormErrors({ general: msg });
    } finally {
      setIsLocSubmitting(false);
    }
  };

  const handleDeleteLocConfirm = async () => {
    if (!locToDelete) return;
    setIsLocDeleting(true);
    try {
      await deleteLocation(locToDelete.id);
      notifySuccess(`Location "${locToDelete.name}" deleted.`);
      setIsLocDeleteOpen(false);
      setLocToDelete(null);
      if (selectedWarehouse) loadLocations(selectedWarehouse.id);
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete location.');
    } finally {
      setIsLocDeleting(false);
    }
  };

  // ─── FILTERED DATA ────────────────────────────────────────────────────────────

  const filteredWarehouses = warehouses.filter((wh) => {
    const matchesSearch =
      wh.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      wh.code.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      wh.address.toLowerCase().includes(warehouseSearch.toLowerCase());
    const matchesStatus = warehouseStatusFilter === 'ALL' || wh.status === warehouseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLocations = locations.filter((loc) => {
    return (
      loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.code.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.description.toLowerCase().includes(locationSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 selection:bg-amber-300 selection:text-black">
      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-100 border-2 border-emerald-700 text-emerald-950 p-4 rounded shadow-[3px_3px_0px_0px_#047857] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-ping" />
            <span className="font-bold uppercase tracking-wider">SUCCESS:</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-black hover:text-emerald-700">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border-2 border-red-700 text-red-950 p-4 rounded shadow-[3px_3px_0px_0px_#b91c1c] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider">ERROR:</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-black hover:text-red-700">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
              FACILITY // MOD-WAR-03
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 5 &bull; Warehouse &amp; Storage Locations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Warehouse Management
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Facility Registry &amp; Internal Storage Bin Hierarchy
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage ? (
            <button
              onClick={openCreateWhModal}
              className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-4 py-2.5 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] hover:shadow-[4px_4px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>+</span>
              <span>ADD WAREHOUSE</span>
            </button>
          ) : (
            <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-400 px-3 py-1.5 rounded">
              READ-ONLY CLEARANCE ({role})
            </span>
          )}
        </div>
      </div>

      {/* Grid: Left = Warehouses List, Right = Selected Warehouse & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Warehouses Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-4 shadow-[4px_4px_0px_0px_#1c1917]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                <span>Warehouses</span>
                <span className="font-mono text-[11px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-bold">
                  {filteredWarehouses.length}
                </span>
              </h2>
              <button
                onClick={loadWarehouses}
                className="font-mono text-[10px] text-stone-700 hover:text-black uppercase underline"
              >
                Refresh
              </button>
            </div>

            {/* Filter controls */}
            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Search warehouse code/name..."
                value={warehouseSearch}
                onChange={(e) => setWarehouseSearch(e.target.value)}
                className="w-full bg-[#fcfaf2] border-2 border-stone-900 px-3 py-1.5 font-mono text-xs rounded focus:outline-none focus:bg-white"
              />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-stone-600 uppercase">Status:</span>
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setWarehouseStatusFilter(st)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      warehouseStatusFilter === st
                        ? 'bg-stone-900 text-amber-300 border-stone-900 font-bold'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Warehouses List */}
            {loadingWarehouses ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="font-mono text-xs text-stone-600 uppercase">Loading facilities...</p>
              </div>
            ) : filteredWarehouses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-stone-300 rounded font-mono text-xs text-stone-500">
                No warehouses match the criteria.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredWarehouses.map((wh) => {
                  const isSelected = selectedWarehouse?.id === wh.id;
                  return (
                    <div
                      key={wh.id}
                      onClick={() => handleSelectWarehouse(wh)}
                      className={`p-3.5 rounded border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/90 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917]'
                          : 'bg-white border-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold bg-stone-900 text-amber-300 px-1.5 py-0.5 rounded">
                              {wh.code}
                            </span>
                            <span
                              className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                wh.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-stone-200 text-stone-600 border border-stone-300'
                              }`}
                            >
                              {wh.status}
                            </span>
                          </div>
                          <h3 className="font-black text-stone-900 text-sm mt-1 uppercase">
                            {wh.name}
                          </h3>
                        </div>

                        {/* Actions */}
                        {canManage && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditWhModal(wh)}
                              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                              title="Edit warehouse"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setWhToDelete(wh);
                                setIsWhDeleteOpen(true);
                              }}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Delete warehouse"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {wh.address && (
                        <p className="font-mono text-[11px] text-stone-600 mt-2 truncate">
                          📍 {wh.address}
                        </p>
                      )}
                      {wh.description && (
                        <p className="font-mono text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                          {wh.description}
                        </p>
                      )}

                      <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-500">
                        <span>Click to view storage bins</span>
                        <span className="font-bold">{isSelected ? 'Active Selection ▶' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Locations Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]">
            {selectedWarehouse ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-stone-900 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 uppercase">
                        Active Facility
                      </span>
                      <span className="font-mono text-xs font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
                        {selectedWarehouse.code}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-stone-900 uppercase mt-0.5">
                      {selectedWarehouse.name}
                    </h2>
                    {selectedWarehouse.address && (
                      <p className="font-mono text-xs text-stone-600 mt-0.5">
                        {selectedWarehouse.address}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <button
                      onClick={openCreateLocModal}
                      className="bg-stone-900 hover:bg-stone-800 text-amber-300 font-mono text-xs font-bold px-3.5 py-2 rounded shadow-[2px_2px_0px_0px_#d97706] hover:shadow-[3px_3px_0px_0px_#d97706] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                    >
                      <span>+</span>
                      <span>ADD STORAGE LOCATION</span>
                    </button>
                  )}
                </div>

                {/* Locations Search & Stats */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Filter locations in this warehouse..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full bg-[#fcfaf2] border-2 border-stone-900 px-3 py-1.5 font-mono text-xs rounded focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="font-mono text-xs font-bold text-stone-700 uppercase whitespace-nowrap">
                    {filteredLocations.length} locations
                  </div>
                </div>

                {/* Locations Table */}
                {loadingLocations ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="font-mono text-xs text-stone-600 uppercase">Loading locations...</p>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded">
                    <p className="font-mono text-xs text-stone-500 uppercase">
                      No storage locations recorded in this warehouse.
                    </p>
                    {canManage && (
                      <button
                        onClick={openCreateLocModal}
                        className="mt-3 font-mono text-xs font-bold text-amber-700 hover:text-amber-900 underline uppercase"
                      >
                        + Create the first storage location
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto border-2 border-stone-900 rounded">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-stone-900 text-stone-100 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Bin Code</th>
                          <th className="py-2.5 px-3">Location Name</th>
                          <th className="py-2.5 px-3">Description / Zone</th>
                          <th className="py-2.5 px-3">Status</th>
                          {canManage && <th className="py-2.5 px-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-300 bg-white">
                        {filteredLocations.map((loc) => (
                          <tr key={loc.id} className="hover:bg-amber-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-black text-stone-900">
                              <span className="bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded">
                                {loc.code}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-stone-800 uppercase">
                              {loc.name}
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">
                              {loc.description || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  loc.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-stone-200 text-stone-600 border border-stone-300'
                                }`}
                              >
                                {loc.status}
                              </span>
                            </td>
                            {canManage && (
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => openEditLocModal(loc)}
                                  className="text-stone-700 hover:text-black font-bold mr-3 underline"
                                >
                                  EDIT
                                </button>
                                <button
                                  onClick={() => {
                                    setLocToDelete(loc);
                                    setIsLocDeleteOpen(true);
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
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="font-mono text-sm text-stone-500 uppercase">
                  Select a warehouse from the left to manage storage locations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: CREATE / EDIT WAREHOUSE ─────────────────────────────────────── */}
      {isWhModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
                  {whModalMode === 'create' ? 'NEW RECORD' : 'UPDATE RECORD'}
                </span>
                <h3 className="text-xl font-black text-stone-900 uppercase mt-1">
                  {whModalMode === 'create' ? 'Register Warehouse' : 'Edit Warehouse'}
                </h3>
              </div>
              <button
                onClick={() => setIsWhModalOpen(false)}
                className="font-mono font-bold text-stone-700 hover:text-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {whFormErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {whFormErrors.general}
              </div>
            )}

            <form onSubmit={handleWhSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Warehouse Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={whFormData.name}
                  onChange={(e) => setWhFormData({ ...whFormData, name: e.target.value })}
                  placeholder="e.g. West Coast Hub"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                />
                {whFormErrors.name && (
                  <p className="font-mono text-[11px] text-red-600 mt-1">{whFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Warehouse Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={whFormData.code}
                  onChange={(e) => setWhFormData({ ...whFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WH-003"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white uppercase"
                />
                {whFormErrors.code && (
                  <p className="font-mono text-[11px] text-red-600 mt-1">{whFormErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Address / Physical Location
                </label>
                <input
                  type="text"
                  value={whFormData.address}
                  onChange={(e) => setWhFormData({ ...whFormData, address: e.target.value })}
                  placeholder="e.g. 45 Logistics Ave, Dock 4"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Description / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={whFormData.description}
                  onChange={(e) => setWhFormData({ ...whFormData, description: e.target.value })}
                  placeholder="Primary temperature-controlled warehouse..."
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Status
                </label>
                <select
                  value={whFormData.status}
                  onChange={(e) => setWhFormData({ ...whFormData, status: e.target.value as any })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white uppercase"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-stone-900">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 font-mono text-xs font-bold text-stone-700 hover:text-black border-2 border-stone-400 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isWhSubmitting}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isWhSubmitting ? 'SAVING...' : whModalMode === 'create' ? 'CREATE WAREHOUSE' : 'UPDATE WAREHOUSE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE WAREHOUSE CONFIRM ────────────────────────────────────── */}
      {isWhDeleteOpen && whToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-red-700 rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#b91c1c]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold bg-red-700 text-white px-2 py-0.5 rounded uppercase">
                DESTRUCTIVE ACTION
              </span>
            </div>
            <h3 className="text-xl font-black text-stone-900 uppercase">
              Delete Warehouse?
            </h3>
            <p className="font-mono text-xs text-stone-700 mt-2">
              Are you sure you want to delete <span className="font-bold underline">{whToDelete.name}</span> ({whToDelete.code})?
            </p>
            <div className="bg-amber-50 border border-amber-300 p-3 rounded mt-3 font-mono text-[11px] text-amber-900">
              ⚠️ <strong>Warning:</strong> Deleting this warehouse will automatically delete all of its internal storage locations.
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t-2 border-stone-900">
              <button
                type="button"
                onClick={() => {
                  setIsWhDeleteOpen(false);
                  setWhToDelete(null);
                }}
                className="px-4 py-2 font-mono text-xs font-bold text-stone-700 hover:text-black border-2 border-stone-400 rounded"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteWhConfirm}
                disabled={isWhDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isWhDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT LOCATION ──────────────────────────────────────── */}
      {isLocModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
                  {locModalMode === 'create' ? 'NEW STORAGE BIN' : 'UPDATE STORAGE BIN'}
                </span>
                <h3 className="text-xl font-black text-stone-900 uppercase mt-1">
                  {locModalMode === 'create' ? 'Create Storage Location' : 'Edit Storage Location'}
                </h3>
              </div>
              <button
                onClick={() => setIsLocModalOpen(false)}
                className="font-mono font-bold text-stone-700 hover:text-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {locFormErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {locFormErrors.general}
              </div>
            )}

            <form onSubmit={handleLocSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Warehouse Facility <span className="text-red-600">*</span>
                </label>
                <select
                  value={locFormData.warehouseId}
                  onChange={(e) => setLocFormData({ ...locFormData, warehouseId: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
                {locFormErrors.warehouseId && (
                  <p className="font-mono text-[11px] text-red-600 mt-1">{locFormErrors.warehouseId}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Location Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={locFormData.code}
                  onChange={(e) => setLocFormData({ ...locFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. A-01, RACK-B3"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white uppercase"
                />
                {locFormErrors.code && (
                  <p className="font-mono text-[11px] text-red-600 mt-1">{locFormErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Location Name / Label <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={locFormData.name}
                  onChange={(e) => setLocFormData({ ...locFormData, name: e.target.value })}
                  placeholder="e.g. Aisle A - Shelf 01"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                />
                {locFormErrors.name && (
                  <p className="font-mono text-[11px] text-red-600 mt-1">{locFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Description / Subzone
                </label>
                <textarea
                  rows={2}
                  value={locFormData.description}
                  onChange={(e) => setLocFormData({ ...locFormData, description: e.target.value })}
                  placeholder="e.g. Bulk pallet storage for inbound deliveries"
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Status
                </label>
                <select
                  value={locFormData.status}
                  onChange={(e) => setLocFormData({ ...locFormData, status: e.target.value as any })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 font-mono text-xs rounded focus:outline-none focus:bg-white uppercase"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-stone-900">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 font-mono text-xs font-bold text-stone-700 hover:text-black border-2 border-stone-400 rounded"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLocSubmitting}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isLocSubmitting ? 'SAVING...' : locModalMode === 'create' ? 'CREATE LOCATION' : 'UPDATE LOCATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE LOCATION CONFIRM ─────────────────────────────────────── */}
      {isLocDeleteOpen && locToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-red-700 rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#b91c1c]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold bg-red-700 text-white px-2 py-0.5 rounded uppercase">
                CONFIRM DELETION
              </span>
            </div>
            <h3 className="text-xl font-black text-stone-900 uppercase">
              Delete Location?
            </h3>
            <p className="font-mono text-xs text-stone-700 mt-2">
              Are you sure you want to delete storage location <span className="font-bold underline">{locToDelete.name}</span> ({locToDelete.code})?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t-2 border-stone-900">
              <button
                type="button"
                onClick={() => {
                  setIsLocDeleteOpen(false);
                  setLocToDelete(null);
                }}
                className="px-4 py-2 font-mono text-xs font-bold text-stone-700 hover:text-black border-2 border-stone-400 rounded"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteLocConfirm}
                disabled={isLocDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-black px-5 py-2 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isLocDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
