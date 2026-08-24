import { Router } from 'express';
import { webhookController } from '../controllers/WebhookController';

const router = Router();

router.get('/whatsapp', webhookController.verify.bind(webhookController));
router.post('/whatsapp', webhookController.handle.bind(webhookController));

export default router;
