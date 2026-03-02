import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@as-integrations/express5';
import { connectDatabase } from './config/database';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createContext } from './middleware/auth.middleware';
import { formatError } from './middleware/error.middleware';

const PORT = process.env.PORT ?? 4004;
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/gaming-hub-analytics';

async function start() {
  await connectDatabase(MONGO_URI);
  const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
  const server = new ApolloServer({ schema, formatError });
  await server.start();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, { context: createContext }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'analytics-service' }));

  app.listen(PORT, () => {
    console.log(`analytics-service -> http://localhost:${PORT}/graphql`);
  });
}

start().catch(console.error);
