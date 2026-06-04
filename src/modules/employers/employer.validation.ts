import { z } from 'zod';
import { ApplicationStatus, EmploymentType, JobStatus } from '../../shared/constants';
import { paginationQuerySchema } from '../../shared/validators/common';

const currentYear = new Date().getFullYear();

const companyFields = {
  name: z.string().min(2, 'Company name is too short').max(255),
  logo: z.string().url('Logo must be a valid URL').max(512).optional().or(z.literal('')),
  website: z.string().url('Website must be a valid URL').max(255).optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  industry: z.string().max(120).optional(),
  companySize: z.string().max(50).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(currentYear + 1).optional(),
  location: z.string().max(255).optional(),
};

export const createEmployerCompanySchema = z.object({
  body: z.object({ ...companyFields }),
});

export const updateEmployerCompanySchema = z.object({
  body: z
    .object({ ...companyFields, name: companyFields.name.optional() })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

const salaryRefinement = (data: { salaryMin?: number; salaryMax?: number }) =>
  data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMax >= data.salaryMin;

export const createEmployerJobSchema = z.object({
  body: z
    .object({
      title: z.string({ required_error: 'Title is required' }).min(3, 'Title is too short').max(255),
      description: z
        .string({ required_error: 'Description is required' })
        .min(20, 'Description must be at least 20 characters'),
      location: z.string().max(255).optional(),
      employmentType: z.nativeEnum(EmploymentType).optional(),
      salaryMin: z.coerce.number().int().nonnegative().optional(),
      salaryMax: z.coerce.number().int().nonnegative().optional(),
      status: z.nativeEnum(JobStatus).optional(),
    })
    .refine(salaryRefinement, {
      path: ['salaryMax'],
      message: 'salaryMax must be greater than or equal to salaryMin',
    }),
});

export const updateEmployerJobSchema = z.object({
  params: z.object({ id: z.string().uuid('A valid job id is required') }),
  body: z
    .object({
      title: z.string().min(3).max(255).optional(),
      description: z.string().min(20).optional(),
      location: z.string().max(255).optional(),
      employmentType: z.nativeEnum(EmploymentType).optional(),
      salaryMin: z.coerce.number().int().nonnegative().optional(),
      salaryMax: z.coerce.number().int().nonnegative().optional(),
      status: z.nativeEnum(JobStatus).optional(),
    })
    .refine(salaryRefinement, {
      path: ['salaryMax'],
      message: 'salaryMax must be greater than or equal to salaryMin',
    }),
});

export const listEmployerJobsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.nativeEnum(JobStatus).optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
  }),
});

export const listApplicantsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.nativeEnum(ApplicationStatus).optional(),
    jobId: z.string().uuid().optional(),
  }),
});
