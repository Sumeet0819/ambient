import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import { getMonthlySummary } from './analytics.service';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/analytics/monthly?month=2024-06
 */
router.get('/monthly', async (req: AuthRequest, res: Response) => {
  const month =
    (req.query.month as string) ??
    new Date().toISOString().slice(0, 7); // default: current month

  const data = await getMonthlySummary(req.userId!, month);
  res.json({ data });
});

export default router;
