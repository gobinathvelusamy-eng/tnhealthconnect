import { Request, Response } from 'express';
import { flowEngine } from '../services/flow/FlowEngine';

export class WebhookController {
    
    async verify(req: Request, res: Response) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log(`[Webhook] Verification attempt: mode=${mode}, token=${token}`);

        if (mode === 'subscribe' && challenge) {
            console.log('[Webhook] Verification successful!');
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Unauthorized');
    }

    async handle(req: Request, res: Response) {
        const payload = req.body;
        try {
            res.status(200).send('EVENT_RECEIVED');

            if (payload.object === 'whatsapp_business_account') {
                for (const entry of payload.entry) {
                    for (const change of entry.changes) {
                        if (change.value.messages) {
                            const message = change.value.messages[0];
                            const contact = change.value.contacts[0];
                            const wa_id = contact.wa_id;
                            
                            const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
                            const token = process.env.WHATSAPP_ACCESS_TOKEN!;
                            
                            console.log(`[Webhook] Incoming ${message.type} from ${wa_id}`);
                            
                            // Delegate entirely to Visual Flow Execution Engine!
                            await flowEngine.handleIncomingMessage(phoneId, token, wa_id, message);
                        } else if (change.value.statuses) {
                            const status = change.value.statuses[0];
                            console.log(`[Webhook] Message status update: ${status.id} -> ${status.status}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Webhook] Error processing payload:', error);
        }
    }
}

export const webhookController = new WebhookController();
