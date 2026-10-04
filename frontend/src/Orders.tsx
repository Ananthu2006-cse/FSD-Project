import React, { useEffect, useState } from 'react';
import {
  OrderRecord,
  OrderFormData,
  Product,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  fetchProducts,
} from './api';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    items: [{ productId: '', quantity: 1 }],
    dispatchBay: 'Bay 01',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordData, prodData] = await Promise.all([
        fetchOrders(),
        fetchProducts(),
      ]);
      setOrders(ordData);
      setProducts(prodData);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      customerName: '',
      items: [{ productId: products.length > 0 ? products[0].id : '', quantity: 1 }],
      dispatchBay: 'Bay 01',
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: products.length > 0 ? products[0].id : '', quantity: 1 }],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setFormErrors({ customerName: 'Customer name is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder(formData);
      setSuccessMessage('Order created and registered in PENDING queue.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsModalOpen(false);
      const updated = await fetchOrders();
      setOrders(updated);
    } catch (err: any) {
      setFormErrors({ general: err.response?.data?.message || 'Failed to create order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string, bay?: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus, bay);
      setSuccessMessage(`Order updated to ${nextStatus}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      const updated = await fetchOrders();
      setOrders(updated);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update order status.');
      setTimeout(() => setErrorMessage(''), 6000);
    }
  };

  const filteredOrders = orders.filter((o) => {
    return statusFilter === 'ALL' || o.status === statusFilter;
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
              MOD-ORD-06
            </span>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 9 &bull; Order Fulfillment Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
            Order Fulfillment Queue
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1 uppercase">
            Pending &rarr; Confirmed &rarr; Picking &rarr; Ready &rarr; Dispatched
          </p>
        </div>

        <button
          onClick={openModal}
          className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-mono text-xs font-black px-4 py-2.5 rounded border-2 border-stone-900 shadow-[3px_3px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span>+</span>
          <span>CREATE FULFILLMENT ORDER</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-3 shadow-[4px_4px_0px_0px_#1c1917] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PENDING', 'CONFIRMED', 'PICKING', 'READY', 'DISPATCHED', 'CANCELLED'].map((st) => (
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
          {filteredOrders.length} orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center bg-[#fffdf7] border-2 border-stone-900 rounded-lg">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="font-mono text-xs text-stone-600 uppercase">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-stone-500 uppercase bg-[#fffdf7] border-2 border-stone-900 rounded-lg">
            No orders match the current filter.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#fffdf7] border-2 border-stone-900 rounded-lg p-5 shadow-[4px_4px_0px_0px_#1c1917]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                        order.status === 'PENDING'
                          ? 'bg-stone-200 text-stone-800'
                          : order.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : order.status === 'PICKING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : order.status === 'READY'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : order.status === 'DISPATCHED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="font-mono text-xs text-stone-500">
                      📍 {order.dispatchBay}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-stone-900 uppercase mt-1">
                    Client: {order.customerName}
                  </h3>
                  {order.notes && (
                    <p className="font-mono text-xs text-stone-600 mt-0.5">
                      Notes: {order.notes}
                    </p>
                  )}
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-black text-stone-950">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-[10px] text-stone-500 uppercase">
                      <th className="py-1">Item Description</th>
                      <th className="py-1">SKU</th>
                      <th className="py-1 text-center">Quantity</th>
                      <th className="py-1 text-right">Unit Price</th>
                      <th className="py-1 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {order.items.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-bold text-stone-900">{line.productId?.name || 'Item'}</td>
                        <td className="py-1.5 text-stone-600">{line.productId?.sku || 'SKU'}</td>
                        <td className="py-1.5 text-center font-bold">{line.quantity}</td>
                        <td className="py-1.5 text-right">${line.unitPrice.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold">${(line.quantity * line.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Workflow Actions */}
              <div className="mt-4 pt-3 border-t border-dashed border-stone-300 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="text-[11px] text-stone-500">
                  {order.status === 'PENDING' && 'Pending inventory confirmation check.'}
                  {order.status === 'CONFIRMED' && 'Stock confirmed available. Ready for floor picking.'}
                  {order.status === 'PICKING' && 'Warehouse operators actively picking units.'}
                  {order.status === 'READY' && 'Staged in bay. Ready for carrier manifest dispatch.'}
                  {order.status === 'DISPATCHED' && '✓ Outbound shipment complete.'}
                  {order.status === 'CANCELLED' && '✕ Order cancelled.'}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusTransition(order.id, 'CONFIRMED')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded"
                      >
                        CONFIRM ORDER &rarr;
                      </button>
                      <button
                        onClick={() => handleStatusTransition(order.id, 'CANCELLED')}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded"
                      >
                        CANCEL
                      </button>
                    </>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusTransition(order.id, 'PICKING')}
                      className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-3 py-1.5 rounded"
                    >
                      START PICKING &rarr;
                    </button>
                  )}

                  {order.status === 'PICKING' && (
                    <button
                      onClick={() => handleStatusTransition(order.id, 'READY')}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded"
                    >
                      MARK STAGED &amp; READY &rarr;
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleStatusTransition(order.id, 'DISPATCHED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded shadow"
                    >
                      CONFIRM DISPATCH &amp; DEDUCT STOCK &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg max-w-xl w-full p-6 shadow-[8px_8px_0px_0px_#1c1917] relative">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <h3 className="text-xl font-black text-stone-900 uppercase">New Fulfillment Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="font-mono font-bold text-stone-700 hover:text-black">✕</button>
            </div>

            {formErrors.general && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 font-mono text-xs p-3 rounded mb-4">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-stone-800 uppercase mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Logistics Distribution"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                />
                {formErrors.customerName && <p className="text-red-600 text-[11px] mt-1">{formErrors.customerName}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800 uppercase">Order Line Items</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="font-bold text-amber-700 hover:text-amber-900 underline"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#fcfaf2] p-2 border border-stone-300 rounded">
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 bg-white border border-stone-400 p-1.5 rounded"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} &mdash; {p.name} (${p.unitPrice})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-20 bg-white border border-stone-400 p-1.5 rounded text-center"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-red-600 font-bold px-2 py-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Dispatch Bay</label>
                  <input
                    type="text"
                    value={formData.dispatchBay}
                    onChange={(e) => setFormData({ ...formData, dispatchBay: e.target.value })}
                    className="w-full bg-[#fcfaf2] border-2 border-stone-900 p-2 rounded focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 uppercase mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Delivery instructions..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {isSubmitting ? 'CREATING...' : 'SUBMIT ORDER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
