import path from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

for (const envPath of [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../.env'),
]) {
  if (existsSync(envPath)) config({ path: envPath, override: true });
}
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@as-integrations/express5';
import { connectDatabase } from './config/database';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createContext } from './middleware/auth.middleware';
import { formatError } from './middleware/error.middleware';

const PORT = process.env.PORT ?? 4002;
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/gaming-hub';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && CORS_ORIGINS.length === 0) {
      return callback(null, true);
    }
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

async function start() {
  await connectDatabase(MONGO_URI);
  const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

  const server = new ApolloServer({ schema, formatError });
  await server.start();

  const app = express();
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, { context: createContext }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'catalog-service' }));

  app.listen(PORT, () => {
    console.log(`catalog-service -> http://localhost:${PORT}/graphql`);
  });
}

start().catch(console.error);
