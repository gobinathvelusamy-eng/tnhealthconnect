import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TriggerController {
    
    // Get all triggers
    async getAll(req: Request, res: Response) {
        try {
            const triggers = await prisma.keywordTrigger.findMany({
                include: {
                    flow: true
                }
            });
            res.json(triggers);
        } catch (error) {
            console.error('[TriggerController] Error getting triggers:', error);
            res.status(500).json({ error: 'Failed to fetch triggers' });
        }
    }

    // Create or Update a trigger
    async save(req: Request, res: Response) {
        try {
            const { keyword, flowId } = req.body;
            
            if (!keyword || !flowId) {
                return res.status(400).json({ error: 'Missing keyword or flowId' });
            }

            // Upsert based on keyword
            const trigger = await prisma.keywordTrigger.upsert({
                where: { keyword: keyword.toLowerCase() },
                update: { flowId },
                create: { keyword: keyword.toLowerCase(), flowId }
            });

            res.json(trigger);
        } catch (error) {
            console.error('[TriggerController] Error saving trigger:', error);
            res.status(500).json({ error: 'Failed to save trigger' });
        }
    }

    // Delete a trigger
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.keywordTrigger.delete({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            console.error('[TriggerController] Error deleting trigger:', error);
            res.status(500).json({ error: 'Failed to delete trigger' });
        }
    }
}

export const triggerController = new TriggerController();
