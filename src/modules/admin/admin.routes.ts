import { Router } from 'express';
import { adminOnly, authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { adminController } from './admin.controller';
import { listApplicationsSchema, listCompaniesSchema, listJobsSchema } from './admin.validation';

const router = Router();

// Every admin route requires a valid token AND the ADMIN role.
router.use(authenticate, adminOnly);

router.get('/dashboard', asyncHandler(adminController.dashboard.bind(adminController)));

router.get(
  '/jobs',
  validate(listJobsSchema),
  asyncHandler(adminController.jobs.bind(adminController)),
);

router.get(
  '/applications',
  validate(listApplicationsSchema),
  asyncHandler(adminController.applications.bind(adminController)),
);

router.get(
  '/companies',
  validate(listCompaniesSchema),
  asyncHandler(adminController.companies.bind(adminController)),
);

export default router;
