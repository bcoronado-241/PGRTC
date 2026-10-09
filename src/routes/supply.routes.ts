import { Router } from 'express';
import { z } from 'zod';
import * as supplyController from '../controllers/supply.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const supplySchema = z.object({
  supply_name: z.string().trim().min(1, 'supply_name is required').max(100),
  unit: z.string().trim().min(1, 'unit is required').max(20),
});

router.use(authenticate);

router.get('/', asyncHandler(supplyController.list));
router.get('/:id', asyncHandler(supplyController.getOne));
router.post('/', requireRole('admin'), validate(supplySchema), asyncHandler(supplyController.create));
router.put(
  '/:id',
  requireRole('admin'),
  validate(supplySchema),
  asyncHandler(supplyController.update),
);
router.delete('/:id', requireRole('admin'), asyncHandler(supplyController.remove));

export default router;
