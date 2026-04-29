import { Router } from 'express';
import { getDisbursedLoans, recordPayment } from '../controllers/collection.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole }  from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate, requireRole('collection', 'admin'));
router.get('/loans',               getDisbursedLoans);
router.post('/loans/:id/payment',  recordPayment);
export default router;