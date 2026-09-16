import { Router, Response } from 'express';
import { User, UserStatus } from '../models/User';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply JWT authentication to all routes below
router.use(authenticateToken);

// GET /api/users (ADMIN ONLY)
router.get('/users', authorizeRoles('ADMIN'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const userResponses = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));
    res.json(userResponses);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user directory.' });
  }
});

// PATCH /api/users/:id/status (ADMIN ONLY)
router.patch('/users/:id/status', authorizeRoles('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status || (status.toUpperCase() !== 'ACTIVE' && status.toUpperCase() !== 'INACTIVE')) {
    res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE' });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.status = status.toUpperCase() as UserStatus;
    await user.save();

    res.json({
      message: 'User status updated successfully',
      userId: user.id,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status.' });
  }
});

// GET /api/reports/summary (ADMIN & MANAGER)
router.get('/reports/summary', authorizeRoles('ADMIN', 'MANAGER'), (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    module: 'REPORTS',
    accessLevel: 'MANAGEMENT',
    status: 'ACTIVE',
  });
});

// GET /api/inventory/summary (ADMIN, MANAGER & STAFF)
router.get('/inventory/summary', authorizeRoles('ADMIN', 'MANAGER', 'STAFF'), (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    module: 'INVENTORY',
    accessLevel: 'OPERATIONAL',
    status: 'ACTIVE',
  });
});

export default router;
