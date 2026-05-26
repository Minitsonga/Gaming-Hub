import { describe, expect, it } from 'vitest';

import { parseGameBridgeMessage } from './game-bridge';

describe('parseGameBridgeMessage', () => {
  it('parse les messages canoniques', () => {
    expect(
      parseGameBridgeMessage({
        type: 'PENDING_ROLLS',
        payload: { count: 2 },
      })
    ).toEqual({ type: 'PENDING_ROLLS', payload: { count: 2 } });
  });

  it('accepte des alias de type et de champs', () => {
    expect(
      parseGameBridgeMessage({
        type: 'level_up',
        payload: { pendingRolls: 1 },
      })
    ).toEqual({ type: 'PENDING_ROLLS', payload: { count: 1 } });

    expect(
      parseGameBridgeMessage({
        type: 'xyst_update',
        payload: { totalXyst: 9 },
      })
    ).toEqual({ type: 'XYST_UPDATED', payload: { xyst: 9 } });
  });

  it('normalise RUN_ENDED et game over', () => {
    expect(
      parseGameBridgeMessage({
        type: 'RUN_ENDED',
        payload: {
          levelReached: 2,
          totalXP: 200,
          enemiesKilled: 2,
          xystEarned: 13,
          totalXyst: 13,
          runDuration: 30,
          playtimeMinutes: 0.51,
          score: 1200,
          skillsAcquired: [],
          saveData: { level: 2, xp: 200, xyst: 13, ownedSkills: [] },
        },
      })
    )?.toMatchObject({
      type: 'RUN_ENDED',
      payload: { totalXyst: 13, saveData: { xyst: 13, ownedSkills: [] } },
    });

    expect(
      parseGameBridgeMessage({
        type: 'RUN_STATE_CHANGED',
        payload: { state: 'game over' },
      })
    )?.toEqual({ type: 'RUN_STATE_CHANGED', payload: { state: 'game-over' } });
  });

  it('déroule un message JSON stringifié', () => {
    expect(
      parseGameBridgeMessage(
        JSON.stringify({ type: 'XYST_UPDATED', payload: { xyst: 42 } })
      )
    ).toEqual({ type: 'XYST_UPDATED', payload: { xyst: 42 } });
  });
});
