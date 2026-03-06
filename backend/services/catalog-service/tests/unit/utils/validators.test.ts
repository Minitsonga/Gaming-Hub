import { CreateGameSchema, UpdateGameSchema } from '../../../src/utils/validators';

describe('catalog validators', () => {
  it('CreateGameSchema should accept valid payload', () => {
    const payload = {
      slug: 'my-game',
      title: 'My Game',
      description: 'A valid description for game creation',
      technology: 'web-native',
      thumbnailUrl: 'https://example.com/img.png',
      tags: ['rpg'],
    };
    const result = CreateGameSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('CreateGameSchema should reject invalid slug', () => {
    const result = CreateGameSchema.safeParse({
      slug: 'INVALID SLUG',
      title: 'My Game',
      description: 'A valid description for game creation',
      technology: 'web-native',
    });
    expect(result.success).toBe(false);
  });

  it('UpdateGameSchema should accept partial update', () => {
    const result = UpdateGameSchema.safeParse({ status: 'published', title: 'New title' });
    expect(result.success).toBe(true);
  });
});
