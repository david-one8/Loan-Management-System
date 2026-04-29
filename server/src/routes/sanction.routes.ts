import { Router } from 'express';
import { getAppliedLoans, sanctionLoan } from '../controllers/sanction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole }  from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate, requireRole('sanction', 'admin'));
router.get('/loans',    getAppliedLoans);
router.patch('/loans/:id', sanctionLoan);
export default router;