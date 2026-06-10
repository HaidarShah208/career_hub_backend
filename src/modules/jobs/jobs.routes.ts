import { Router } from 'express';
import { adminOnly, authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { idParamSchema } from '../../shared/validators/common';
import { jobsController } from './jobs.controller';
import { createJobSchema, listJobsSchema, updateJobSchema } from './jobs.validation';

const router = Router();

// Phase 2: only admins may create / edit / delete jobs.
const writeAccess = [authenticate, adminOnly];

router.get('/', validate(listJobsSchema), asyncHandler(jobsController.list.bind(jobsController)));

router.post(
  '/:id/view',
  validate(idParamSchema),
  asyncHandler(jobsController.recordView.bind(jobsController)),
);

router.get('/:id', validate(idParamSchema), asyncHandler(jobsController.getById.bind(jobsController)));

router.post(
  '/',
  ...writeAccess,
  validate(createJobSchema),
  asyncHandler(jobsController.create.bind(jobsController)),
);

router.put(
  '/:id',
  ...writeAccess,
  validate(updateJobSchema),
  asyncHandler(jobsController.update.bind(jobsController)),
);

router.delete(
  '/:id',
  ...writeAccess,
  validate(idParamSchema),
  asyncHandler(jobsController.remove.bind(jobsController)),
);

export default router;
