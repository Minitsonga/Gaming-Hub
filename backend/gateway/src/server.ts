import 'dotenv/config';
import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import { ApolloServer } from '@apollo/server';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { expressMiddleware } from '@as-integrations/express5';

const PORT = Number(process.env.PORT ?? 4000);
const AUTH_SUBGRAPH_URL = process.env.AUTH_SUBGRAPH_URL ?? 'http://localhost:4001/graphql';
const CATALOG_SUBGRAPH_URL = process.env.CATALOG_SUBGRAPH_URL ?? 'http://localhost:4002/graphql';
const ROGUELIKE_SUBGRAPH_URL =
  process.env.ROGUELIKE_SUBGRAPH_URL ?? 'http://localhost:4003/graphql';
const ANALYTICS_SUBGRAPH_URL =
  process.env.ANALYTICS_SUBGRAPH_URL ?? 'http://localhost:4004/graphql';
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
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'auth', url: AUTH_SUBGRAPH_URL },
        { name: 'catalog', url: CATALOG_SUBGRAPH_URL },
        { name: 'roguelike', url: ROGUELIKE_SUBGRAPH_URL },
        { name: 'analytics', url: ANALYTICS_SUBGRAPH_URL },
      ],
    }),
  });

  const server = new ApolloServer({
    gateway,
  });

  await server.start();

  const app = express();
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
  });

  app.listen(PORT, () => {
    console.log(`gateway -> http://localhost:${PORT}/graphql`);
  });
}

start().catch(console.error);
