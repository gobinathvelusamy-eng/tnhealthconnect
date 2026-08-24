import { Request, Response } from 'express';
import { templateService } from '../services/whatsapp/TemplateService';

export class TemplateController {
    
    /**
     * Fetch templates and sync with database
     */
    async syncTemplates(req: Request, res: Response) {
        // In a real app, these come from the authenticated user's active WhatsappAccount DB record
        const wabaId = process.env.WHATSAPP_WABA_ID || 'dummy_waba_id';
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'dummy_token';

        try {
            const metaTemplates = await templateService.getTemplates(wabaId, accessToken);
            
            // TODO: Iterate over metaTemplates and upsert them into the Prisma database 
            // to update their local approval statuses (APPROVED, REJECTED, PENDING).
            
            return res.status(200).json({ success: true, count: metaTemplates.length, data: metaTemplates });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to sync templates', details: error.message });
        }
    }

    /**
     * Submit a new template to Meta
     */
    async createTemplate(req: Request, res: Response) {
        const wabaId = process.env.WHATSAPP_WABA_ID || 'dummy_waba_id';
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'dummy_token';
        
        const templateData = req.body;

        try {
            // 1. Save as DRAFT / PENDING in our Prisma database
            
            // 2. Submit to Meta
            const result = await templateService.createTemplate(wabaId, accessToken, templateData);
            
            // 3. Update database with the returned metaTemplateId
            
            return res.status(201).json({ success: true, metaTemplateId: result.id });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to create template', details: error.message });
        }
    }
}

export const templateController = new TemplateController();
