import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { signInSchema, signUpSchema } from '../auth/auth.validation';
import { employerAuthController } from './employer-auth.controller';

const router = Router();

// Throttle employer auth endpoints (brute-force / credential-stuffing).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later', errors: [] },
});

router.post(
  '/signup',
  authLimiter,
  validate(signUpSchema),
  asyncHandler(employerAuthController.signUp.bind(employerAuthController)),
);

router.post(
  '/signin',
  authLimiter,
  validate(signInSchema),
  asyncHandler(employerAuthController.signIn.bind(employerAuthController)),
);

export default router;
