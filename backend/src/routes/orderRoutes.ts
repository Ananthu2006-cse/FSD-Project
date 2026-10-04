import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Order, OrderStatus } from '../models/Order';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/orders — List all orders with optional status filter
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('items.productId', 'name sku unitPrice')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Error retrieving orders.' });
  }
});

// GET /api/orders/:id — Single order details
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid order ID format.' });
    return;
  }
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name sku unitPrice')
      .populate('createdBy', 'name email role');
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Error retrieving order.' });
  }
});

// POST /api/orders — Create new order
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { customerName, items, dispatchBay, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'At least one order line item is required.' });
    return;
  }

  try {
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const line of items) {
      if (!line.productId || !mongoose.isValidObjectId(line.productId)) {
        res.status(400).json({ message: 'Invalid product ID in order line item.' });
        return;
      }
      const qty = Number(line.quantity);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ message: 'Order line item quantity must be at least 1.' });
        return;
      }

      const product = await Product.findById(line.productId);
      if (!product) {
        res.status(404).json({ message: `Product ${line.productId} does not exist.` });
        return;
      }

      const unitPrice = Number(product.unitPrice);
      calculatedTotal += unitPrice * qty;

      validatedItems.push({
        productId: product._id,
        quantity: qty,
        unitPrice,
      });
    }

    // Generate unique order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const order = new Order({
      orderNumber,
      customerName: customerName ? String(customerName).trim() : 'Warehouse Client',
      items: validatedItems,
      totalAmount: calculatedTotal,
      status: 'PENDING',
      dispatchBay: dispatchBay || 'Bay 01',
      notes: notes || '',
      createdBy: req.user?._id,
    });

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('items.productId', 'name sku unitPrice')
      .populate('createdBy', 'name email role');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating order.' });
  }
});

// PATCH /api/orders/:id/status — Status workflow transition
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid order ID format.' });
    return;
  }

  const { status, dispatchBay } = req.body;
  const validTransitions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PICKING', 'READY', 'DISPATCHED', 'CANCELLED'];

  if (!status || !validTransitions.includes(status)) {
    res.status(400).json({ message: `Invalid status. Must be one of: ${validTransitions.join(', ')}` });
    return;
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    if (order.status === 'DISPATCHED' || order.status === 'CANCELLED') {
      res.status(400).json({ message: `Cannot change status of an already ${order.status} order.` });
      return;
    }

    // When confirming, check inventory availability
    if (status === 'CONFIRMED') {
      for (const item of order.items) {
        const inventoryRecords = await Inventory.find({ productId: item.productId });
        const totalAvailable = inventoryRecords.reduce((sum, inv) => sum + inv.quantity, 0);
        if (totalAvailable < item.quantity) {
          const prod = await Product.findById(item.productId);
          res.status(400).json({
            message: `Insufficient inventory to confirm order. Product "${prod?.name || item.productId}" requires ${item.quantity}, but only ${totalAvailable} available across all locations.`,
          });
          return;
        }
      }
    }

    // When dispatching, deduct stock from available inventory records
    if (status === 'DISPATCHED') {
      for (const item of order.items) {
        let remainingNeeded = item.quantity;
        const inventories = await Inventory.find({ productId: item.productId, quantity: { $gt: 0 } }).sort({ quantity: -1 });

        for (const inv of inventories) {
          if (remainingNeeded <= 0) break;
          if (inv.quantity >= remainingNeeded) {
            inv.quantity -= remainingNeeded;
            remainingNeeded = 0;
            await inv.save();
          } else {
            remainingNeeded -= inv.quantity;
            inv.quantity = 0;
            await inv.save();
          }
        }
      }
    }

    order.status = status;
    if (dispatchBay) {
      order.dispatchBay = String(dispatchBay).trim();
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('items.productId', 'name sku unitPrice')
      .populate('createdBy', 'name email role');

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating order status.' });
  }
});

export default router;
