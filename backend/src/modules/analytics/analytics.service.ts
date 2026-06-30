import { getSupabaseClient } from '../database/supabase';
import { logger } from '../../shared/logger';

export interface MonthlySummary {
  month: string;
  totalExpense: number;
  totalIncome: number;
  netBalance: number;
  categoryBreakdown: Array<{
    category: string;
    icon: string;
    color: string;
    total: number;
  }>;
  recentTransactions: any[];
  monthlyLimit?: number;
}

/**
 * Get monthly summary: totals, category breakdown, recent transactions.
 */
export async function getMonthlySummary(
  userId: string,
  month: string, // YYYY-MM
): Promise<MonthlySummary> {
  const supabase = getSupabaseClient();
  const start = `${month}-01T00:00:00.000Z`;
  const end = new Date(
    new Date(`${month}-01`).getFullYear(),
    new Date(`${month}-01`).getMonth() + 1,
    0,
    23, 59, 59,
  ).toISOString();

  // Fetch all transactions for the month
  const { data: txns, error } = await supabase
    .from('transactions')
    .select(`
      id, type, amount, currency, transaction_date, merchant,
      categories ( name, icon, color )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', start)
    .lte('transaction_date', end);

  if (error) {
    logger.error({ error }, 'Failed to fetch monthly analytics');
    return {
      month,
      totalExpense: 0,
      totalIncome: 0,
      netBalance: 0,
      categoryBreakdown: [],
      recentTransactions: [],
    };
  }

  const transactions = txns ?? [];

  // Fetch overall monthly limit
  const { data: budgetData } = await supabase
    .from('budgets')
    .select('limit_amount')
    .eq('user_id', userId)
    .eq('month', month)
    .is('category_id', null)
    .maybeSingle();

  const monthlyLimit = budgetData?.limit_amount || 50000;

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'subscription')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  // Category breakdown (expenses only)
  const catMap: Record<string, { total: number; icon: string; color: string }> = {};
  for (const t of transactions) {
    if (t.type !== 'expense' && t.type !== 'subscription') continue;
    const cat = (t as any).categories;
    const name = cat?.name ?? 'Other';
    const icon = cat?.icon ?? '📦';
    const color = cat?.color ?? '#B0B0B0';
    if (!catMap[name]) catMap[name] = { total: 0, icon, color };
    catMap[name].total += t.amount ?? 0;
  }

  const categoryBreakdown = Object.entries(catMap)
    .map(([category, val]) => ({ category, ...val }))
    .sort((a, b) => b.total - a.total);

  // 5 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5);

  return {
    month,
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
    categoryBreakdown,
    recentTransactions,
    monthlyLimit,
  };
}
