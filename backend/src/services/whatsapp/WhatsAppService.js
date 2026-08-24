"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
const axios_1 = __importStar(require("axios"));
class WhatsAppService {
    client;
    apiVersion = 'v19.0';
    constructor() {
        // We will fetch these from the DB for multi-tenant/multi-number setup eventually, 
        // but for now we'll allow fallback to env vars.
        this.client = axios_1.default.create({
            baseURL: `https://graph.facebook.com/${this.apiVersion}`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Send a text message to a user
     */
    async sendTextMessage(phoneNumberId, accessToken, to, text) {
        try {
            const response = await this.client.post(`/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: { preview_url: false, body: text }
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        }
        catch (error) {
            console.error('[WhatsAppService] Error sending text message:', error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Send an Interactive Flow Message
     */
    async sendFlowMessage(phoneNumberId, accessToken, to, flowId, flowCta = 'Open Flow') {
        try {
            const response = await this.client.post(`/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to,
                type: 'interactive',
                interactive: {
                    type: 'flow',
                    header: { type: 'text', text: 'TN Health Connect' },
                    body: { text: 'Please interact with the flow below.' },
                    footer: { text: 'TN Health Connect' },
                    action: {
                        name: 'flow',
                        parameters: {
                            flow_message_version: '3',
                            flow_token: 'tnhc_flow_token',
                            flow_id: flowId,
                            flow_cta: flowCta,
                            flow_action: 'navigate',
                            flow_action_payload: { screen: 'HOME' }
                        }
                    }
                }
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        }
        catch (error) {
            console.error('[WhatsAppService] Error sending flow message:', error.response?.data || error.message);
            throw error;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();
//# sourceMappingURL=WhatsAppService.js.map