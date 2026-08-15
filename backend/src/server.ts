import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.ts';
import authRoutes from './routes/auth.routes.ts';
import productRoutes from './routes/product.routes.ts';
import categoryRoutes from './routes/category.routes.ts';
import orderRoutes from './routes/order.routes.ts';
import userRoutes from './routes/user.routes.ts';
import contactRoutes from './routes/contact.routes.ts';
import { errorHandler, notFound } from './middlewares/error.middleware.ts';
import { assertRuntimeConfig } from './config/runtime.ts';

dotenv.config();

let runtimeConfig;
try {
  runtimeConfig = assertRuntimeConfig(process.env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

await connectDB(runtimeConfig.mongoUri);

const app = express();
const allowedOrigins = runtimeConfig.clientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(Object.assign(new Error('Origine non autorisée par CORS'), { statusCode: 403 }));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
const publicWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', publicWriteLimiter, orderRoutes);
app.use('/api/contact', publicWriteLimiter, contactRoutes);
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);
const server = app.listen(PORT, '0.0.0.0', () => console.log(`API listening on port ${PORT}`));

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
