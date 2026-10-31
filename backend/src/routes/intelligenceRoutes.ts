import { Router, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { StockMovement } from '../models/StockMovement';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// ─── GET /api/intelligence/predictions ────────────────────────────────────────
// Returns per-product stock predictions, restock suggestions, and demand analytics
router.get('/predictions', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days7Ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

    // Load all inventory entries with product details
    const inventoryDocs = await Inventory.find()
      .populate('productId', 'name sku category unitPrice')
      .lean();

    // Load OUT movements in the last 90 days (grouped by product)
    const outMovements = await StockMovement.find({
      type: 'OUT',
      createdAt: { $gte: days90Ago },
    }).lean();

    // Build movement lookup by productId string
    const movementsByProduct: Record<string, { quantity: number; createdAt: Date }[]> = {};
    for (const m of outMovements) {
      const pid = m.productId.toString();
      if (!movementsByProduct[pid]) movementsByProduct[pid] = [];
      movementsByProduct[pid].push({ quantity: m.quantity, createdAt: m.createdAt as Date });
    }

    // ── Per-product prediction ──────────────────────────────────────────────

    const predictions = inventoryDocs.map((inv) => {
      const product = inv.productId as any;
      const productId = product._id?.toString() || product.id?.toString() || '';
      const movements = movementsByProduct[productId] || [];

      // Total OUT in last 30 and 7 days
      const totalOutLast30Days = movements
        .filter((m) => m.createdAt >= days30Ago)
        .reduce((acc, m) => acc + m.quantity, 0);

      const totalOutLast7Days = movements
        .filter((m) => m.createdAt >= days7Ago)
        .reduce((acc, m) => acc + m.quantity, 0);

      // Average daily consumption over the actual span of data available
      let avgDailyConsumption = 0;
      if (movements.length > 0) {
        const totalConsumed = movements.reduce((acc, m) => acc + m.quantity, 0);
        const earliest = movements.reduce((min, m) =>
          m.createdAt < min ? m.createdAt : min, movements[0].createdAt
        );
        const daySpan = Math.max(1, (now.getTime() - earliest.getTime()) / (24 * 60 * 60 * 1000));
        avgDailyConsumption = totalConsumed / daySpan;
      }

      // Days remaining before stock-out
      let daysRemaining: number | null = null;
      if (avgDailyConsumption > 0) {
        daysRemaining = Math.floor(inv.quantity / avgDailyConsumption);
      }

      // Risk level indicator (Prompt 2: High, Medium, Low, Healthy, Insufficient Data)
      let riskLevel: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'HEALTHY' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
      if (daysRemaining !== null) {
        if (daysRemaining <= 7) riskLevel = 'HIGH_RISK';
        else if (daysRemaining <= 14) riskLevel = 'MEDIUM_RISK';
        else if (daysRemaining <= 30) riskLevel = 'LOW_RISK';
        else riskLevel = 'HEALTHY';
      } else if (inv.quantity <= inv.minimumStock) {
        riskLevel = inv.quantity === 0 ? 'HIGH_RISK' : 'MEDIUM_RISK';
      }

      // Alert level (compatible with previous code)
      let alertLevel: 'CRITICAL' | 'WARNING' | 'OK' | 'NO_DATA' = 'NO_DATA';
      if (riskLevel === 'HIGH_RISK') alertLevel = 'CRITICAL';
      else if (riskLevel === 'MEDIUM_RISK') alertLevel = 'WARNING';
      else if (riskLevel === 'LOW_RISK' || riskLevel === 'HEALTHY') alertLevel = 'OK';
      else alertLevel = 'NO_DATA';

      // Replenishment & Restock calculation (Lead time 7 days buffer + 30 days cycle)
      const leadTimeDays = 7;
      const targetStock = Math.max(inv.minimumStock * 2, Math.ceil(avgDailyConsumption * (30 + leadTimeDays)));
      const suggestedReorderQty = Math.max(0, targetStock - inv.quantity);

      let reorderUrgency: 'URGENT' | 'SOON' | 'MONITOR' | 'OK' = 'OK';
      if (riskLevel === 'HIGH_RISK') reorderUrgency = 'URGENT';
      else if (riskLevel === 'MEDIUM_RISK') reorderUrgency = 'SOON';
      else if (inv.quantity <= inv.minimumStock * 1.5 || riskLevel === 'LOW_RISK') reorderUrgency = 'MONITOR';

      return {
        productId,
        inventoryId: (inv._id as any).toString(),
        productName: product.name || 'Unknown',
        sku: product.sku || '',
        category: product.category || '',
        unitPrice: product.unitPrice || 0,
        currentStock: inv.quantity,
        minimumStock: inv.minimumStock,
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        daysRemaining,
        riskLevel,
        alertLevel,
        suggestedReorderQty,
        reorderUrgency,
        totalOutLast30Days,
        totalOutLast7Days,
        hasHistoricalData: movements.length > 0,
      };
    });

    // ── Demand Analytics ────────────────────────────────────────────────────

    // All product demand (30 days), sorted descending
    const demandMap: Record<string, { productName: string; sku: string; category: string; total: number }> = {};
    for (const m of outMovements) {
      if (m.createdAt < days30Ago) continue;
      const pid = m.productId.toString();
      const pred = predictions.find((p) => p.productId === pid);
      if (!pred) continue;
      if (!demandMap[pid]) {
        demandMap[pid] = { productName: pred.productName, sku: pred.sku, category: pred.category, total: 0 };
      }
      demandMap[pid].total += m.quantity;
    }

    const demandList = Object.entries(demandMap).map(([pid, d]) => ({ productId: pid, ...d }));
    demandList.sort((a, b) => b.total - a.total);

    const fastMoving = demandList.slice(0, 5);
    const slowMoving = [...demandList].sort((a, b) => a.total - b.total).slice(0, 5);

    // Daily trend — last 7 days grouped by date
    const dailyTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrendMap[key] = 0;
    }
    for (const m of outMovements) {
      if (m.createdAt < days7Ago) continue;
      const key = (m.createdAt as Date).toISOString().slice(0, 10);
      if (key in dailyTrendMap) {
        dailyTrendMap[key] += m.quantity;
      }
    }
    const dailyTrend = Object.entries(dailyTrendMap).map(([date, totalOut]) => ({ date, totalOut }));

    // ── Summary counts ──────────────────────────────────────────────────────
    const highRiskCount = predictions.filter((p) => p.riskLevel === 'HIGH_RISK').length;
    const mediumRiskCount = predictions.filter((p) => p.riskLevel === 'MEDIUM_RISK').length;
    const lowRiskCount = predictions.filter((p) => p.riskLevel === 'LOW_RISK').length;
    const criticalCount = highRiskCount;
    const warningCount  = mediumRiskCount;
    const pendingRestockCount = predictions.filter((p) => p.suggestedReorderQty > 0).length;

    res.json({
      predictions,
      demandAnalytics: { fastMoving, slowMoving, dailyTrend },
      summary: { highRiskCount, mediumRiskCount, lowRiskCount, criticalCount, warningCount, pendingRestockCount },
    });
  } catch (err: any) {
    console.error('[Intelligence] Error:', err.message);
    res.status(500).json({ message: 'Error computing intelligence report.' });
  }
});

export default router;
