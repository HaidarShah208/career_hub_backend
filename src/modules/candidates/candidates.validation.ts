import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z
    .object({
      headline: z.string().max(160).optional(),
      bio: z.string().max(5000).optional(),
      skills: z.array(z.string().min(1).max(50)).max(6).optional(),
      experienceYears: z.coerce.number().int().min(0).max(60).optional(),
      city: z.string().max(120).optional(),
      resumeUrl: z.string().url('resumeUrl must be a valid URL').max(512).optional().or(z.literal('')),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Provide at least one field to update',
    }),
});
