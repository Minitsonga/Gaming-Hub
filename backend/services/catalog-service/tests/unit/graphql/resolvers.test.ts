const mockGetGames = jest.fn();
const mockGetGame = jest.fn();
const mockCreateGame = jest.fn();
const mockUpdateGame = jest.fn();
const mockDeleteGame = jest.fn();

jest.mock('../../../src/services/catalog.service', () => ({
  CatalogService: jest.fn().mockImplementation(() => ({
    getGames: mockGetGames,
    getGame: mockGetGame,
    createGame: mockCreateGame,
    updateGame: mockUpdateGame,
    deleteGame: mockDeleteGame,
  })),
}));

import { resolvers } from '../../../src/graphql/resolvers';

describe('catalog resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Query.games should call service with filters', async () => {
    mockGetGames.mockResolvedValue([]);
    await resolvers.Query.games({}, { status: 'published', tag: 'rpg' });
    expect(mockGetGames).toHaveBeenCalledWith({ status: 'published', tag: 'rpg' });
  });

  it('Mutation.createGame should require auth and forward user id', async () => {
    mockCreateGame.mockResolvedValue({ _id: '1' });
    const context = { user: { id: 'dev-1', role: 'developer' } };

    await resolvers.Mutation.createGame({}, { input: { slug: 'my-game' } }, context as any);

    expect(mockCreateGame).toHaveBeenCalledWith({ slug: 'my-game' }, 'dev-1');
  });

  it('Mutation.createGame should throw when unauthenticated', async () => {
    expect(() =>
      resolvers.Mutation.createGame({}, { input: { slug: 'my-game' } }, { user: null } as any)
    ).toThrow('Authentication required');
  });
});
