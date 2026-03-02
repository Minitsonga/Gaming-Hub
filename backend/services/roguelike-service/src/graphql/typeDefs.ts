import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

  type SkillInstance {
    skillId: String!
    rarityHistory: [Int!]!
    isPermanent: Boolean!
  }

  type SaveData {
    ownedSkills: [SkillInstance!]!
    level: Int!
    xp: Int!
    xyst: Int!
    runsCompleted: Int!
    highestWave: Int!
    totalKills: Int!
  }

  type PlayerSave @key(fields: "id") {
    id: ID!
    userId: String!
    gameSlug: String!
    saveData: SaveData!
    playtimeMinutes: Int!
    lastPlayed: String!
  }

  type SkillDefinition {
    skillId: String!
    displayName: String!
    descriptionTemplate: String!
    iconUrl: String!
    category: String!
    baseValue: Float!
    maxStacks: Int!
    canBeMythical: Boolean!
    mythicalXystCost: Int!
    isUnlockable: Boolean!
  }

  type WebEvent {
    id: ID!
    gameSlug: String!
    label: String!
    iconUrl: String!
    effectTarget: String!
    effectValue: Float!
    effectDurationSeconds: Int
    spawnWeightBase: Int!
  }

  type ClickEventResult {
    event: WebEvent!
    newSaveData: SaveData!
  }

  input SkillInstanceInput {
    skillId: String!
    rarityHistory: [Int!]!
    isPermanent: Boolean!
  }

  input SaveDataInput {
    ownedSkills: [SkillInstanceInput!]
    level: Int
    xp: Int
    xyst: Int
    runsCompleted: Int
    highestWave: Int
    totalKills: Int
  }

  type Query {
    mySave(gameSlug: String!): PlayerSave
    skills(category: String): [SkillDefinition!]!
    activeWebEvents(gameSlug: String!): [WebEvent!]!
  }

  type Mutation {
    upsertSave(gameSlug: String!, saveData: SaveDataInput!, playtimeMinutes: Int): PlayerSave!
    clickWebEvent(eventId: ID!, gameSlug: String!): ClickEventResult!
  }
`;
