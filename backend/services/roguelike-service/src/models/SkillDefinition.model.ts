import mongoose, { Schema, Document } from 'mongoose';

export type SkillCategory =
  | 'destruction'
  | 'resilience'
  | 'agility'
  | 'growth'
  | 'mastery'
  | 'martial_arts'
  | 'awakening';

export interface ISkillDefinition extends Document {
  skillId: string;
  displayName: string;
  descriptionTemplate: string;
  iconUrl: string;
  category: SkillCategory;
  baseValue: number;
  maxStacks: number;
  canBeMythical: boolean;
  mythicalXystCost: number;
  isUnlockable: boolean;
}

const SkillDefinitionSchema = new Schema<ISkillDefinition>(
  {
    skillId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    descriptionTemplate: { type: String, required: true },
    iconUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'destruction',
        'resilience',
        'agility',
        'growth',
        'mastery',
        'martial_arts',
        'awakening',
      ],
      required: true,
    },
    baseValue: { type: Number, required: true },
    maxStacks: { type: Number, default: 5 },
    canBeMythical: { type: Boolean, default: false },
    mythicalXystCost: { type: Number, default: 1000 },
    isUnlockable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SkillDefinition = mongoose.model<ISkillDefinition>(
  'SkillDefinition',
  SkillDefinitionSchema
);
