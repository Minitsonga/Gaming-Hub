import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

  type Game @key(fields: "id") {
    id: ID!
    slug: String!
    title: String!
    description: String!
    thumbnailUrl: String!
    technology: String!
    status: String!
    developerId: String!
    tags: [String!]!
    createdAt: String!
  }

  input CreateGameInput {
    slug: String!
    title: String!
    description: String!
    technology: String!
    thumbnailUrl: String
    tags: [String!]
  }

  input UpdateGameInput {
    title: String
    description: String
    thumbnailUrl: String
    status: String
    tags: [String!]
  }

  type Query {
    games(status: String, tag: String): [Game!]!
    game(id: ID!): Game
  }

  type Mutation {
    createGame(input: CreateGameInput!): Game!
    updateGame(id: ID!, input: UpdateGameInput!): Game!
    deleteGame(id: ID!): Boolean!
  }
`;
