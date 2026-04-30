import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User.model';

interface AuthUserResponse {
  _id: string;
  email: string;
  role: string;
}

const toAuthUser = (user: { _id: unknown; email: string; role: string }): AuthUserResponse => ({
  _id: String(user._id),
  email: user.email,
  role: user.role,
});

const signToken = (payload: { _id: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      role: 'borrower',
    });
    const authUser = toAuthUser(user);
    const token = signToken(authUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: authUser,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const authUser = toAuthUser(user);
    const token = signToken(authUser);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: authUser,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
