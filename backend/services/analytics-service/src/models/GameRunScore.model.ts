import mongoose, { Schema, Document } from 'mongoose';

/** Meilleures perfs d'un joueur sur un jeu (tous les joueurs conservés en base). */
export interface IGameRunScore extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  playerName: string;
  gameSlug: string;
  bestScore: number;
  bestScoreDuration: number;
  bestTimeDuration: number;
  bestTimeScore: number;
  /** @deprecated champs legacy */
  score?: number;
  runDurationSeconds?: number;
  playedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameRunScoreSchema = new Schema<IGameRunScore>(
  {
    userId: { type: String, required: true, index: true },
    playerName: { type: String, required: true },
    gameSlug: { type: String, required: true, index: true },
    bestScore: { type: Number, default: 0 },
    bestScoreDuration: { type: Number, default: Number.MAX_SAFE_INTEGER },
    bestTimeDuration: { type: Number, default: Number.MAX_SAFE_INTEGER },
    bestTimeScore: { type: Number, default: 0 },
    score: { type: Number },
    runDurationSeconds: { type: Number },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GameRunScoreSchema.index({ userId: 1, gameSlug: 1 }, { unique: true });
GameRunScoreSchema.index({ gameSlug: 1, bestScore: -1, bestScoreDuration: 1 });
GameRunScoreSchema.index({ gameSlug: 1, bestTimeDuration: 1, bestTimeScore: -1 });

export const GameRunScore = mongoose.model<IGameRunScore>('GameRunScore', GameRunScoreSchema);
