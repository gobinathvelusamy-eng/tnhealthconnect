import { Router } from 'express';
import { triggerController } from '../controllers/TriggerController';

const router = Router();

router.get('/', triggerController.getAll.bind(triggerController));
router.post('/', triggerController.save.bind(triggerController));
router.delete('/:id', triggerController.delete.bind(triggerController));

export default router;
