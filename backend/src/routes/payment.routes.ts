import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';

const router = Router();

router.post('/razorpay', paymentController.handleWebhook.bind(paymentController));

export default router;
