import { Request, Response } from 'express';
import { flowEngine } from '../services/flow/FlowEngine';

export class PaymentController {
    
    /**
     * POST /api/webhooks/payment/razorpay
     * Handle Server-to-Server Payment Webhooks from Razorpay
     */
    async handleWebhook(req: Request, res: Response) {
        const payload = req.body;
        console.log(`[PaymentController] Received Razorpay Webhook Event: ${payload.event}`);
        
        try {
            res.status(200).send('OK');

            if (
                payload.event === 'payment_link.paid' || 
                payload.event === 'payment.captured' || 
                payload.event === 'order.paid'
            ) {
                const pLink = payload.payload?.payment_link?.entity;
                const pEntity = payload.payload?.payment?.entity;

                const referenceId = pLink?.reference_id || pEntity?.notes?.reference_id || pEntity?.description || '';
                const paymentId = pEntity?.id || pLink?.payment_id || 'pay_confirmed';
                const contact = pEntity?.contact || pLink?.customer?.contact || '';

                console.log(`[PaymentController] Payment SUCCESS -> Event: ${payload.event}, Ref: "${referenceId}", Contact: "${contact}", PaymentID: "${paymentId}"`);
                
                await flowEngine.confirmPaidAppointment(referenceId, paymentId, contact);
            } 
            else if (payload.event === 'payment_link.cancelled' || payload.event === 'payment.failed') {
                console.log(`[PaymentController] Payment failed/cancelled for reference: ${payload.payload?.payment_link?.entity?.reference_id}`);
            }
        } catch (error) {
            console.error('[PaymentController] Error processing webhook:', error);
        }
    }
}

export const paymentController = new PaymentController();
