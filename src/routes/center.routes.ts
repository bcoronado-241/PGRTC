import { Router } from 'express';
import { z } from 'zod';
import * as centerController from '../controllers/center.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const centerSchema = z.object({
  center_name: z.string().trim().min(1, 'center_name is required').max(150),
  type: z.enum(['hospital', 'collection_center']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(['red', 'yellow', 'green']).optional(),
});

router.use(authenticate);

router.get('/', asyncHandler(centerController.list));
router.get('/:id', asyncHandler(centerController.getOne));
router.post('/', requireRole('admin'), validate(centerSchema), asyncHandler(centerController.create));
router.put(
  '/:id',
  requireRole('admin'),
  validate(centerSchema),
  asyncHandler(centerController.update),
);
router.delete('/:id', requireRole('admin'), asyncHandler(centerController.remove));

export default router;
