import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/validators/common';

const currentYear = new Date().getFullYear();

const companyFields = {
  name: z.string().min(2, 'Company name is too short').max(255),
  description: z.string().max(5000).optional(),
  website: z.string().url('Website must be a valid URL').max(255).optional().or(z.literal('')),
  location: z.string().max(255).optional(),
  logo: z.string().url('Logo must be a valid URL').max(512).optional().or(z.literal('')),
  industry: z.string().max(120).optional(),
  companySize: z.string().max(50).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(currentYear + 1).optional(),
  ownerId: z.string().uuid('ownerId must be a valid UUID').optional(),
};

export const createCompanySchema = z.object({
  body: z.object({
    ...companyFields,
    name: companyFields.name,
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({ id: z.string().uuid('A valid company id is required') }),
  body: z
    .object({
      ...companyFields,
      name: companyFields.name.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

export const listCompaniesSchema = z.object({
  query: paginationQuerySchema,
});
