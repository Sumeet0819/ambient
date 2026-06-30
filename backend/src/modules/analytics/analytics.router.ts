import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import { getMonthlySummary } from './analytics.service';
import { getSupabaseClient } from '../database/supabase';

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

/**
 * POST /api/v1/analytics/monthly-limit
 * Body: { month: '2024-06', limit: 50000 }
 */
router.post('/monthly-limit', async (req: AuthRequest, res: Response) => {
  const { month, limit } = req.body;
  if (!month || typeof limit !== 'number') {
    res.status(400).json({ error: 'month and numeric limit are required' });
    return;
  }

  const supabase = getSupabaseClient();
  
  // Check if budget exists
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', req.userId!)
    .eq('month', month)
    .is('category_id', null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('budgets').update({ limit_amount: limit }).eq('id', existing.id);
    if (error) {
       res.status(500).json({ error: error.message });
       return;
    }
  } else {
    const { error } = await supabase.from('budgets').insert({
      user_id: req.userId!,
      month,
      limit_amount: limit
    });
    if (error) {
       res.status(500).json({ error: error.message });
       return;
    }
  }

  res.json({ message: 'Monthly limit updated' });
});

export default router;
