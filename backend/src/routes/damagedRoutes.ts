import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { DamagedStock } from '../models/DamagedStock';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { Warehouse } from '../models/Warehouse';
import { Location } from '../models/Location';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/damaged — View all damaged stock records
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const records = await DamagedStock.find()
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch {
    res.status(500).json({ message: 'Error retrieving damaged stock reports.' });
  }
});

// POST /api/damaged — Report damaged stock & deduct from usable inventory
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { productId, warehouseId, locationId, quantity, reason } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400).json({ message: 'Valid product reference is required.' });
    return;
  }
  if (!warehouseId || !mongoose.isValidObjectId(warehouseId)) {
    res.status(400).json({ message: 'Valid warehouse reference is required.' });
    return;
  }
  if (!locationId || !mongoose.isValidObjectId(locationId)) {
    res.status(400).json({ message: 'Valid location reference is required.' });
    return;
  }
  if (!reason || !String(reason).trim()) {
    res.status(400).json({ message: 'Reason for damage report is required.' });
    return;
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    res.status(400).json({ message: 'Quantity must be at least 1 unit.' });
    return;
  }

  try {
    // Check inventory balance
    const inventory = await Inventory.findOne({ productId, warehouseId, locationId });
    if (!inventory || inventory.quantity < numQty) {
      const avail = inventory ? inventory.quantity : 0;
      res.status(400).json({
        message: `Cannot report ${numQty} damaged units. Only ${avail} units exist at this location.`,
      });
      return;
    }

    // Deduct from usable inventory
    inventory.quantity -= numQty;
    await inventory.save();

    // Create damaged record
    const damaged = new DamagedStock({
      productId,
      warehouseId,
      locationId,
      quantity: numQty,
      reason: String(reason).trim(),
      reportedBy: req.user?._id,
      status: 'REPORTED',
    });
    await damaged.save();

    const populated = await DamagedStock.findById(damaged._id)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('reportedBy', 'name email role');

    res.status(201).json({
      damaged: populated,
      remainingInventory: inventory.quantity,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error logging damaged stock.' });
  }
});

// PATCH /api/damaged/:id/resolve — Resolve damaged report (ADMIN, MANAGER)
router.patch('/:id/resolve', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid damaged record ID.' });
    return;
  }

  try {
    const record = await DamagedStock.findById(req.params.id);
    if (!record) {
      res.status(404).json({ message: 'Damaged stock record not found.' });
      return;
    }

    record.status = 'RESOLVED';
    if (req.body.resolutionNotes) {
      record.resolutionNotes = String(req.body.resolutionNotes).trim();
    }
    await record.save();

    const populated = await DamagedStock.findById(record._id)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('reportedBy', 'name email role');

    res.json(populated);
  } catch {
    res.status(500).json({ message: 'Error resolving damaged stock.' });
  }
});

export default router;
