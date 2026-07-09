import { Router } from 'express';
import { adminOnly, authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { idParamSchema } from '../../shared/validators/common';
import { adminController } from './admin.controller';
import {
  createCategorySchema,
  listApplicationsSchema,
  listCompaniesSchema,
  listJobsSchema,
  listUsersSchema,
  updateCategorySchema,
  updateUserStatusSchema,
  verifyCompanySchema,
} from './admin.validation';

const router = Router();

// Every admin route requires a valid token AND the ADMIN role.
router.use(authenticate, adminOnly);

router.get('/dashboard', asyncHandler(adminController.dashboard.bind(adminController)));

router.get(
  '/users',
  validate(listUsersSchema),
  asyncHandler(adminController.users.bind(adminController)),
);

router.patch(
  '/users/:id/status',
  validate(updateUserStatusSchema),
  asyncHandler(adminController.updateUserStatus.bind(adminController)),
);

router.get(
  '/employers/pending',
  asyncHandler(adminController.pendingEmployers.bind(adminController)),
);

router.patch(
  '/companies/:id/verification',
  validate(verifyCompanySchema),
  asyncHandler(adminController.verifyCompany.bind(adminController)),
);

router.get('/analytics', asyncHandler(adminController.analytics.bind(adminController)));

router.get('/revenue', asyncHandler(adminController.revenue.bind(adminController)));

router.get('/categories', asyncHandler(adminController.categories.bind(adminController)));

router.post(
  '/categories',
  validate(createCategorySchema),
  asyncHandler(adminController.createCategory.bind(adminController)),
);

router.patch(
  '/categories/:id',
  validate(updateCategorySchema),
  asyncHandler(adminController.updateCategory.bind(adminController)),
);

router.delete(
  '/categories/:id',
  validate(idParamSchema),
  asyncHandler(adminController.deleteCategory.bind(adminController)),
);

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
