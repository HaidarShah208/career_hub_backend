import { Router } from 'express';
import { UserRole } from '../../shared/constants';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { candidatesController } from './candidates.controller';
import { updateProfileSchema } from './candidates.validation';

const router = Router();

// All candidate profile routes require an authenticated CANDIDATE.
router.use(authenticate, authorize(UserRole.CANDIDATE));

router.get('/profile', asyncHandler(candidatesController.getProfile.bind(candidatesController)));

router.put(
  '/profile',
  validate(updateProfileSchema),
  asyncHandler(candidatesController.updateProfile.bind(candidatesController)),
);

export default router;
