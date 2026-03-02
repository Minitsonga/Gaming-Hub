import { RecordGameplayStatsSchema, UpsertPlayerMetricSchema } from '../../../src/utils/validators';

describe('analytics validators', () => {
  it('RecordGameplayStatsSchema should accept valid input', () => {
    const result = RecordGameplayStatsSchema.safeParse({
      userId: 'u1',
      gameSlug: 'roguelike-core',
      playtimeMinutes: 10,
      runsCompleted: 1,
      metrics: { xp: 120 },
    });
    expect(result.success).toBe(true);
  });

  it('RecordGameplayStatsSchema should reject invalid payload', () => {
    const result = RecordGameplayStatsSchema.safeParse({
      userId: '',
      gameSlug: 'roguelike-core',
      playtimeMinutes: -1,
      runsCompleted: 1,
    });
    expect(result.success).toBe(false);
  });

  it('UpsertPlayerMetricSchema should validate metric update', () => {
    const result = UpsertPlayerMetricSchema.safeParse({
      userId: 'u1',
      gameSlug: 'platformer',
      metric: 'bestTimeSeconds',
      value: 89,
    });
    expect(result.success).toBe(true);
  });
});
