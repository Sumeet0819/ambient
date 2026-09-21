import { getSupabaseClient } from '../modules/database/supabase';
import { logger } from '../shared/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function clearSessions() {
  const supabase = getSupabaseClient();
  logger.info('Clearing all WhatsApp sessions from Supabase...');
  
  // Delete all rows in the whatsapp_sessions table (matches any id that is not empty)
  const { error } = await supabase.from('whatsapp_sessions').delete().neq('id', 'non-existent-id');
  
  if (error) {
    logger.error({ error }, 'Failed to clear sessions');
  } else {
    logger.info('Successfully cleared WhatsApp sessions! You can now restart your backend to scan the new QR code.');
  }
}

clearSessions();
