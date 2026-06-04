import { z } from 'zod';
import { ApplicationStatus } from '../../shared/constants';
import { paginationQuerySchema } from '../../shared/validators/common';

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string({ required_error: 'jobId is required' }).uuid('jobId must be a valid UUID'),
  }),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({ id: z.string().uuid('A valid application id is required') }),
  body: z.object({
    status: z.nativeEnum(ApplicationStatus),
    note: z.string().max(255).optional(),
  }),
});

export const listApplicationsSchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.nativeEnum(ApplicationStatus).optional(),
    jobId: z.string().uuid().optional(),
  }),
});
