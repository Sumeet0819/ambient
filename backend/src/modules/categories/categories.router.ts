import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../database/supabase';

const router = Router();

/** GET /api/v1/categories - public, no auth needed */
router.get('/', async (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, color')
    .order('name');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data });
});

export default router;
