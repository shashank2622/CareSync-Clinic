import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logging.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { AppError } from './utils/app-error.js';
import routes from './routes/index.js';

const app: Application = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new AppError('CORS origin not allowed', 403, 'FORBIDDEN'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting (Global Protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', globalLimiter);

// 4. Request Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 5. Request Logging
app.use(requestLogger);

// 6. Mount API Routes
app.use('/api', routes);

// 7. Fallback for unhandled routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// 8. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
