import { z } from 'zod';

export const CreateGameSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(100),
  description: z.string().min(10),
  technology: z.enum(['unity-webgl', 'web-native']),
  thumbnailUrl: z.string().url().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

export const UpdateGameSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().min(10).optional(),
  thumbnailUrl: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});
