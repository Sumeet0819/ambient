import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import { getSupabaseClient } from '../database/supabase';

const router = Router();
router.use(authMiddleware);

/** GET /api/v1/users/me */
router.get('/me', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, phone_number, name, created_at')
    .eq('id', req.userId!)
    .single();

  if (error) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ data });
});

/** PATCH /api/v1/users/me */
router.patch('/me', async (req: AuthRequest, res: Response) => {
  const supabase = getSupabaseClient();
  const { name } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', req.userId!)
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data });
});

export default router;
