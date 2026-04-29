import { Router } from 'express';
import { getSanctionedLoans, disburseLoan } from '../controllers/disbursement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole }  from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate, requireRole('disbursement', 'admin'));
router.get('/loans',              getSanctionedLoans);
router.patch('/loans/:id/disburse', disburseLoan);
export default router;