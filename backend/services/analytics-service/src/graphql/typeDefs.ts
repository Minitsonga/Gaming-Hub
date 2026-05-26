import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@external"])

  type PlayerGameStats @key(fields: "id") {
    id: ID!
    userId: ID!
    gameSlug: String!
    playtimeMinutes: Int!
    runsCompleted: Int!
    metrics: [MetricEntry!]!
    lastPlayedAt: String!
  }

  type MetricEntry {
    key: String!
    value: Float!
  }

  type GameLeaderboardEntry {
    gameSlug: String!
    totalPlaytimeMinutes: Int!
    totalRuns: Int!
    totalPlayers: Int!
  }

  type PlayerLeaderboardEntry {
    userId: ID!
    gameSlug: String!
    value: Float!
    metric: String!
  }

  enum LeaderboardSortBy {
    SCORE
    TIME
  }

  type GameRunRankedEntry {
    id: ID!
    userId: ID!
    playerName: String!
    gameSlug: String!
    score: Int!
    runDurationSeconds: Float!
    rank: Int!
    isViewer: Boolean!
  }

  type GameRunLeaderboardPayload {
    sortBy: LeaderboardSortBy!
    top: [GameRunRankedEntry!]!
    viewer: GameRunRankedEntry
    totalPlayers: Int!
  }

  type GameRunRankSnapshot {
    score: Int
    time: Int
  }

  type MyGameRecordEntry {
    gameSlug: String!
    playerName: String!
    bestScore: Int!
    bestScoreDuration: Float!
    bestTimeDuration: Float!
    bestTimeScore: Int!
    rankScore: Int
    rankTime: Int
  }

  input RecordRunScoreInput {
    gameSlug: String!
    playerName: String!
    score: Int!
    runDurationSeconds: Float!
  }

  type RecordRunScorePayload {
    run: GameRunRankedEntry!
    scoreImproved: Boolean!
    timeImproved: Boolean!
    personalBestImproved: Boolean!
    ranks: GameRunRankSnapshot!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    profileStats(limit: Int = 20): [PlayerGameStats!]!
  }

  input RecordGameplayStatsInput {
    userId: ID!
    gameSlug: String!
    playtimeMinutes: Int!
    runsCompleted: Int!
    metrics: [MetricInput!]
    lastPlayedAt: String
  }

  input MetricInput {
    key: String!
    value: Float!
  }

  input UpsertPlayerMetricInput {
    userId: ID!
    gameSlug: String!
    metric: String!
    value: Float!
  }

  type Query {
    myProfileStats(limit: Int = 20): [PlayerGameStats!]!
    playerStats(userId: ID!, gameSlug: String): [PlayerGameStats!]!
    topPlayedGames(limit: Int = 10): [GameLeaderboardEntry!]!
    topPlayersByPlaytime(limit: Int = 10): [PlayerLeaderboardEntry!]!
    gameLeaderboard(
      gameSlug: String!
      metric: String = "playtimeMinutes"
      limit: Int = 10
    ): [PlayerLeaderboardEntry!]!
    gameRunLeaderboard(
      gameSlug: String!
      sortBy: LeaderboardSortBy = SCORE
      limit: Int = 10
    ): GameRunLeaderboardPayload!
    myGameRecords: [MyGameRecordEntry!]!
  }

  type Mutation {
    recordGameplayStats(input: RecordGameplayStatsInput!): PlayerGameStats!
    upsertPlayerMetric(input: UpsertPlayerMetricInput!): PlayerGameStats!
    recordRunScore(input: RecordRunScoreInput!): RecordRunScorePayload!
  }
`;
