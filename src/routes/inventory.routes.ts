import { Router } from 'express';
import { z } from 'zod';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const createInventorySchema = z.object({
  center_id: z.number().int().positive(),
  supply_id: z.number().int().positive(),
  quantity: z.number().int().min(0),
  min_threshold: z.number().int().min(0),
});

const updateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  min_threshold: z.number().int().min(0),
});

router.use(authenticate);

router.get('/', asyncHandler(inventoryController.list));
router.get('/:id', asyncHandler(inventoryController.getOne));
router.post(
  '/',
  requireRole('admin', 'rescuer'),
  validate(createInventorySchema),
  asyncHandler(inventoryController.create),
);
router.put(
  '/:id',
  requireRole('admin', 'rescuer'),
  validate(updateInventorySchema),
  asyncHandler(inventoryController.update),
);
router.delete('/:id', requireRole('admin'), asyncHandler(inventoryController.remove));

export default router;
