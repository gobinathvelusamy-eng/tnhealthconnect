import { Request, Response } from 'express';
export declare class WebhookController {
    /**
     * GET /api/webhook/whatsapp
     * Meta Webhook Verification
     */
    verify(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /api/webhook/whatsapp
     * Receive messages and statuses from Meta
     */
    handle(req: Request, res: Response): Promise<void>;
}
export declare const webhookController: WebhookController;
//# sourceMappingURL=WebhookController.d.ts.map