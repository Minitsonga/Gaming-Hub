import mongoose, { Schema, Document } from 'mongoose';

export type GameTechnology = 'unity-webgl' | 'web-native';
export type GameStatus = 'draft' | 'published' | 'archived';

export interface IGame extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  technology: GameTechnology;
  status: GameStatus;
  developerId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    technology: {
      type: String,
      enum: ['unity-webgl', 'web-native'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    developerId: { type: String, required: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const Game = mongoose.model<IGame>('Game', GameSchema);
