import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '86400000';

const generateToken = (user: { id: string; email: string; name: string; role: string }) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: isNaN(Number(JWT_EXPIRATION)) ? '24h' : `${Math.floor(Number(JWT_EXPIRATION) / 1000)}s`,
    }
  );
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: trimmedEmail });

  if (!user || !user.password) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !name.trim() || !email.trim() || !password.trim()) {
    res.status(400).json({ message: 'Name, email, and password are required.' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: trimmedEmail });

  if (existingUser) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  let assignedRole: UserRole = 'STAFF';
  if (role && typeof role === 'string') {
    const uppercaseRole = role.trim().toUpperCase();
    if (['ADMIN', 'MANAGER', 'STAFF'].includes(uppercaseRole)) {
      assignedRole = uppercaseRole as UserRole;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name: name.trim(),
    email: trimmedEmail,
    password: hashedPassword,
    role: assignedRole,
    status: 'ACTIVE',
  });

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

export default router;
