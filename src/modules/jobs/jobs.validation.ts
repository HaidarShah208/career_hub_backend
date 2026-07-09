import { z } from 'zod';
import { EmploymentType, JobStatus } from '../../shared/constants';
import { paginationQuerySchema } from '../../shared/validators/common';

const salaryRefinement = (data: { salaryMin?: number; salaryMax?: number }) =>
  data.salaryMin === undefined ||
  data.salaryMax === undefined ||
  data.salaryMax >= data.salaryMin;

/** Optional rich fields shared by create/update job schemas. */
export const richJobFields = {
  category: z.string().max(60).optional(),
  experienceLevel: z.string().max(30).optional(),
  skills: z.array(z.string().max(60)).max(50).optional(),
  applyMethod: z.enum(['internal', 'external']).optional(),
  applyUrl: z.string().url('applyUrl must be a valid URL').max(512).optional().or(z.literal('')),
  isUrgent: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
};

export const createJobSchema = z.object({
  body: z
    .object({
      title: z.string({ required_error: 'Title is required' }).min(3, 'Title is too short').max(255),
      description: z.string({ required_error: 'Description is required' }).min(20, 'Description must be at least 20 characters'),
      location: z.string().max(255).optional(),
      employmentType: z.nativeEnum(EmploymentType).optional(),
      salaryMin: z.coerce.number().int().nonnegative().optional(),
      salaryMax: z.coerce.number().int().nonnegative().optional(),
      ...richJobFields,
      status: z.nativeEnum(JobStatus).optional(),
      companyId: z.string({ required_error: 'companyId is required' }).uuid('companyId must be a valid UUID'),
    })
    .refine(salaryRefinement, {
      path: ['salaryMax'],
      message: 'salaryMax must be greater than or equal to salaryMin',
    }),
});

export const updateJobSchema = z.object({
  params: z.object({ id: z.string().uuid('A valid job id is required') }),
  body: z
    .object({
      title: z.string().min(3).max(255).optional(),
      description: z.string().min(20).optional(),
      location: z.string().max(255).optional(),
      employmentType: z.nativeEnum(EmploymentType).optional(),
      salaryMin: z.coerce.number().int().nonnegative().optional(),
      salaryMax: z.coerce.number().int().nonnegative().optional(),
      ...richJobFields,
      status: z.nativeEnum(JobStatus).optional(),
    })
    .refine(salaryRefinement, {
      path: ['salaryMax'],
      message: 'salaryMax must be greater than or equal to salaryMin',
    }),
});

export const listJobsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.nativeEnum(JobStatus).optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    companyId: z.string().uuid().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    category: z.string().max(60).optional(),
    experienceLevel: z.string().max(30).optional(),
    salaryMin: z.coerce.number().int().nonnegative().optional(),
    salaryMax: z.coerce.number().int().nonnegative().optional(),
  }),
});
