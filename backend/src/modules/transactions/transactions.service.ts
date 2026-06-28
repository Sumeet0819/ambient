import { getSupabaseClient } from '../database/supabase';
import { ParsedTransaction } from '../ai/ai.service';
import { logger } from '../../shared/logger';

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  merchant: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
}

/**
 * Save a parsed transaction to the database.
 * Looks up the category by name to get the category_id.
 */
export async function saveTransaction(
  userId: string,
  parsed: ParsedTransaction,
): Promise<Transaction | null> {
  if (!parsed.amount || !parsed.isFinancial) return null;

  const supabase = getSupabaseClient();

  // Look up category ID from name
  let categoryId: string | null = null;
  if (parsed.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', parsed.category)
      .single();
    categoryId = cat?.id ?? null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: parsed.type === 'unknown' ? 'expense' : parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      merchant: parsed.merchant,
      category_id: categoryId,
      payment_method: parsed.paymentMethod,
      notes: parsed.notes,
      transaction_date: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    logger.error({ error, userId }, 'Failed to save transaction');
    return null;
  }

  logger.info(
    { transactionId: data.id, amount: parsed.amount, type: parsed.type },
    '💾  Transaction saved',
  );
  return data as Transaction;
}
