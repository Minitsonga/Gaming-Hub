import mongoose, { Schema, Document } from 'mongoose';

export type EventEffectTarget = 'player_xp' | 'player_xyst' | 'buff_attack' | 'buff_speed';

export interface IWebEvent extends Document {
  _id: mongoose.Types.ObjectId;
  gameSlug: string;
  label: string;
  iconUrl: string;
  effectTarget: EventEffectTarget;
  effectValue: number;
  effectDurationSeconds: number | null;
  spawnWeightBase: number;
  isActive: boolean;
}

const WebEventSchema = new Schema<IWebEvent>(
  {
    gameSlug: { type: String, required: true },
    label: { type: String, required: true },
    iconUrl: { type: String, default: '' },
    effectTarget: {
      type: String,
      enum: ['player_xp', 'player_xyst', 'buff_attack', 'buff_speed'],
      required: true,
    },
    effectValue: { type: Number, required: true },
    effectDurationSeconds: { type: Number, default: null },
    spawnWeightBase: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WebEvent = mongoose.model<IWebEvent>('WebEvent', WebEventSchema);
