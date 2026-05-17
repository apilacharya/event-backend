import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../prisma';
import { LoginInput, SignupInput } from '../schemas/auth.schema';

function setTokenCookie(res: Response, userId: number, name: string): void {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
  const token = jwt.sign({ id: userId, name }, process.env.JWT_SECRET as string, { expiresIn });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const safeSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const;

export const AuthController = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body as SignupInput;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ message: 'Email already in use', errors: {} });
        return;
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashed },
        select: safeSelect,
      });

      setTokenCookie(res, user.id, user.name);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid credentials', errors: {} });
        return;
      }

      setTokenCookie(res, user.id, user.name);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: safeSelect,
      });

      if (!user) {
        res.status(404).json({ message: 'User not found', errors: {} });
        return;
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};
