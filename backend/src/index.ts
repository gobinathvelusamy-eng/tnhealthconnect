import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import webhookRoutes from './routes/webhook.routes';
import templateRoutes from './routes/template.routes';
import flowRoutes from './routes/flow.routes';
import paymentRoutes from './routes/payment.routes';
import conversationRoutes from './routes/conversation.routes';
import triggerRoutes from './routes/trigger.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/webhooks/payment', paymentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/settings', settingsRoutes);

// Base Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TNHC WhatsApp Automation Platform API' });
});

app.listen(port, () => {
  console.log(`[Server]: API is running at http://localhost:${port}`);
});





