import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const registerSchema = z.object({
  full_name: z.string().trim().min(1, 'full_name is required').max(100),
  email: z.string().trim().email('A valid email is required').max(150),
  password: z.string().min(6, 'password must be at least 6 characters').max(72),
  role: z.enum(['admin', 'rescuer']).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'password is required'),
});

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1, 'full_name is required').max(100),
});

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/profile', authenticate, asyncHandler(authController.profile));
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile),
);

export default router;
