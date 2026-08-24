import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FlowController {
    
    async getFlows(req: Request, res: Response) {
        try {
            const flows = await prisma.flow.findMany({
                include: { 
                    versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
                    keywordTriggers: true
                },
                orderBy: { updatedAt: 'desc' }
            });
            return res.status(200).json({ success: true, data: flows });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to fetch flows', details: error.message });
        }
    }

    async deleteFlow(req: Request, res: Response) {
        const { flowId } = req.params;
        const force = req.query.force === 'true';

        try {
            const flow = await prisma.flow.findUnique({
                where: { id: flowId },
                include: { 
                    keywordTriggers: true,
                    versions: true,
                    conversations: true
                }
            });

            if (!flow) {
                return res.status(404).json({ error: 'Flow not found' });
            }

            const isConnected = (flow.keywordTriggers && flow.keywordTriggers.length > 0) || (flow.conversations && flow.conversations.length > 0);

            if (isConnected && !force) {
                const triggers = flow.keywordTriggers.map(t => t.keyword);
                return res.status(400).json({
                    success: false,
                    isConnected: true,
                    linkedTriggers: triggers,
                    message: `Flow is currently connected to system trigger(s): ${triggers.map(t => `"${t}"`).join(', ')}. Please confirm deletion.`
                });
            }

            // Cascade delete
            const versionIds = flow.versions.map(v => v.id);

            if (versionIds.length > 0) {
                await prisma.conversationSession.deleteMany({
                    where: { flowVersionId: { in: versionIds } }
                });
            }

            await prisma.keywordTrigger.deleteMany({
                where: { flowId: flowId }
            });

            await prisma.conversation.updateMany({
                where: { flowId: flowId },
                data: { flowId: null }
            });

            await prisma.flowVersion.deleteMany({
                where: { flowId: flowId }
            });

            await prisma.flow.delete({
                where: { id: flowId }
            });

            return res.status(200).json({ success: true, message: 'Flow deleted successfully' });
        } catch (error: any) {
            console.error('[FlowController] Delete error:', error);
            return res.status(500).json({ error: 'Failed to delete flow', details: error.message });
        }
    }

    async saveDraft(req: Request, res: Response) {
        const { flowId, name, nodes, edges, variables } = req.body;
        
        try {
            let flow;
            if (flowId) {
                flow = await prisma.flow.findUnique({ where: { id: flowId } });
                if (!flow) return res.status(404).json({ error: 'Flow not found' });
                
                await prisma.flow.update({
                    where: { id: flowId },
                    data: { name: name || flow.name }
                });

                const existingDraft = await prisma.flowVersion.findFirst({
                    where: { flowId: flowId, isPublished: false },
                    orderBy: { versionNumber: 'desc' }
                });

                if (existingDraft) {
                    await prisma.flowVersion.update({
                        where: { id: existingDraft.id },
                        data: { nodes: JSON.stringify(nodes), edges: JSON.stringify(edges) }
                    });
                } else {
                    const latestVersion = await prisma.flowVersion.findFirst({
                        where: { flowId: flowId },
                        orderBy: { versionNumber: 'desc' }
                    });
                    const newVersionNum = (latestVersion?.versionNumber || 0) + 1;
                    await prisma.flowVersion.create({
                        data: {
                            flowId: flowId,
                            versionNumber: newVersionNum,
                            nodes: JSON.stringify(nodes),
                            edges: JSON.stringify(edges),
                            isPublished: false
                        }
                    });
                }
            } else {
                flow = await prisma.flow.create({
                    data: {
                        name: name || 'Untitled Flow',
                        status: 'DRAFT',
                        versions: {
                            create: {
                                versionNumber: 1,
                                nodes: JSON.stringify(nodes),
                                edges: JSON.stringify(edges),
                                isPublished: false
                            }
                        }
                    }
                });
            }
            
            return res.status(200).json({ success: true, message: 'Draft saved successfully', flowId: flow.id });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to save flow draft', details: error.message });
        }
    }

    async publishFlow(req: Request, res: Response) {
        const { flowId } = req.params;
        
        try {
            const draft = await prisma.flowVersion.findFirst({
                where: { flowId: flowId, isPublished: false },
                orderBy: { versionNumber: 'desc' }
            });

            if (!draft) return res.status(400).json({ error: 'No draft found to publish' });

            await prisma.flowVersion.update({
                where: { id: draft.id },
                data: { isPublished: true }
            });

            await prisma.flow.update({
                where: { id: flowId },
                data: { status: 'PUBLISHED' }
            });
            
            return res.status(200).json({ success: true, message: 'Flow published successfully' });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to publish flow', details: error.message });
        }
    }

    async getFlow(req: Request, res: Response) {
        const { flowId } = req.params;
        
        try {
            const flow = await prisma.flow.findUnique({
                where: { id: flowId },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
            });

            if (!flow || flow.versions.length === 0) {
                 return res.status(404).json({ error: 'Flow not found' });
            }

            return res.status(200).json({ 
                success: true, 
                data: {
                    id: flow.id,
                    name: flow.name,
                    nodes: JSON.parse(flow.versions[0].nodes as string),
                    edges: JSON.parse(flow.versions[0].edges as string),
                    versionNumber: flow.versions[0].versionNumber,
                    isPublished: flow.versions[0].isPublished
                }
            });
        } catch (error: any) {
            return res.status(500).json({ error: 'Failed to fetch flow', details: error.message });
        }
    }
}

export const flowController = new FlowController();
