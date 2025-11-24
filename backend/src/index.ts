import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Importar rotas
import authRoutes from './routes/auth';
import organizationsRoutes from './routes/organizations';
import corridasRoutes from './routes/corridas';
import despesasRoutes from './routes/despesas';
import vehiclesRoutes from './routes/vehicles';
import settingsRoutes from './routes/settings';
import stripeRoutes from './routes/stripe';
import webhooksRoutes from './routes/webhooks';

// Middlewares
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inicializar Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Middlewares globais
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rate limiting
app.use('/api/', rateLimiter);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/corridas', corridasRoutes);
app.use('/api/despesas', despesasRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handler (deve ser o último)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;


