import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/User.model';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized: authentication required' });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not permitted. Required: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};