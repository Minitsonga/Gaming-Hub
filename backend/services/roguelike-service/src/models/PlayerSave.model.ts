import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillInstance {
  skillId: string;
  rarityHistory: number[];
  isPermanent: boolean;
}

export interface ISaveData {
  ownedSkills: ISkillInstance[];
  level: number;
  xp: number;
  xyst: number;
  runsCompleted: number;
  highestWave: number;
  totalKills: number;
}

export interface IPlayerSave extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  gameSlug: string;
  saveData: ISaveData;
  playtimeMinutes: number;
  lastPlayed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillInstanceSchema = new Schema<ISkillInstance>(
  {
    skillId: { type: String, required: true },
    rarityHistory: [{ type: Number }],
    isPermanent: { type: Boolean, default: false },
  },
  { _id: false }
);

const SaveDataSchema = new Schema<ISaveData>(
  {
    ownedSkills: [SkillInstanceSchema],
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    xyst: { type: Number, default: 0 },
    runsCompleted: { type: Number, default: 0 },
    highestWave: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
  },
  { _id: false }
);

const PlayerSaveSchema = new Schema<IPlayerSave>(
  {
    userId: { type: String, required: true },
    gameSlug: { type: String, required: true },
    saveData: { type: SaveDataSchema, default: () => ({}) },
    playtimeMinutes: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PlayerSaveSchema.index({ userId: 1, gameSlug: 1 }, { unique: true });

export const PlayerSave = mongoose.model<IPlayerSave>('PlayerSave', PlayerSaveSchema);
