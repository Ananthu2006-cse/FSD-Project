import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Product,
  ProductFormData,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './api';
import axios from 'axios';

const DEFAULT_FORM: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  category: '',
  unitPrice: '',
  quantity: '',
  status: 'ACTIVE',
};

export const Products: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  };

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingProductId(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setModalMode('edit');
    setEditingProductId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      category: p.category,
      unitPrice: p.unitPrice,
      quantity: p.quantity,
      status: p.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (p: Product) => {
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'PRODUCT NAME IS REQUIRED';
    if (!formData.sku.trim()) errors.sku = 'SKU CODE IS REQUIRED';
    if (!formData.category.trim()) errors.category = 'CATEGORY IS REQUIRED';

    const price = Number(formData.unitPrice);
    if (formData.unitPrice === '' || isNaN(price) || price < 0) {
      errors.unitPrice = 'PRICE MUST BE A VALID NON-NEGATIVE NUMBER';
    }

    const qty = Number(formData.quantity);
    if (formData.quantity === '' || isNaN(qty) || qty < 0) {
      errors.quantity = 'QUANTITY MUST BE A VALID NON-NEGATIVE NUMBER';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (modalMode === 'create') {
        const created = await createProduct({
          ...formData,
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category.trim(),
          unitPrice: Number(formData.unitPrice),
          quantity: Number(formData.quantity),
        });
        notifySuccess(`Product "${created.name}" [${created.sku}] registered successfully.`);
      } else if (editingProductId) {
        const updated = await updateProduct(editingProductId, {
          ...formData,
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category.trim(),
          unitPrice: Number(formData.unitPrice),
          quantity: Number(formData.quantity),
        });
        notifySuccess(`Product "${updated.name}" [${updated.sku}] updated successfully.`);
      }
      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to save product.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      notifySuccess(`Product "${productToDelete.name}" [${productToDelete.sku}] removed.`);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute Categories for Filter
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;

    const matchesCategory =
      selectedCategory === 'ALL' || p.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="selection:bg-amber-300 selection:text-black space-y-6">
      {/* Top Banner Card */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917]">
        <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b-2 border-dashed border-stone-300">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-stone-900 text-amber-300 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded uppercase">
                MOD-PRD-02
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Clearance: {role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
              Product Management
            </h1>
            <p className="font-mono text-xs text-stone-600 uppercase mt-1">
              Item Specification Registry &bull; Master SKU Directory &bull; Stock Unit Ledger
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 text-stone-950 font-mono font-black text-xs sm:text-sm tracking-wider uppercase border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917] transition-all flex items-center gap-2"
              >
                <span>+ ADD PRODUCT</span>
              </button>
            )}
            <button
              onClick={loadProducts}
              className="px-3 py-2.5 bg-[#f4eedb] hover:bg-stone-200 active:translate-x-0.5 active:translate-y-0.5 text-stone-800 font-mono font-bold text-xs uppercase border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] transition-all"
              title="Refresh Products"
            >
              [ Refresh ]
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mt-4 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 px-4 py-2.5 rounded font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#047857] flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-100 border-2 border-red-700 text-red-900 px-4 py-2.5 rounded font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#b91c1c] flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-5">
            <label className="block font-mono text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Search by Name or SKU
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. Pallet or PLT-EUR..."
                className="w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-800 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <label className="block font-mono text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 transition-all uppercase"
            >
              <option value="ALL">ALL CATEGORIES ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label className="block font-mono text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 transition-all uppercase"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ACTIVE">ACTIVE ONLY</option>
              <option value="INACTIVE">INACTIVE ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 shadow-[6px_6px_0px_0px_#1c1917]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-black text-stone-900 uppercase tracking-tight">
              Catalogue Directory
            </h2>
            <p className="font-mono text-xs text-stone-600 uppercase">
              Showing {filteredProducts.length} of {products.length} registered items
            </p>
          </div>

          {!canManage && (
            <div className="inline-block bg-stone-100 border border-stone-400 text-stone-600 font-mono text-[10px] font-bold px-2 py-1 rounded uppercase">
              Floor Staff: Read-Only Clearance
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-sm text-stone-600">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            Scanning Product Ledger...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center font-mono border-2 border-dashed border-stone-300 rounded p-6 bg-[#fdfbf7]">
            <p className="text-stone-700 font-bold uppercase text-sm mb-2">No matching products found</p>
            <p className="text-stone-500 text-xs">
              Try adjusting your search criteria, or {canManage ? 'create a new product' : 'contact an administrator'}.
            </p>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="mt-4 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 border-2 border-stone-900 rounded text-xs font-bold uppercase shadow-[2px_2px_0px_0px_#1c1917]"
              >
                + Register First Product
              </button>
            )}
          </div>
        ) : (
          <div className="border-2 border-stone-900 rounded overflow-x-auto shadow-[3px_3px_0px_0px_#1c1917]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-stone-900 text-amber-300 uppercase border-b-2 border-stone-900">
                <tr>
                  <th className="py-3 px-4 font-black">SKU</th>
                  <th className="py-3 px-4 font-black">Product Details</th>
                  <th className="py-3 px-4 font-black">Category</th>
                  <th className="py-3 px-4 font-black text-right">Unit Price</th>
                  <th className="py-3 px-4 font-black text-right">Stock Qty</th>
                  <th className="py-3 px-4 font-black text-center">Status</th>
                  {canManage && <th className="py-3 px-4 font-black text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-[#fdfbf7]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50 transition-colors">
                    {/* SKU */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-black bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase shadow-[1px_1px_0px_0px_#1c1917] inline-block">
                        {p.sku}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td className="py-3 px-4">
                      <div className="font-black text-stone-950 uppercase">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-stone-500 font-sans line-clamp-1 max-w-xs">
                          {p.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="bg-stone-100 border border-stone-400 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {p.category}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-4 font-black text-stone-900 text-right">
                      ${p.unitPrice.toFixed(2)}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black ${
                          p.quantity === 0
                            ? 'text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-400'
                            : p.quantity < 20
                            ? 'text-amber-800 font-bold'
                            : 'text-stone-900'
                        }`}
                      >
                        {p.quantity} units
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-600'
                            : 'bg-red-100 text-red-800 border border-red-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                        {p.status}
                      </span>
                    </td>

                    {/* Actions (Admin / Manager) */}
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="px-2.5 py-1 bg-[#f4eedb] hover:bg-amber-200 border border-stone-800 rounded text-[11px] font-bold uppercase shadow-[1px_1px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(p)}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 border border-red-800 text-red-900 rounded text-[11px] font-bold uppercase shadow-[1px_1px_0px_0px_#991b1b] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-4 border-t-2 border-dashed border-stone-300 flex items-center justify-between text-stone-500 font-mono text-[11px] flex-wrap gap-2">
          <span>// RBAC: {canManage ? 'Full CRUD (ADMIN/MANAGER)' : 'Read-Only (STAFF)'}</span>
          <span>Phase 4 &bull; Product Management Module</span>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-stone-300 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase">
                  {modalMode === 'create' ? 'MOD-PRD-REG' : 'MOD-PRD-UPD'}
                </span>
                <h3 className="text-lg font-black text-stone-900 uppercase mt-1">
                  {modalMode === 'create' ? 'Register New Product' : 'Edit Product Specifications'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 border-2 border-stone-900 rounded bg-[#f4eedb] hover:bg-stone-200 font-mono font-bold text-xs flex items-center justify-center shadow-[1px_1px_0px_0px_#1c1917]"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {/* Product Name */}
              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  placeholder="e.g. Heavy Duty Pallet"
                  className={`w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 ${
                    formErrors.name ? 'border-red-600 bg-red-50' : ''
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 font-mono text-[10px] font-bold text-red-600">&gt; {formErrors.name}</p>
                )}
              </div>

              {/* SKU & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => {
                      setFormData({ ...formData, sku: e.target.value.toUpperCase() });
                      if (formErrors.sku) setFormErrors({ ...formErrors, sku: '' });
                    }}
                    placeholder="e.g. PLT-EUR-001"
                    className={`w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] uppercase focus:outline-none focus:bg-white focus:border-amber-600 ${
                      formErrors.sku ? 'border-red-600 bg-red-50' : ''
                    }`}
                  />
                  {formErrors.sku && (
                    <p className="mt-1 font-mono text-[10px] font-bold text-red-600">&gt; {formErrors.sku}</p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (formErrors.category) setFormErrors({ ...formErrors, category: '' });
                    }}
                    placeholder="e.g. Storage & Pallets"
                    className={`w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 ${
                      formErrors.category ? 'border-red-600 bg-red-50' : ''
                    }`}
                  />
                  {formErrors.category && (
                    <p className="mt-1 font-mono text-[10px] font-bold text-red-600">&gt; {formErrors.category}</p>
                  )}
                </div>
              </div>

              {/* Price & Quantity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, unitPrice: e.target.value });
                      if (formErrors.unitPrice) setFormErrors({ ...formErrors, unitPrice: '' });
                    }}
                    placeholder="0.00"
                    className={`w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 ${
                      formErrors.unitPrice ? 'border-red-600 bg-red-50' : ''
                    }`}
                  />
                  {formErrors.unitPrice && (
                    <p className="mt-1 font-mono text-[10px] font-bold text-red-600">&gt; {formErrors.unitPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                    Quantity in Stock *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: '' });
                    }}
                    placeholder="0"
                    className={`w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600 ${
                      formErrors.quantity ? 'border-red-600 bg-red-50' : ''
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="mt-1 font-mono text-[10px] font-bold text-red-600">&gt; {formErrors.quantity}</p>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Product Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`py-1.5 text-xs font-mono font-bold uppercase border-2 border-stone-900 rounded transition-all ${
                        formData.status === s
                          ? s === 'ACTIVE'
                            ? 'bg-emerald-400 text-stone-950 shadow-[2px_2px_0px_0px_#1c1917]'
                            : 'bg-red-400 text-stone-950 shadow-[2px_2px_0px_0px_#1c1917]'
                          : 'bg-[#f4eedb] text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-xs font-bold text-stone-800 uppercase mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional technical specifications or bin location notes..."
                  className="w-full font-mono text-xs px-3 py-2 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] focus:outline-none focus:bg-white focus:border-amber-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-dashed border-stone-300">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#f4eedb] hover:bg-stone-200 border-2 border-stone-900 rounded font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#1c1917]"
                >
                  [ Cancel ]
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 text-stone-950 border-2 border-stone-900 rounded font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_#1c1917] disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>[ {modalMode === 'create' ? 'REGISTER PRODUCT' : 'SAVE CHANGES'} ]</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────────────────── */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#1c1917]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-400 border-2 border-stone-900 flex items-center justify-center text-stone-950 font-bold text-lg shadow-[2px_2px_0px_0px_#1c1917]">
                ⚠
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded border border-red-800 uppercase">
                  CONFIRM DELETION
                </span>
                <h3 className="text-base font-black text-stone-900 uppercase">Delete Product?</h3>
              </div>
            </div>

            <p className="font-mono text-xs text-stone-700 mb-4">
              Are you sure you want to delete <strong className="text-stone-950 font-black">{productToDelete.name}</strong> (SKU: <code className="bg-stone-200 px-1 py-0.5 rounded">{productToDelete.sku}</code>)? This action will permanently remove this item from the warehouse catalogue.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-stone-300">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#f4eedb] hover:bg-stone-200 border-2 border-stone-900 rounded font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#1c1917]"
              >
                [ Cancel ]
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white border-2 border-stone-900 rounded font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_#1c1917] disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : '[ CONFIRM DELETE ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
