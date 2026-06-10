import { z } from 'zod';
import { UserRole } from '../../shared/constants';
import { idParamSchema, paginationQuerySchema } from '../../shared/validators/common';

/**
 * Admin list endpoints reuse the same query validation as their public
 * counterparts, re-exported here so the admin module stays self-describing.
 */
export { listJobsSchema } from '../jobs/jobs.validation';
export { listApplicationsSchema } from '../applications/applications.validation';
export { listCompaniesSchema } from '../companies/companies.validation';

export const listUsersSchema = z.object({
  query: paginationQuerySchema.extend({
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const updateUserStatusSchema = idParamSchema.extend({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const verifyCompanySchema = idParamSchema.extend({
  body: z.object({
    verified: z.boolean(),
  }),
});
