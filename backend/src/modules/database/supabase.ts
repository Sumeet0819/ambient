import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { logger } from '../../shared/logger';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client configured with the service role key.
 * The service role key bypasses Row Level Security — use only on the server side.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('✅  Supabase client initialised');
  }
  return supabaseInstance;
}
