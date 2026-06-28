import { Router, Request, Response } from 'express';
import { requestOtp, verifyOtp } from './auth.service';

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

export default router;
