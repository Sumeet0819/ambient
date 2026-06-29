import { IncomingMessage } from '../../shared/types/incoming-message.type';
import { getSupabaseClient } from '../database/supabase';
import { sendMessage } from '../whatsapp/whatsapp.service';
import { parseTransaction, ParsedMessage, ParsedTransaction } from '../ai/ai.service';
import { findOrCreateUser } from '../users/users.service';
import { saveTransaction } from '../transactions/transactions.service';
import { logger } from '../../shared/logger';

/**
 * Full Phase 2 pipeline:
 * 1. Find or create user
 * 2. Save raw message to conversation_logs
 * 3. Parse with Gemini AI
 * 4. If financial → save transaction(s)
 * 5. Update conversation_log with parsed result
 * 6. Send rich reply back to user
 */
export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const supabase = getSupabaseClient();

  // ── 0. Handle Link Codes ─────────────────────────────────────────────────
  if (message.text?.toUpperCase().startsWith('AMB-')) {
    const code = message.text.toUpperCase().trim();
    const { data: userToLink } = await supabase
      .from('users')
      .select('id, email')
      .eq('link_code', code)
      .single();

    if (userToLink) {
      const normalisedSender = message.sender.split('@')[0].split(':')[0];
      
      const { data: tempUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', normalisedSender)
        .single();
        
      if (tempUser && tempUser.id !== userToLink.id) {
        await supabase.from('users').delete().eq('id', tempUser.id);
      }

      await supabase
        .from('users')
        .update({ phone_number: normalisedSender, link_code: null })
        .eq('id', userToLink.id);
        
      await sendMessage(message.sender, `✅ Successfully linked your WhatsApp to ${userToLink.email || 'your account'}! You can now log your expenses.`);
      return;
    } else {
      await sendMessage(message.sender, `❌ Invalid or expired link code. Please generate a new one in the app.`);
      return;
    }
  }

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
  let parsed: ParsedMessage | null = null;
  let reply: string;

  if (message.text) {
    parsed = await parseTransaction(message.text);
  }

  // ── 4. Save transaction(s) if financial ──────────────────────────────────────
  let savedCount = 0;
  if (parsed?.isFinancial && parsed.transactions.length > 0 && user) {
    for (const txn of parsed.transactions) {
      if (txn.amount) {
        const saved = await saveTransaction(user.id, txn);
        if (saved) savedCount++;
      }
    }
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
  reply = buildReply(message.text, parsed, savedCount);
  await sendMessage(message.sender, reply);
  logger.info({ sender: message.sender, savedCount }, 'Reply sent');
}

/**
 * Build a friendly WhatsApp reply based on parsing result.
 */
function buildReply(
  text: string | null,
  parsed: ParsedMessage | null,
  savedCount: number
): string {
  if (!parsed || !parsed.isFinancial || parsed.transactions.length === 0) {
    return (
      `👋 Hey! I'm your Finance Assistant.\n\n` +
      `I can record your transactions. Try sending:\n` +
      `• "Spent 450 on Pizza Hut"\n` +
      `• "Spent 1000 total, 400 on food and 600 on cab"\n` +
      `• "Received 5000 salary"`
    );
  }

  if (savedCount === 0) {
    return `🤔 I understood this is a financial transaction, but couldn't figure out the amounts. Could you resend with the exact amounts? E.g. "Spent ₹450 on food"`;
  }

  let reply = `✅ Saved ${savedCount} transaction${savedCount > 1 ? 's' : ''} to your journal:\n\n`;

  for (const txn of parsed.transactions) {
    if (!txn.amount) continue;

    const emoji = {
      expense: '💸',
      income: '💰',
      transfer: '↔️',
      loan: '🤝',
      investment: '📈',
      subscription: '🔄',
      unknown: '📝',
    }[txn.type] ?? '📝';

    const typeLabel = txn.type.charAt(0).toUpperCase() + txn.type.slice(1);
    const amountStr = `₹${txn.amount.toLocaleString('en-IN')}`;

    reply += `${emoji} *${typeLabel}*: ${amountStr}\n`;
    if (txn.merchant) reply += `   🏪 ${txn.merchant}\n`;
    if (txn.category) reply += `   🏷️ ${txn.category}\n`;
    reply += `\n`;
  }

  return reply.trimEnd();
}
