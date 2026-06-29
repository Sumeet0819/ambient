import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import { getSupabaseClient } from '../database/supabase';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/v1/transactions
 * Query: month (YYYY-MM), page, limit
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();
  const { month, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('transactions')
    .select(`
      id, type, amount, currency, merchant,
      payment_method, notes, transaction_date, created_at,
      categories ( name, icon, color )
    `)
    .eq('user_id', req.userId!)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (month) {
    const start = `${month}-01`;
    const end = `${month}-31`;
    query = query.gte('transaction_date', start).lte('transaction_date', end);
  }

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data, page: pageNum, limit: limitNum, total: count ?? 0 });
});

/**
 * POST /api/v1/transactions
 * Manually add a transaction
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();
  const { type, amount, currency = 'INR', merchant, category_id, payment_method, notes, transaction_date } = req.body;

  if (!type || !amount) {
    res.status(400).json({ error: 'type and amount are required' });
    return;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: req.userId!,
      type, amount, currency, merchant,
      category_id, payment_method, notes,
      transaction_date: transaction_date ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ data });
});

/**
 * DELETE /api/v1/transactions/reset
 * Soft delete all transactions for the current user
 */
router.delete('/reset', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', req.userId!)
    .is('deleted_at', null);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'All transactions have been reset.' });
});

/**
 * DELETE /api/v1/transactions/:id
 * Soft delete
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'Transaction deleted' });
});

export default router;
