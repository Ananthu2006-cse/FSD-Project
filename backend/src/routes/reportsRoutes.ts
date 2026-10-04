import { Router, Response } from 'express';
import { Product } from '../models/Product';
import { Warehouse } from '../models/Warehouse';
import { Location } from '../models/Location';
import { Inventory } from '../models/Inventory';
import { StockMovement } from '../models/StockMovement';
import { DamagedStock } from '../models/DamagedStock';
import { Order } from '../models/Order';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/reports/analytics — Complete operational dashboard metrics
router.get('/analytics', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalProducts,
      totalWarehouses,
      totalLocations,
      inventoryDocs,
      damagedDocs,
      ordersDocs,
      recentMovements,
    ] = await Promise.all([
      Product.countDocuments(),
      Warehouse.countDocuments(),
      Location.countDocuments(),
      Inventory.find().populate('productId', 'unitPrice'),
      DamagedStock.find(),
      Order.find(),
      StockMovement.find()
        .populate('productId', 'name sku')
        .populate('warehouseId', 'code')
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Inventory metrics
    let totalStockUnits = 0;
    let totalStockValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const inv of inventoryDocs) {
      totalStockUnits += inv.quantity;
      const unitPrice = (inv.productId as any)?.unitPrice || 0;
      totalStockValuation += inv.quantity * unitPrice;

      if (inv.quantity === 0) {
        outOfStockCount++;
      } else if (inv.quantity <= inv.minimumStock) {
        lowStockCount++;
      }
    }

    // Damaged metrics
    const totalDamagedItems = damagedDocs.reduce((acc, d) => acc + d.quantity, 0);
    const unresolvedDamagedCount = damagedDocs.filter((d) => d.status === 'REPORTED').length;

    // Order metrics
    const pendingOrders = ordersDocs.filter((o) => o.status === 'PENDING').length;
    const confirmedOrders = ordersDocs.filter((o) => o.status === 'CONFIRMED').length;
    const pickingOrders = ordersDocs.filter((o) => o.status === 'PICKING').length;
    const readyOrders = ordersDocs.filter((o) => o.status === 'READY').length;
    const dispatchedOrders = ordersDocs.filter((o) => o.status === 'DISPATCHED').length;
    const cancelledOrders = ordersDocs.filter((o) => o.status === 'CANCELLED').length;

    res.json({
      summary: {
        totalProducts,
        totalWarehouses,
        totalLocations,
        totalStockUnits,
        totalStockValuation: Number(totalStockValuation.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        totalDamagedItems,
        unresolvedDamagedCount,
        pendingOrders,
        confirmedOrders,
        pickingOrders,
        readyOrders,
        dispatchedOrders,
        cancelledOrders,
        totalOrders: ordersDocs.length,
      },
      recentMovements,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error compiling analytics report.' });
  }
});

export default router;
