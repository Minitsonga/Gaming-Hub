import { z } from 'zod';

export const RecordGameplayStatsSchema = z.object({
  userId: z.string().min(1),
  gameSlug: z.string().min(1),
  playtimeMinutes: z.number().int().min(0),
  runsCompleted: z.number().int().min(0),
  metrics: z.record(z.string(), z.number()).optional().default({}),
  lastPlayedAt: z.string().datetime().optional(),
});

export const UpsertPlayerMetricSchema = z.object({
  userId: z.string().min(1),
  gameSlug: z.string().min(1),
  metric: z.string().min(1),
  value: z.number(),
});
