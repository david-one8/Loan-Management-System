import { Router } from 'express';
import { getLeads } from '../controllers/sales.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole }  from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate, requireRole('sales', 'admin'));
router.get('/leads', getLeads);
export default router;