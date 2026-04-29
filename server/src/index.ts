import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';

import authRoutes         from './routes/auth.routes';
import borrowerRoutes     from './routes/borrower.routes';
import salesRoutes        from './routes/sales.routes';
import sanctionRoutes     from './routes/sanction.routes';
import disbursementRoutes from './routes/disbursement.routes';
import collectionRoutes   from './routes/collection.routes';

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/borrower',     borrowerRoutes);
app.use('/api/sales',        salesRoutes);
app.use('/api/sanction',     sanctionRoutes);
app.use('/api/disbursement', disbursementRoutes);
app.use('/api/collection',   collectionRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralised error handler ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[Error]', err?.message ?? err);

  if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'File too large. Maximum is 5 MB.' });
    return;
  }
  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('invalid file type')) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  const status  = typeof err?.status === 'number' ? err.status : 500;
  const message = typeof err?.message === 'string' ? err.message : 'Internal server error';

  res.status(status).json({ success: false, message });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;

connectDB().then(() => {
  app.listen(Number(PORT), () => {
    console.log(`🚀 LMS API  →  http://localhost:${PORT}`);
    console.log(`   Health   →  http://localhost:${PORT}/health`);
  });
});

export default app;