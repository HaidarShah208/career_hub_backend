import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { usersController } from './users.controller';
import { changePasswordSchema } from './users.validation';

const router = Router();

router.get('/me', authenticate, asyncHandler(usersController.me.bind(usersController)));
router.patch(
  '/me/password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword.bind(usersController)),
);
router.delete('/me', authenticate, asyncHandler(usersController.deleteMe.bind(usersController)));

export default router;
