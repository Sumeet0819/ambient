import { IncomingMessage } from '../../shared/types/incoming-message.type';
import { getSupabaseClient } from '../database/supabase';
import { sendMessage } from '../whatsapp/whatsapp.service';
import { parseTransaction, ParsedTransaction } from '../ai/ai.service';
import { findOrCreateUser } from '../users/users.service';
import { saveTransaction } from '../transactions/transactions.service';
import { logger } from '../../shared/logger';

/**
 * Full Phase 2 pipeline:
 * 1. Find or create user
 * 2. Save raw message to conversation_logs
 * 3. Parse with Gemini AI
 * 4. If financial → save transaction
 * 5. Update conversation_log with parsed result
 * 6. Send rich reply back to user
 */
export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const supabase = getSupabaseClient();

  // ── 1. Find / create user ────────────────────────────────────────────────
  const user = await findOrCreateUser(message.sender);

  // ── 2. Save raw message to conversation_logs ─────────────────────────────
  const { data: logEntry, error: logError } = await supabase
    .from('conversation_logs')
    .insert({
      user_id: user?.id ?? null,
      source: message.source,
      sender: message.sender,
      raw_message: message.text,
      message_type: message.messageType,
      status: 'processing',
      created_at: message.timestamp,
    })
    .select('id')
    .single();

  if (logError) {
    logger.error({ logError }, 'Failed to save conversation log');
  }

  const logId = logEntry?.id ?? null;

  // ── 3. AI Parsing ─────────────────────────────────────────────────────────
  let parsed: ParsedTransaction | null = null;
  let reply: string;

  if (message.text) {
    parsed = await parseTransaction(message.text);
  }

  // ── 4. Save transaction if financial ──────────────────────────────────────
  let transactionId: string | null = null;
  if (parsed?.isFinancial && parsed.amount && user) {
    const saved = await saveTransaction(user.id, parsed);
    transactionId = saved?.id ?? null;
  }

  // ── 5. Update conversation_log with AI result ─────────────────────────────
  if (logId) {
    await supabase
      .from('conversation_logs')
      .update({
        parsed_json: parsed ? JSON.parse(JSON.stringify(parsed)) : null,
        status: parsed !== null ? 'processed' : 'failed',
      })
      .eq('id', logId);
  }

  // ── 6. Build and send reply ───────────────────────────────────────────────
  reply = buildReply(message.text, parsed, transactionId);
  await sendMessage(message.sender, reply);
  logger.info({ sender: message.sender, transactionId }, 'Reply sent');
}

/**
 * Build a friendly WhatsApp reply based on parsing result.
 */
function buildReply(
  text: string | null,
  parsed: ParsedTransaction | null,
  transactionId: string | null,
): string {
  if (!parsed || !parsed.isFinancial) {
    return (
      `👋 Hey! I'm your Finance Assistant.\n\n` +
      `I can record your transactions. Try sending:\n` +
      `• "Spent 450 on Pizza Hut"\n` +
      `• "Received 5000 salary"\n` +
      `• "Paid 200 for Uber via UPI"`
    );
  }

  if (!parsed.amount) {
    return `🤔 I understood this is a financial transaction, but couldn't figure out the amount. Could you resend with the amount? E.g. "Spent ₹450 on ${parsed.merchant ?? 'something'}"`;
  }

  const emoji = {
    expense: '💸',
    income: '💰',
    transfer: '↔️',
    loan: '🤝',
    investment: '📈',
    subscription: '🔄',
    unknown: '📝',
  }[parsed.type] ?? '📝';

  const typeLabel = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
  const amountStr = `₹${parsed.amount.toLocaleString('en-IN')}`;

  let reply = `${emoji} *${typeLabel} recorded!*\n\n`;
  reply += `💵 Amount: *${amountStr}*`;
  if (parsed.currency !== 'INR') reply += ` (${parsed.currency})`;
  reply += `\n`;
  if (parsed.merchant) reply += `🏪 Merchant: ${parsed.merchant}\n`;
  if (parsed.category) reply += `🏷️ Category: ${parsed.category}\n`;
  if (parsed.paymentMethod) reply += `💳 Via: ${parsed.paymentMethod.toUpperCase()}\n`;
  if (parsed.notes) reply += `📝 Note: ${parsed.notes}\n`;
  reply += `\n✅ Saved to your finance journal.`;

  return reply;
}
