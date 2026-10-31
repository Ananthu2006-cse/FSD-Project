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
      Inventory.find().populate('productId', 'name sku category unitPrice'),
      DamagedStock.find(),
      Order.find(),
      StockMovement.find()
        .populate('productId', 'name sku')
        .populate('warehouseId', 'code name')
        .populate('locationId', 'code name')
        .populate('toWarehouseId', 'code name')
        .populate('toLocationId', 'code name')
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    // Inventory metrics & breakdown
    let totalStockUnits = 0;
    let totalStockValuation = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoryMap: Record<string, { count: number; totalStock: number; valuation: number }> = {};

    for (const inv of inventoryDocs) {
      totalStockUnits += inv.quantity;
      const prod = inv.productId as any;
      const unitPrice = prod?.unitPrice || 0;
      const category = prod?.category || 'General';
      const itemValuation = inv.quantity * unitPrice;
      totalStockValuation += itemValuation;

      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, totalStock: 0, valuation: 0 };
      }
      categoryMap[category].count += 1;
      categoryMap[category].totalStock += inv.quantity;
      categoryMap[category].valuation += itemValuation;

      if (inv.quantity === 0) {
        outOfStockCount++;
      } else if (inv.quantity <= inv.minimumStock) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalStock: stats.totalStock,
      valuation: Number(stats.valuation.toFixed(2)),
    })).sort((a, b) => b.totalStock - a.totalStock);

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
        inStockCount,
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
      categoryBreakdown,
      statusBreakdown: {
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        totalRecords: inventoryDocs.length,
      },
      recentMovements,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error compiling analytics report.' });
  }
});

export default router;
