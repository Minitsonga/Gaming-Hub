import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(input: RefreshTokenInput!): AuthPayload!
    logout: Boolean!
    deleteUser(id: ID!): Boolean!
  }
`;
