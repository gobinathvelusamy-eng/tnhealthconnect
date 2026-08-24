"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WebhookController_1 = require("../controllers/WebhookController");
const router = (0, express_1.Router)();
router.get('/whatsapp', WebhookController_1.webhookController.verify.bind(WebhookController_1.webhookController));
router.post('/whatsapp', WebhookController_1.webhookController.handle.bind(WebhookController_1.webhookController));
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map