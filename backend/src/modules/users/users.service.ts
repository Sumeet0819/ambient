import { getSupabaseClient } from '../database/supabase';
import { logger } from '../../shared/logger';

export interface User {
  id: string;
  phone_number: string;
  name: string | null;
  created_at: string;
}

/**
 * Find a user by their WhatsApp sender JID or phone number.
 * The sender from Baileys looks like "919624854066@s.whatsapp.net" or "117660763295962@lid".
 * We normalise it to extract the phone number.
 */
export async function findOrCreateUser(senderJid: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  // Normalise sender JID to a phone string
  const phoneNumber = normaliseSender(senderJid);

  // Try to find existing user
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    // PGRST116 = row not found, which is expected
    logger.error({ findError, phoneNumber }, 'Error looking up user');
    return null;
  }

  if (existing) {
    return existing as User;
  }

  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({ phone_number: phoneNumber })
    .select('*')
    .single();

  if (createError) {
    logger.error({ createError, phoneNumber }, 'Error creating user');
    return null;
  }

  logger.info({ phoneNumber }, '👤  New user created');
  return newUser as User;
}

/**
 * Normalise a Baileys JID to a plain phone number string.
 * Examples:
 *   "919624854066:1@s.whatsapp.net" → "919624854066"
 *   "919624854066@s.whatsapp.net"   → "919624854066"
 *   "117660763295962@lid"           → "117660763295962"
 */
function normaliseSender(jid: string): string {
  return jid.split('@')[0].split(':')[0];
}
