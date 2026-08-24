export declare class WhatsAppService {
    private client;
    private apiVersion;
    constructor();
    /**
     * Send a text message to a user
     */
    sendTextMessage(phoneNumberId: string, accessToken: string, to: string, text: string): Promise<any>;
    /**
     * Send an Interactive Flow Message
     */
    sendFlowMessage(phoneNumberId: string, accessToken: string, to: string, flowId: string, flowCta?: string): Promise<any>;
}
export declare const whatsappService: WhatsAppService;
//# sourceMappingURL=WhatsAppService.d.ts.map