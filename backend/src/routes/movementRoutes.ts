import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { StockMovement } from '../models/StockMovement';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { Warehouse } from '../models/Warehouse';
import { Location } from '../models/Location';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/movements — View recent stock movements
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const movements = await StockMovement.find()
      .populate('productId', 'name sku category')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('toLocationId', 'name code')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(movements);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving stock movements.' });
  }
});

// POST /api/movements — Execute a stock movement
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    type,
    productId,
    warehouseId,
    locationId,
    toWarehouseId,
    toLocationId,
    quantity,
    reason,
  } = req.body;

  const validTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'];
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ message: `Movement type must be one of: ${validTypes.join(', ')}` });
    return;
  }

  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400).json({ message: 'Valid product reference is required.' });
    return;
  }
  if (!warehouseId || !mongoose.isValidObjectId(warehouseId)) {
    res.status(400).json({ message: 'Valid source warehouse reference is required.' });
    return;
  }
  if (!locationId || !mongoose.isValidObjectId(locationId)) {
    res.status(400).json({ message: 'Valid source location reference is required.' });
    return;
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    res.status(400).json({ message: 'Quantity must be a positive integer greater than zero.' });
    return;
  }

  try {
    // Verify entities
    const [product, sourceWh, sourceLoc] = await Promise.all([
      Product.findById(productId),
      Warehouse.findById(warehouseId),
      Location.findOne({ _id: locationId, warehouseId }),
    ]);

    if (!product) { res.status(404).json({ message: 'Product not found.' }); return; }
    if (!sourceWh) { res.status(404).json({ message: 'Source warehouse not found.' }); return; }
    if (!sourceLoc) { res.status(404).json({ message: 'Source location not found in this warehouse.' }); return; }

    // Find source inventory
    let sourceInv = await Inventory.findOne({ productId, warehouseId, locationId });

    if (type === 'IN') {
      if (!sourceInv) {
        sourceInv = new Inventory({
          productId,
          warehouseId,
          locationId,
          quantity: numQty,
          minimumStock: 10,
        });
      } else {
        sourceInv.quantity += numQty;
      }
      await sourceInv.save();
    } else if (type === 'OUT') {
      if (!sourceInv || sourceInv.quantity < numQty) {
        const available = sourceInv ? sourceInv.quantity : 0;
        res.status(400).json({
          message: `Insufficient inventory for dispatch. Requested: ${numQty}, Available at location: ${available}.`,
        });
        return;
      }
      sourceInv.quantity -= numQty;
      await sourceInv.save();
    } else if (type === 'TRANSFER') {
      if (!toWarehouseId || !mongoose.isValidObjectId(toWarehouseId)) {
        res.status(400).json({ message: 'Destination warehouse reference is required for transfer.' });
        return;
      }
      if (!toLocationId || !mongoose.isValidObjectId(toLocationId)) {
        res.status(400).json({ message: 'Destination location reference is required for transfer.' });
        return;
      }
      if (warehouseId === toWarehouseId && locationId === toLocationId) {
        res.status(400).json({ message: 'Destination location must be different from source location.' });
        return;
      }

      const [destWh, destLoc] = await Promise.all([
        Warehouse.findById(toWarehouseId),
        Location.findOne({ _id: toLocationId, warehouseId: toWarehouseId }),
      ]);
      if (!destWh) { res.status(404).json({ message: 'Destination warehouse not found.' }); return; }
      if (!destLoc) { res.status(404).json({ message: 'Destination location not found in destination warehouse.' }); return; }

      if (!sourceInv || sourceInv.quantity < numQty) {
        const available = sourceInv ? sourceInv.quantity : 0;
        res.status(400).json({
          message: `Insufficient inventory for transfer. Requested: ${numQty}, Available: ${available}.`,
        });
        return;
      }

      // Deduct from source
      sourceInv.quantity -= numQty;
      await sourceInv.save();

      // Add to destination
      let destInv = await Inventory.findOne({
        productId,
        warehouseId: toWarehouseId,
        locationId: toLocationId,
      });
      if (!destInv) {
        destInv = new Inventory({
          productId,
          warehouseId: toWarehouseId,
          locationId: toLocationId,
          quantity: numQty,
          minimumStock: 10,
        });
      } else {
        destInv.quantity += numQty;
      }
      await destInv.save();
    } else if (type === 'ADJUSTMENT') {
      // Set absolute quantity or offset
      if (!sourceInv) {
        sourceInv = new Inventory({
          productId,
          warehouseId,
          locationId,
          quantity: numQty,
          minimumStock: 10,
        });
      } else {
        sourceInv.quantity = numQty;
      }
      await sourceInv.save();
    }

    // Record the stock movement audit log
    const movement = new StockMovement({
      type,
      productId,
      warehouseId,
      locationId,
      toWarehouseId: type === 'TRANSFER' ? toWarehouseId : undefined,
      toLocationId: type === 'TRANSFER' ? toLocationId : undefined,
      quantity: numQty,
      reason: reason || `Manual stock ${type.toLowerCase()} logged by operator`,
      userId: req.user?._id,
    });
    await movement.save();

    const populated = await StockMovement.findById(movement._id)
      .populate('productId', 'name sku category')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('toWarehouseId', 'name code')
      .populate('toLocationId', 'name code')
      .populate('userId', 'name email role');

    res.status(201).json({
      movement: populated,
      updatedInventory: sourceInv,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error processing stock movement.' });
  }
});

export default router;
