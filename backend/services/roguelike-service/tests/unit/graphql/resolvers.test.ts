const mockGetMySave = jest.fn();
const mockUpsertSave = jest.fn();
const mockGetSkills = jest.fn();
const mockGetActiveEvents = jest.fn();
const mockClickEvent = jest.fn();

jest.mock('../../../src/services/save.service', () => ({
  SaveService: jest.fn().mockImplementation(() => ({
    getMySave: mockGetMySave,
    upsertSave: mockUpsertSave,
  })),
}));

jest.mock('../../../src/services/skill.service', () => ({
  SkillService: jest.fn().mockImplementation(() => ({
    getSkills: mockGetSkills,
  })),
}));

jest.mock('../../../src/services/webEvent.service', () => ({
  WebEventService: jest.fn().mockImplementation(() => ({
    getActiveEvents: mockGetActiveEvents,
    clickEvent: mockClickEvent,
  })),
}));

import { resolvers } from '../../../src/graphql/resolvers';

describe('roguelike resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Query.mySave should require auth and call SaveService', async () => {
    mockGetMySave.mockResolvedValue(null);
    const context = { user: { id: 'u1', role: 'user' } };

    await resolvers.Query.mySave({}, { gameSlug: 'roguelike-core' }, context as any);
    expect(mockGetMySave).toHaveBeenCalledWith('u1', 'roguelike-core');
  });

  it('Mutation.upsertSave should validate input and call SaveService', async () => {
    mockUpsertSave.mockResolvedValue({ _id: 'save-1' });
    const context = { user: { id: 'u1', role: 'user' } };

    await resolvers.Mutation.upsertSave(
      {},
      { gameSlug: 'roguelike-core', saveData: { xp: 10, level: 2 }, playtimeMinutes: 5 },
      context as any
    );

    expect(mockUpsertSave).toHaveBeenCalledWith('u1', 'roguelike-core', { xp: 10, level: 2 }, 5);
  });

  it('Mutation.upsertSave should reject invalid saveData', async () => {
    const context = { user: { id: 'u1', role: 'user' } };

    expect(() =>
      resolvers.Mutation.upsertSave(
        {},
        { gameSlug: 'roguelike-core', saveData: { xp: 'invalid' }, playtimeMinutes: 5 },
        context as any
      )
    ).toThrow();
  });
});
