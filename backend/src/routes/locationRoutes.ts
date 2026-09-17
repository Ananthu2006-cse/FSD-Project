import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Location, LocationStatus } from '../models/Location';
import { Warehouse } from '../models/Warehouse';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All routes require JWT authentication
router.use(authenticateToken);

// GET /api/locations — view all (ADMIN, MANAGER, STAFF)
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const locations = await Location.find().sort({ warehouseId: 1, code: 1 }).populate('warehouseId', 'name code');
    res.json(locations);
  } catch {
    res.status(500).json({ message: 'Error retrieving locations.' });
  }
});

// GET /api/locations/:id — view one (ADMIN, MANAGER, STAFF)
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid location ID format.' });
    return;
  }
  try {
    const location = await Location.findById(req.params.id).populate('warehouseId', 'name code');
    if (!location) { res.status(404).json({ message: 'Location not found.' }); return; }
    res.json(location);
  } catch {
    res.status(500).json({ message: 'Error retrieving location.' });
  }
});

// POST /api/locations — create (ADMIN, MANAGER)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { warehouseId, name, code, description, status } = req.body;

  if (!warehouseId || !mongoose.isValidObjectId(warehouseId)) {
    res.status(400).json({ message: 'A valid warehouse ID is required.' }); return;
  }
  if (!name || !String(name).trim()) { res.status(400).json({ message: 'Location name is required.' }); return; }
  if (!code || !String(code).trim()) { res.status(400).json({ message: 'Location code is required.' }); return; }

  // Verify warehouse exists
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) { res.status(404).json({ message: 'Referenced warehouse does not exist.' }); return; }

  const cleanCode = String(code).trim().toUpperCase();

  // Check code unique within warehouse
  const dup = await Location.findOne({ warehouseId, code: cleanCode });
  if (dup) { res.status(409).json({ message: 'A location with this code already exists in this warehouse.' }); return; }

  let locStatus: LocationStatus = 'ACTIVE';
  if (status) {
    const up = String(status).trim().toUpperCase();
    if (up !== 'ACTIVE' && up !== 'INACTIVE') { res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' }); return; }
    locStatus = up as LocationStatus;
  }

  try {
    const location = await Location.create({
      warehouseId,
      name: String(name).trim(),
      code: cleanCode,
      description: description ? String(description).trim() : '',
      status: locStatus,
    });
    res.status(201).json(location);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating location.' });
  }
});

// PUT /api/locations/:id — update (ADMIN, MANAGER)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid location ID format.' }); return; }

  try {
    const location = await Location.findById(req.params.id);
    if (!location) { res.status(404).json({ message: 'Location not found.' }); return; }

    const { warehouseId, name, code, description, status } = req.body;

    if (warehouseId !== undefined) {
      if (!mongoose.isValidObjectId(warehouseId)) { res.status(400).json({ message: 'Invalid warehouse ID format.' }); return; }
      const wh = await Warehouse.findById(warehouseId);
      if (!wh) { res.status(404).json({ message: 'Referenced warehouse does not exist.' }); return; }
      location.warehouseId = warehouseId;
    }

    if (code !== undefined) {
      const cleanCode = String(code).trim().toUpperCase();
      if (!cleanCode) { res.status(400).json({ message: 'Location code cannot be empty.' }); return; }
      const targetWarehouse = warehouseId || location.warehouseId.toString();
      if (cleanCode !== location.code || warehouseId) {
        const dup = await Location.findOne({ warehouseId: targetWarehouse, code: cleanCode, _id: { $ne: location._id } });
        if (dup) { res.status(409).json({ message: 'A location with this code already exists in this warehouse.' }); return; }
        location.code = cleanCode;
      }
    }

    if (name !== undefined) {
      if (!String(name).trim()) { res.status(400).json({ message: 'Location name cannot be empty.' }); return; }
      location.name = String(name).trim();
    }
    if (description !== undefined) location.description = String(description).trim();
    if (status !== undefined) {
      const up = String(status).trim().toUpperCase();
      if (up !== 'ACTIVE' && up !== 'INACTIVE') { res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' }); return; }
      location.status = up as LocationStatus;
    }

    await location.save();
    res.json(location);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating location.' });
  }
});

// DELETE /api/locations/:id — delete (ADMIN, MANAGER)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid location ID format.' }); return; }

  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) { res.status(404).json({ message: 'Location not found.' }); return; }
    res.json({ message: 'Location deleted successfully.', id: req.params.id });
  } catch {
    res.status(500).json({ message: 'Error deleting location.' });
  }
});

export default router;
