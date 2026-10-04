import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { Warehouse } from '../models/Warehouse';
import { Location } from '../models/Location';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/inventory — View all with optional filters (search, warehouseId, status)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { warehouseId, status } = req.query;
    const filter: any = {};

    if (warehouseId && mongoose.isValidObjectId(warehouseId as string)) {
      filter.warehouseId = warehouseId;
    }
    if (status && ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].includes(status as string)) {
      filter.status = status;
    }

    const inventory = await Inventory.find(filter)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .sort({ updatedAt: -1 });

    res.json(inventory);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving inventory records.' });
  }
});

// GET /api/inventory/:id — View single record
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid inventory ID format.' });
    return;
  }
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code');
    if (!item) {
      res.status(404).json({ message: 'Inventory record not found.' });
      return;
    }
    res.json(item);
  } catch {
    res.status(500).json({ message: 'Error retrieving inventory record.' });
  }
});

// POST /api/inventory — Create inventory record (ADMIN, MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { productId, warehouseId, locationId, quantity, minimumStock } = req.body;

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

  const [productExists, warehouseExists, locationExists] = await Promise.all([
    Product.findById(productId),
    Warehouse.findById(warehouseId),
    Location.findOne({ _id: locationId, warehouseId }),
  ]);

  if (!productExists) {
    res.status(404).json({ message: 'Referenced product does not exist.' });
    return;
  }
  if (!warehouseExists) {
    res.status(404).json({ message: 'Referenced warehouse does not exist.' });
    return;
  }
  if (!locationExists) {
    res.status(404).json({ message: 'Referenced location does not exist in this warehouse.' });
    return;
  }

  const numQty = Number(quantity);
  const numMin = minimumStock !== undefined ? Number(minimumStock) : 10;

  if (isNaN(numQty) || numQty < 0) {
    res.status(400).json({ message: 'Quantity must be a non-negative number.' });
    return;
  }
  if (isNaN(numMin) || numMin < 0) {
    res.status(400).json({ message: 'Minimum stock must be a non-negative number.' });
    return;
  }

  const existing = await Inventory.findOne({ productId, warehouseId, locationId });
  if (existing) {
    res.status(409).json({ message: 'Inventory record for this product at this location already exists. Update it instead.' });
    return;
  }

  try {
    const item = new Inventory({
      productId,
      warehouseId,
      locationId,
      quantity: numQty,
      minimumStock: numMin,
    });
    await item.save();

    const populated = await Inventory.findById(item._id)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating inventory record.' });
  }
});

// PUT /api/inventory/:id — Update inventory record (ADMIN, MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid inventory ID format.' });
    return;
  }

  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Inventory record not found.' });
      return;
    }

    const { quantity, minimumStock, locationId } = req.body;

    if (quantity !== undefined) {
      const q = Number(quantity);
      if (isNaN(q) || q < 0) {
        res.status(400).json({ message: 'Quantity must be a non-negative number.' });
        return;
      }
      item.quantity = q;
    }

    if (minimumStock !== undefined) {
      const m = Number(minimumStock);
      if (isNaN(m) || m < 0) {
        res.status(400).json({ message: 'Minimum stock must be a non-negative number.' });
        return;
      }
      item.minimumStock = m;
    }

    if (locationId !== undefined) {
      if (!mongoose.isValidObjectId(locationId)) {
        res.status(400).json({ message: 'Invalid location reference.' });
        return;
      }
      const loc = await Location.findOne({ _id: locationId, warehouseId: item.warehouseId });
      if (!loc) {
        res.status(404).json({ message: 'Location does not exist in this warehouse.' });
        return;
      }
      item.locationId = locationId;
    }

    await item.save();

    const updated = await Inventory.findById(item._id)
      .populate('productId', 'name sku category unitPrice')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code');

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating inventory.' });
  }
});

// DELETE /api/inventory/:id — Delete inventory record (ADMIN, MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid inventory ID format.' });
    return;
  }

  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Inventory record not found.' });
      return;
    }
    res.json({ message: 'Inventory record deleted successfully.', id: req.params.id });
  } catch {
    res.status(500).json({ message: 'Error deleting inventory record.' });
  }
});

export default router;
