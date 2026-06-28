import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '../database/supabase';
import { config } from '../../config';
import { logger } from '../../shared/logger';

/**
 * Request OTP to be sent to a phone number via Supabase Auth.
 */
export async function requestOtp(phoneNumber: string): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();

  // Format phone number with country code if not present
  const formatted = formatPhone(phoneNumber);

  const { error } = await supabase.auth.signInWithOtp({ phone: formatted });

  if (error) {
    logger.error({ error, phoneNumber }, 'Failed to send OTP');
    return { error: error.message };
  }

  return {};
}

/**
 * Verify OTP and return our own JWT for the mobile app.
 */
export async function verifyOtp(
  phoneNumber: string,
  token: string,
): Promise<{ jwt?: string; userId?: string; error?: string }> {
  const supabase = getSupabaseClient();
  const formatted = formatPhone(phoneNumber);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token,
    type: 'sms',
  });

  if (error || !data.user) {
    logger.error({ error, phoneNumber }, 'OTP verification failed');
    return { error: error?.message ?? 'Verification failed' };
  }

  // Find or create user in our users table
  const phoneWithoutPlus = formatted.replace('+', '');
  let { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('phone_number', phoneWithoutPlus)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ phone_number: phoneWithoutPlus })
      .select('id')
      .single();
    user = newUser;
  }

  if (!user) {
    return { error: 'Failed to create user record' };
  }

  // Issue our own JWT
  const token_out = jwt.sign(
    { userId: user.id, phoneNumber: phoneWithoutPlus },
    config.JWT_SECRET,
    { expiresIn: '30d' },
  );

  logger.info({ userId: user.id }, '✅  User authenticated');
  return { jwt: token_out, userId: user.id };
}

function formatPhone(phone: string): string {
  // Add +91 if no country code
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('91') && phone.length === 12) return `+${phone}`;
  return `+91${phone}`;
}
