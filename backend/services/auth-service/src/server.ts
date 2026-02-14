import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { connectDatabase } from './config/database';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createContext } from './middleware/auth.middleware';
import { formatError } from './middleware/error.middleware';

const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gaming-hub-auth';

async function startServer() {
  const app = express();

  // Connect DB
  await connectDatabase(MONGO_URI);

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(server, { context: createContext }));

  // Health
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
  });

  // Start
  app.listen(PORT, () => {
    console.log('Auth Service');
    console.log(`GraphQL: http://localhost:${PORT}/graphql`);
    console.log('');
  });
}

startServer().catch(console.error);
