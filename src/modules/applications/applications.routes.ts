import { Router } from 'express';
import { UserRole } from '../../shared/constants';
import { adminOnly, authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { idParamSchema } from '../../shared/validators/common';
import { applicationsController } from './applications.controller';
import {
  createApplicationSchema,
  listApplicationsSchema,
  updateApplicationStatusSchema,
} from './applications.validation';

const router = Router();

// The current candidate's own applications. Declared before `/:id` so the
// literal path is matched first.
router.get(
  '/my',
  authenticate,
  authorize(UserRole.CANDIDATE),
  validate(listApplicationsSchema),
  asyncHandler(applicationsController.listMine.bind(applicationsController)),
);

router.get(
  '/',
  authenticate,
  validate(listApplicationsSchema),
  asyncHandler(applicationsController.list.bind(applicationsController)),
);

router.get(
  '/:id',
  authenticate,
  validate(idParamSchema),
  asyncHandler(applicationsController.getById.bind(applicationsController)),
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.CANDIDATE),
  validate(createApplicationSchema),
  asyncHandler(applicationsController.create.bind(applicationsController)),
);

// Admin moderates application status (drives the timeline).
router.patch(
  '/:id/status',
  authenticate,
  adminOnly,
  validate(updateApplicationStatusSchema),
  asyncHandler(applicationsController.updateStatus.bind(applicationsController)),
);

export default router;
