import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { publicController } from './public.controller';

const router = Router();

router.get('/stats', asyncHandler(publicController.stats.bind(publicController)));

export default router;
