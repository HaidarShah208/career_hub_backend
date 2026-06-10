import { Router } from 'express';
import { UserRole } from '../../shared/constants';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { idParamSchema } from '../../shared/validators/common';
import { updateApplicationStatusSchema } from '../applications/applications.validation';
import { employerController } from './employer.controller';
import {
  createEmployerCompanySchema,
  createEmployerJobSchema,
  listApplicantsSchema,
  listEmployerJobsSchema,
  updateEmployerCompanySchema,
  updateEmployerJobSchema,
} from './employer.validation';

const router = Router();
const c = employerController;

// Every employer route requires a valid token AND the EMPLOYER role.
router.use(authenticate, authorize(UserRole.EMPLOYER));

// ---- Company (one per employer) ----
router.post('/company', validate(createEmployerCompanySchema), asyncHandler(c.createCompany.bind(c)));
router.get('/company', asyncHandler(c.getCompany.bind(c)));
router.put('/company', validate(updateEmployerCompanySchema), asyncHandler(c.updateCompany.bind(c)));
router.delete('/company', asyncHandler(c.deleteCompany.bind(c)));

// ---- Jobs ----
router.post('/jobs', validate(createEmployerJobSchema), asyncHandler(c.createJob.bind(c)));
router.get('/jobs', validate(listEmployerJobsSchema), asyncHandler(c.listJobs.bind(c)));
router.get('/jobs/:id', validate(idParamSchema), asyncHandler(c.getJob.bind(c)));
router.put('/jobs/:id', validate(updateEmployerJobSchema), asyncHandler(c.updateJob.bind(c)));
router.delete('/jobs/:id', validate(idParamSchema), asyncHandler(c.deleteJob.bind(c)));
router.patch('/jobs/:id/publish', validate(idParamSchema), asyncHandler(c.publishJob.bind(c)));
router.patch('/jobs/:id/close', validate(idParamSchema), asyncHandler(c.closeJob.bind(c)));

// ---- Applicants ----
router.get('/applicants', validate(listApplicantsSchema), asyncHandler(c.listApplicants.bind(c)));
router.get('/applicants/:id', validate(idParamSchema), asyncHandler(c.getApplicant.bind(c)));

// ---- Application status management ----
router.patch(
  '/applications/:id/status',
  validate(updateApplicationStatusSchema),
  asyncHandler(c.updateApplicationStatus.bind(c)),
);

// ---- Dashboard ----
router.get('/dashboard', asyncHandler(c.dashboard.bind(c)));

// ---- Analytics ----
router.get('/analytics', asyncHandler(c.analytics.bind(c)));

export default router;
