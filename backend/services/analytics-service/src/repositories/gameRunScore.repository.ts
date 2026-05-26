import { GameRunScore, IGameRunScore } from '../models/GameRunScore.model';
import {
  compareBySort,
  isBetterForScoreBoard,
  isBetterForTimeBoard,
  LEADERBOARD_TOP_N,
  type LeaderboardSortBy,
  type RunScoreTuple,
} from '../utils/runRanking.util';

export interface RecordGameRunInput {
  userId: string;
  playerName: string;
  gameSlug: string;
  score: number;
  runDurationSeconds: number;
}

export interface LeaderboardEntryView {
  id: string;
  userId: string;
  playerName: string;
  gameSlug: string;
  score: number;
  runDurationSeconds: number;
  rank: number;
  isViewer: boolean;
}

export interface LeaderboardPayload {
  sortBy: LeaderboardSortBy;
  top: LeaderboardEntryView[];
  viewer: LeaderboardEntryView | null;
  totalPlayers: number;
}

function normalizeDoc(doc: IGameRunScore): IGameRunScore {
  const legacyScore = doc.score ?? 0;
  const legacyDuration = doc.runDurationSeconds ?? Number.MAX_SAFE_INTEGER;

  if (doc.bestScore === undefined || doc.bestScore === 0) {
    doc.bestScore = legacyScore;
  }
  if (
    doc.bestScoreDuration === undefined ||
    doc.bestScoreDuration === Number.MAX_SAFE_INTEGER
  ) {
    doc.bestScoreDuration =
      doc.runDurationSeconds !== undefined ? legacyDuration : Number.MAX_SAFE_INTEGER;
  }
  if (
    doc.bestTimeDuration === undefined ||
    doc.bestTimeDuration === Number.MAX_SAFE_INTEGER
  ) {
    doc.bestTimeDuration =
      doc.runDurationSeconds !== undefined ? legacyDuration : Number.MAX_SAFE_INTEGER;
  }
  if (doc.bestTimeScore === undefined) {
    doc.bestTimeScore = legacyScore;
  }

  return doc;
}

function projection(doc: IGameRunScore, sortBy: LeaderboardSortBy): RunScoreTuple {
  const d = normalizeDoc(doc);
  if (sortBy === 'TIME') {
    return { score: d.bestTimeScore, runDurationSeconds: d.bestTimeDuration };
  }
  return { score: d.bestScore, runDurationSeconds: d.bestScoreDuration };
}

function hasValidEntry(doc: IGameRunScore, sortBy: LeaderboardSortBy): boolean {
  const p = projection(doc, sortBy);
  if (sortBy === 'TIME') {
    return Number.isFinite(p.runDurationSeconds) && p.runDurationSeconds < Number.MAX_SAFE_INTEGER;
  }
  return p.score > 0;
}

export class GameRunScoreRepository {
  async findPlayerEntry(userId: string, gameSlug: string): Promise<IGameRunScore | null> {
    const doc = await GameRunScore.findOne({ userId, gameSlug });
    return doc ? normalizeDoc(doc) : null;
  }

  async findAllByGame(gameSlug: string): Promise<IGameRunScore[]> {
    const rows = await GameRunScore.find({ gameSlug });
    return rows.map((r) => normalizeDoc(r));
  }

  async recordPlayerRun(input: RecordGameRunInput): Promise<{
    doc: IGameRunScore;
    scoreImproved: boolean;
    timeImproved: boolean;
  }> {
    const { userId, gameSlug, playerName, score, runDurationSeconds } = input;
    const candidate: RunScoreTuple = { score, runDurationSeconds };

    let doc = await GameRunScore.findOne({ userId, gameSlug });
    if (!doc) {
      doc = await GameRunScore.create({
        userId,
        gameSlug,
        playerName,
        bestScore: 0,
        bestScoreDuration: Number.MAX_SAFE_INTEGER,
        bestTimeDuration: Number.MAX_SAFE_INTEGER,
        bestTimeScore: 0,
        playedAt: new Date(),
      });
    }

    normalizeDoc(doc);
    doc.playerName = playerName;

    const scoreRef: RunScoreTuple = {
      score: doc.bestScore,
      runDurationSeconds: doc.bestScoreDuration,
    };
    const timeRef: RunScoreTuple = {
      score: doc.bestTimeScore,
      runDurationSeconds: doc.bestTimeDuration,
    };

    let scoreImproved = false;
    let timeImproved = false;

    if (isBetterForScoreBoard(candidate, scoreRef)) {
      doc.bestScore = candidate.score;
      doc.bestScoreDuration = candidate.runDurationSeconds;
      scoreImproved = true;
    }

    if (isBetterForTimeBoard(candidate, timeRef)) {
      doc.bestTimeDuration = candidate.runDurationSeconds;
      doc.bestTimeScore = candidate.score;
      timeImproved = true;
    }

    doc.playedAt = new Date();
    await doc.save();

    return { doc, scoreImproved, timeImproved };
  }

  async leaderboardForGame(
    gameSlug: string,
    sortBy: LeaderboardSortBy,
    viewerUserId: string | null,
    limit = LEADERBOARD_TOP_N
  ): Promise<LeaderboardPayload> {
    const capped = Math.min(Math.max(1, limit), LEADERBOARD_TOP_N);
    const all = await this.findAllByGame(gameSlug);
    const eligible = all.filter((doc) => hasValidEntry(doc, sortBy));

    const ranked = eligible
      .map((doc) => ({
        doc,
        view: projection(doc, sortBy),
      }))
      .sort((a, b) => compareBySort(a.view, b.view, sortBy))
      .map((row, index) => {
        const rank = index + 1;
        const isViewer = viewerUserId !== null && row.doc.userId === viewerUserId;
        return {
          id: row.doc._id.toString(),
          userId: row.doc.userId,
          playerName: row.doc.playerName,
          gameSlug: row.doc.gameSlug,
          score: row.view.score,
          runDurationSeconds: row.view.runDurationSeconds,
          rank,
          isViewer,
        };
      });

    const top = ranked.slice(0, capped);
    const viewerInTop = viewerUserId
      ? top.some((e) => e.userId === viewerUserId)
      : false;
    const viewerFull = viewerUserId
      ? ranked.find((e) => e.userId === viewerUserId) ?? null
      : null;

    return {
      sortBy,
      top,
      viewer: viewerInTop || !viewerFull ? null : viewerFull,
      totalPlayers: ranked.length,
    };
  }

  async myRecords(userId: string): Promise<
    Array<{
      gameSlug: string;
      playerName: string;
      bestScore: number;
      bestScoreDuration: number;
      bestTimeDuration: number;
      bestTimeScore: number;
      rankScore: number | null;
      rankTime: number | null;
    }>
  > {
    const mine = await GameRunScore.find({ userId });
    const results = [];

    for (const raw of mine) {
      const doc = normalizeDoc(raw);
      const scoreBoard = await this.leaderboardForGame(doc.gameSlug, 'SCORE', userId, 1);
      const timeBoard = await this.leaderboardForGame(doc.gameSlug, 'TIME', userId, 1);
      const viewerScore =
        scoreBoard.viewer ??
        scoreBoard.top.find((e) => e.userId === userId) ??
        null;
      const viewerTime =
        timeBoard.viewer ?? timeBoard.top.find((e) => e.userId === userId) ?? null;

      results.push({
        gameSlug: doc.gameSlug,
        playerName: doc.playerName,
        bestScore: doc.bestScore,
        bestScoreDuration: doc.bestScoreDuration,
        bestTimeDuration: doc.bestTimeDuration,
        bestTimeScore: doc.bestTimeScore,
        rankScore: viewerScore?.rank ?? null,
        rankTime: viewerTime?.rank ?? null,
      });
    }

    return results;
  }
}
