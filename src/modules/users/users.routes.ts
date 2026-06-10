import { Router } from 'express';
import { authenticate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { usersController } from './users.controller';

const router = Router();

router.get('/me', authenticate, asyncHandler(usersController.me.bind(usersController)));
router.delete('/me', authenticate, asyncHandler(usersController.deleteMe.bind(usersController)));

export default router;
