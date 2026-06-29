import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
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
  // If it's a WhatsApp LID (usually 15 digits), return as is without +
  if (phone.length > 12 && !phone.startsWith('+')) {
    return phone;
  }
  // Add +91 if no country code for standard Indian numbers
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('91') && phone.length === 12) return `+${phone}`;
  return `+91${phone}`;
}

/**
 * Register a new user with Email and Password
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<{ jwt?: string; userId?: string; error?: string }> {
  const supabase = getSupabaseClient();
  
  // Use the admin API to create the user, which bypasses email confirmation
  // and doesn't pollute the singleton client's session state.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error || !data.user) {
    logger.error({ error, email }, 'Email registration failed');
    return { error: error?.message ?? 'Registration failed' };
  }

  // Insert user record in our users table using the clean service_role client
  let { data: user, error: insertError } = await supabase
    .from('users')
    .insert({ email })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') { // unique violation
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      if (existingUser) {
         user = existingUser;
      } else {
         return { error: 'Failed to create user record' };
      }
    } else {
       logger.error({ insertError, email }, 'Failed to insert user record');
       return { error: 'Failed to create user record' };
    }
  }

  if (!user) {
    return { error: 'Failed to create user record' };
  }

  // Issue our own JWT
  const token_out = jwt.sign(
    { userId: user.id, email },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  );

  logger.info({ userId: user.id }, '✅ User registered via email');
  return { jwt: token_out, userId: user.id };
}

/**
 * Login a user with Email and Password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ jwt?: string; userId?: string; error?: string }> {
  const supabase = getSupabaseClient();
  
  // Create a temporary client for login to avoid polluting the singleton's auth state
  const tempClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await tempClient.auth.signInWithPassword({ email, password });
  
  if (error || !data.user) {
    logger.error({ error, email }, 'Email login failed');
    return { error: error?.message ?? 'Login failed' };
  }

  // Find user in our users table using the clean singleton
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!user) {
    return { error: 'User record not found' };
  }

  // Issue our own JWT
  const token_out = jwt.sign(
    { userId: user.id, email },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  );

  logger.info({ userId: user.id }, '✅ User authenticated via email');
  return { jwt: token_out, userId: user.id };
}

/**
 * Link WhatsApp phone number for an existing user
 */
export async function linkWhatsAppPhone(
  userId: string,
  phoneNumber: string
): Promise<{ error?: string }> {
  const supabase = getSupabaseClient();
  const formatted = formatPhone(phoneNumber).replace('+', '');
  
  const { error } = await supabase
    .from('users')
    .update({ phone_number: formatted })
    .eq('id', userId);

  if (error) {
    logger.error({ error, userId, phoneNumber: formatted }, 'Failed to link phone number');
    return { error: error.message };
  }

  return {};
}

/**
 * Generate a unique code to link WhatsApp
 */
export async function generateLinkCode(
  userId: string
): Promise<{ code?: string; error?: string }> {
  const supabase = getSupabaseClient();
  const code = 'AMB-' + Math.floor(1000 + Math.random() * 9000).toString();

  const { error } = await supabase
    .from('users')
    .update({ link_code: code })
    .eq('id', userId);

  if (error) {
    logger.error({ error, userId }, 'Failed to generate link code');
    return { error: error.message };
  }

  return { code };
}
