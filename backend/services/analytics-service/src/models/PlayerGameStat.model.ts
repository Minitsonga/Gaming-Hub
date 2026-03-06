import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerGameStat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  gameSlug: string;
  playtimeMinutes: number;
  runsCompleted: number;
  metrics: Record<string, number>;
  lastPlayedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerGameStatSchema = new Schema<IPlayerGameStat>(
  {
    userId: { type: String, required: true, index: true },
    gameSlug: { type: String, required: true, index: true },
    playtimeMinutes: { type: Number, required: true, default: 0 },
    runsCompleted: { type: Number, required: true, default: 0 },
    metrics: {
      type: Map,
      of: Number,
      default: {},
    },
    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PlayerGameStatSchema.index({ userId: 1, gameSlug: 1 }, { unique: true });

export const PlayerGameStat = mongoose.model<IPlayerGameStat>(
  'PlayerGameStat',
  PlayerGameStatSchema
);
