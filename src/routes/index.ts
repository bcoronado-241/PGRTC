import { Router } from 'express';
import authRoutes from './auth.routes';
import centerRoutes from './center.routes';
import dashboardRoutes from './dashboard.routes';
import inventoryRoutes from './inventory.routes';
import redistributionRoutes from './redistribution.routes';
import supplyRoutes from './supply.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/centers', centerRoutes);
router.use('/supplies', supplyRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/redistribution-requests', redistributionRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
