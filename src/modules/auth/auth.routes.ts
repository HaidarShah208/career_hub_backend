import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { authController } from './auth.controller';
import {
  forgotPasswordSchema,
  refreshSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} from './auth.validation';

const router = Router();

// Throttle auth endpoints to slow down brute-force / credential-stuffing.
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
  asyncHandler(authController.signUp.bind(authController)),
);

router.post(
  '/signin',
  authLimiter,
  validate(signInSchema),
  asyncHandler(authController.signIn.bind(authController)),
);

router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail.bind(authController)),
);

router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(authController.resendVerification.bind(authController)),
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword.bind(authController)),
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword.bind(authController)),
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshSchema),
  asyncHandler(authController.refresh.bind(authController)),
);

router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

export default router;
