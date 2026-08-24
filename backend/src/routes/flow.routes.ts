import { Router } from 'express';
import { flowController } from '../controllers/FlowController';

const router = Router();

router.get('/', flowController.getFlows.bind(flowController));
router.get('/:flowId', flowController.getFlow.bind(flowController));
router.post('/draft', flowController.saveDraft.bind(flowController));
router.post('/:flowId/publish', flowController.publishFlow.bind(flowController));
router.delete('/:flowId', flowController.deleteFlow.bind(flowController));

export default router;
