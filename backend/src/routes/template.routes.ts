import { Router } from 'express';
import { templateController } from '../controllers/TemplateController';

const router = Router();

router.get('/sync', templateController.syncTemplates.bind(templateController));
router.post('/', templateController.createTemplate.bind(templateController));

export default router;
