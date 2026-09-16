import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access Denied: Insufficient permissions.' });
      return;
    }
    next();
  };
};
