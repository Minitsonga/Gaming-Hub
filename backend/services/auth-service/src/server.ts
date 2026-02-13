import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'auth-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      graphql: '/graphql (coming soon)',
    },
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Auth Service on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

export default app;
