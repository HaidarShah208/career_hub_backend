import { Router } from 'express';
import { adminOnly, authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import { idParamSchema } from '../../shared/validators/common';
import { companiesController } from './companies.controller';
import {
  createCompanySchema,
  listCompaniesSchema,
  updateCompanySchema,
} from './companies.validation';

const router = Router();

// Public reads.
router.get(
  '/',
  validate(listCompaniesSchema),
  asyncHandler(companiesController.list.bind(companiesController)),
);

router.get(
  '/:id',
  validate(idParamSchema),
  asyncHandler(companiesController.getById.bind(companiesController)),
);

// Admin-only writes.
router.post(
  '/',
  authenticate,
  adminOnly,
  validate(createCompanySchema),
  asyncHandler(companiesController.create.bind(companiesController)),
);

router.put(
  '/:id',
  authenticate,
  adminOnly,
  validate(updateCompanySchema),
  asyncHandler(companiesController.update.bind(companiesController)),
);

router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validate(idParamSchema),
  asyncHandler(companiesController.remove.bind(companiesController)),
);

export default router;
