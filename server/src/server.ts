import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';
import patientRoutes from './routes/patients';
import visitRoutes from './routes/visits';
import summaryRoutes from './routes/summary';
import optionsRoutes from './routes/options';
import paymentRoutes from './routes/payments';
import orthodonticRoutes from './routes/orthodontic';
import rootCanalRoutes from './routes/rootCanal';
import { errorHandler } from './middleware/errorHandler';
import path from 'path';
import fs from 'fs';

export async function createServer() {
  const app = express();
  app.use(cors());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/patients', patientRoutes);
  app.use('/api/visits', visitRoutes);
  app.use('/api/summary', summaryRoutes);
  app.use('/api/options', optionsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/orthodontic', orthodonticRoutes);
  app.use('/api/root-canal', rootCanalRoutes);

  // Static uploads (ensure folder exists)
  const uploadsPath = path.join(process.cwd(), 'server', 'uploads');
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
  app.use('/uploads', express.static(uploadsPath));

  app.use(errorHandler);

  return app;
}
