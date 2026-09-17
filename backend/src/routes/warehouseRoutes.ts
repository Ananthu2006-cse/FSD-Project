import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Warehouse, WarehouseStatus } from '../models/Warehouse';
import { Location } from '../models/Location';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All routes require JWT authentication
router.use(authenticateToken);

// GET /api/warehouses — view all (ADMIN, MANAGER, STAFF)
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    res.json(warehouses);
  } catch {
    res.status(500).json({ message: 'Error retrieving warehouses.' });
  }
});

// GET /api/warehouses/:id — view one (ADMIN, MANAGER, STAFF)
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid warehouse ID format.' });
    return;
  }
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) { res.status(404).json({ message: 'Warehouse not found.' }); return; }
    res.json(warehouse);
  } catch {
    res.status(500).json({ message: 'Error retrieving warehouse.' });
  }
});

// GET /api/warehouses/:warehouseId/locations — locations per warehouse (ADMIN, MANAGER, STAFF)
router.get('/:warehouseId/locations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.warehouseId)) {
    res.status(400).json({ message: 'Invalid warehouse ID format.' });
    return;
  }
  try {
    const warehouse = await Warehouse.findById(req.params.warehouseId);
    if (!warehouse) { res.status(404).json({ message: 'Warehouse not found.' }); return; }
    const locations = await Location.find({ warehouseId: req.params.warehouseId }).sort({ code: 1 });
    res.json(locations);
  } catch {
    res.status(500).json({ message: 'Error retrieving locations.' });
  }
});

// POST /api/warehouses — create (ADMIN, MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, code, address, description, status } = req.body;

  if (!name || !String(name).trim()) { res.status(400).json({ message: 'Warehouse name is required.' }); return; }
  if (!code || !String(code).trim()) { res.status(400).json({ message: 'Warehouse code is required.' }); return; }

  const cleanCode = String(code).trim().toUpperCase();
  const existing = await Warehouse.findOne({ code: cleanCode });
  if (existing) { res.status(409).json({ message: 'A warehouse with this code already exists.' }); return; }

  let whStatus: WarehouseStatus = 'ACTIVE';
  if (status) {
    const up = String(status).trim().toUpperCase();
    if (up !== 'ACTIVE' && up !== 'INACTIVE') { res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' }); return; }
    whStatus = up as WarehouseStatus;
  }

  try {
    const warehouse = await Warehouse.create({
      name: String(name).trim(),
      code: cleanCode,
      address: address ? String(address).trim() : '',
      description: description ? String(description).trim() : '',
      status: whStatus,
    });
    res.status(201).json(warehouse);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating warehouse.' });
  }
});

// PUT /api/warehouses/:id — update (ADMIN, MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid warehouse ID format.' }); return; }

  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) { res.status(404).json({ message: 'Warehouse not found.' }); return; }

    const { name, code, address, description, status } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) { res.status(400).json({ message: 'Warehouse name cannot be empty.' }); return; }
      warehouse.name = String(name).trim();
    }
    if (code !== undefined) {
      const cleanCode = String(code).trim().toUpperCase();
      if (!cleanCode) { res.status(400).json({ message: 'Warehouse code cannot be empty.' }); return; }
      if (cleanCode !== warehouse.code) {
        const dup = await Warehouse.findOne({ code: cleanCode });
        if (dup) { res.status(409).json({ message: 'A warehouse with this code already exists.' }); return; }
        warehouse.code = cleanCode;
      }
    }
    if (address !== undefined) warehouse.address = String(address).trim();
    if (description !== undefined) warehouse.description = String(description).trim();
    if (status !== undefined) {
      const up = String(status).trim().toUpperCase();
      if (up !== 'ACTIVE' && up !== 'INACTIVE') { res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' }); return; }
      warehouse.status = up as WarehouseStatus;
    }

    await warehouse.save();
    res.json(warehouse);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating warehouse.' });
  }
});

// DELETE /api/warehouses/:id — delete (ADMIN, MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid warehouse ID format.' }); return; }

  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) { res.status(404).json({ message: 'Warehouse not found.' }); return; }
    // Also delete all locations belonging to this warehouse
    await Location.deleteMany({ warehouseId: req.params.id });
    res.json({ message: 'Warehouse and all its locations deleted successfully.', id: req.params.id });
  } catch {
    res.status(500).json({ message: 'Error deleting warehouse.' });
  }
});

export default router;
