"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = exports.WebhookController = void 0;
const express_1 = require("express");
class WebhookController {
    /**
     * GET /api/webhook/whatsapp
     * Meta Webhook Verification
     */
    async verify(req, res) {
        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'tnhc_secure_verify_token';
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Webhook] Verification successful');
            return res.status(200).send(challenge);
        }
        console.warn('[Webhook] Verification failed', { expected: verifyToken, received: token });
        return res.status(403).send('Unauthorized');
    }
    /**
     * POST /api/webhook/whatsapp
     * Receive messages and statuses from Meta
     */
    async handle(req, res) {
        const payload = req.body;
        try {
            // Acknowledge receipt to Meta immediately
            res.status(200).send('EVENT_RECEIVED');
            if (payload.object === 'whatsapp_business_account') {
                for (const entry of payload.entry) {
                    for (const change of entry.changes) {
                        if (change.value.messages) {
                            // Incoming Message
                            const message = change.value.messages[0];
                            const contact = change.value.contacts[0];
                            console.log(`[Webhook] Incoming message from ${contact.wa_id}:`, message);
                            // Hand off to Conversation/Flow Engine (Phase 6)
                        }
                        else if (change.value.statuses) {
                            // Message Status Update (Sent, Delivered, Read, Failed)
                            const status = change.value.statuses[0];
                            console.log(`[Webhook] Message status update: ${status.id} -> ${status.status}`);
                            // Hand off to Message tracking system
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('[Webhook] Error processing payload:', error);
        }
    }
}
exports.WebhookController = WebhookController;
exports.webhookController = new WebhookController();
//# sourceMappingURL=WebhookController.js.map