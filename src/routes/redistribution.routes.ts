import { Router } from 'express';
import { z } from 'zod';
import * as redistributionController from '../controllers/redistribution.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const createRequestSchema = z
  .object({
    source_center_id: z.number().int().positive(),
    target_center_id: z.number().int().positive(),
    supply_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })
  .refine((data) => data.source_center_id !== data.target_center_id, {
    message: 'source_center_id and target_center_id must be different',
    path: ['target_center_id'],
  });

router.use(authenticate);

router.get('/', asyncHandler(redistributionController.list));
router.get('/:id', asyncHandler(redistributionController.getOne));
router.post('/', validate(createRequestSchema), asyncHandler(redistributionController.create));
router.put(
  '/:id/approve',
  requireRole('admin'),
  asyncHandler(redistributionController.approve),
);
router.put('/:id/reject', requireRole('admin'), asyncHandler(redistributionController.reject));

export default router;
