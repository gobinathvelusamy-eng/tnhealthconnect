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
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TN Health Connect — Live API Platform</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; }
          .card { background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; max-width: 500px; }
          .badge { background: #10b981; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 16px; }
          h1 { margin: 0 0 10px; font-size: 24px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Online & Operational</div>
          <h1>TN Health Connect</h1>
          <p>WhatsApp Automation Platform & Hospital Management Core is active and running in production.</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TNHC WhatsApp Automation Platform API' });
});

app.listen(port, () => {
  console.log(`[Server]: API is running at http://localhost:${port}`);
});





