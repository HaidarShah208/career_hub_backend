import { z } from 'zod';
import { PAGINATION } from '../constants';

/** Reusable UUID path param schema: { params: { id } }. */
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('A valid resource id is required'),
  }),
});

/** Reusable pagination + search query schema. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .optional()
    .default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().trim().optional(),
  sortOrder: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .transform((v) => v.toUpperCase() as 'ASC' | 'DESC')
    .optional()
    .default('DESC'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
