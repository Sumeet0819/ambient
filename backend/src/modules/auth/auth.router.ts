import { Router, Request, Response } from 'express';
import { requestOtp, verifyOtp, registerWithEmail, loginWithEmail, linkWhatsAppPhone } from './auth.service';

const router = Router();

/**
 * POST /api/v1/auth/request-otp
 * Body: { phoneNumber: string }
 */
router.post('/request-otp', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    res.status(400).json({ error: 'phoneNumber is required' });
    return;
  }

  const result = await requestOtp(phoneNumber);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'OTP sent successfully' });
});

/**
 * POST /api/v1/auth/verify-otp
 * Body: { phoneNumber: string, otp: string }
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    res.status(400).json({ error: 'phoneNumber and otp are required' });
    return;
  }

  const result = await verifyOtp(phoneNumber, otp);
  if (result.error) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({ token: result.jwt, userId: result.userId });
});

/**
 * POST /api/v1/auth/register
 * Body: { email: string, password: string }
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const result = await registerWithEmail(email, password);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ token: result.jwt, userId: result.userId });
});

/**
 * POST /api/v1/auth/login
 * Body: { email: string, password: string }
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const result = await loginWithEmail(email, password);
  if (result.error) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({ token: result.jwt, userId: result.userId });
});

/**
 * POST /api/v1/auth/link-phone
 * Body: { userId: string, phoneNumber: string }
 */
router.post('/link-phone', async (req: Request, res: Response) => {
  const { userId, phoneNumber } = req.body;
  if (!userId || !phoneNumber) {
    res.status(400).json({ error: 'userId and phoneNumber are required' });
    return;
  }

  const result = await linkWhatsAppPhone(userId, phoneNumber);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Phone number linked successfully' });
});

export default router;
