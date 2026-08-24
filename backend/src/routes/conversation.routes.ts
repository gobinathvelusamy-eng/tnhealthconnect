import { Router } from 'express';
import { conversationController } from '../controllers/ConversationController';

const router = Router();

router.get('/', conversationController.getConversations.bind(conversationController));
router.get('/:conversationId/messages', conversationController.getMessages.bind(conversationController));

export default router;
