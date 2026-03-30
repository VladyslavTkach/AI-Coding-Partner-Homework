import { Router } from 'express';
import ticketRoutes from './tickets';

const router = Router();

router.use('/tickets', ticketRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
