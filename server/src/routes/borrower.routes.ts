import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import {
  saveProfile,
  uploadSlip,
  applyLoan,
  getLoan,
  getPaymentHistory,          // ← added
} from '../controllers/borrower.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole }  from '../middleware/rbac.middleware';


const router = Router();


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename:    (_req, file,  cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    cb(null, `slip_${suffix}${ext}`);
  },
});


const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are accepted.'));
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});


router.use(authenticate, requireRole('borrower'));


router.post('/profile', saveProfile);


// Inline multer error handler — returns JSON instead of default Express HTML
router.post(
  '/upload-slip',
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single('salarySlip')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, message: 'File too large. Maximum is 5 MB.' });
          return;
        }
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      if (err instanceof Error) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next();
    });
  },
  uploadSlip
);


router.post('/apply',                applyLoan);
router.get('/loan',                  getLoan);
router.get('/loan/:loanId/payments', getPaymentHistory);  // ← new route


export default router;