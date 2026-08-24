import axios, { AxiosInstance } from 'axios';

export class WhatsAppService {
    private client: AxiosInstance;
    private apiVersion = 'v19.0';

    constructor() {
        // We will fetch these from the DB for multi-tenant/multi-number setup eventually, 
        // but for now we'll allow fallback to env vars.
        this.client = axios.create({
            baseURL: `https://graph.facebook.com/${this.apiVersion}`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Send a text message to a user
     */
    async sendTextMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
        try {
            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: { preview_url: false, body: text }
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending text message:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send an Interactive Flow Message
     */
    async sendFlowMessage(phoneNumberId: string, accessToken: string, to: string, flowId: string, flowCta: string = 'Open Flow') {
        try {
            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                {
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
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending flow message:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send an Interactive List Message
     */
    async sendListMessage(phoneNumberId: string, accessToken: string, to: string, header: string, body: string, buttonText: string, sections: any[]) {
        try {
            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: { type: 'text', text: header },
                        body: { text: body },
                        action: {
                            button: buttonText,
                            sections: sections
                        }
                    }
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending list message:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send Quick Reply Buttons (Max 3 buttons)
     */
    async sendButtonMessage(phoneNumberId: string, accessToken: string, to: string, text: string, buttons: { id: string, title: string }[]) {
        try {
            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: text },
                        action: {
                            buttons: buttons.map(b => ({
                                type: 'reply',
                                reply: { id: b.id, title: b.title }
                            }))
                        }
                    }
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending buttons:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send Call-To-Action (CTA) URL Button (e.g. "Pay ₹350" opening Razorpay)
     */
    async sendCtaUrlMessage(
        phoneNumberId: string, 
        accessToken: string, 
        to: string, 
        headerText: string, 
        bodyText: string, 
        buttonText: string, 
        url: string,
        footerText?: string
    ) {
        try {
            const payload: any = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'interactive',
                interactive: {
                    type: 'cta_url',
                    body: { text: bodyText },
                    action: {
                        name: 'cta_url',
                        parameters: {
                            display_text: buttonText.substring(0, 20),
                            url: url
                        }
                    }
                }
            };

            if (headerText) {
                payload.interactive.header = { type: 'text', text: headerText.substring(0, 60) };
            }
            if (footerText) {
                payload.interactive.footer = { text: footerText.substring(0, 60) };
            }

            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending CTA URL message:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send an Image with Caption
     */
    async sendImageMessage(phoneNumberId: string, accessToken: string, to: string, imageUrl: string, caption: string) {
        try {
            const response = await this.client.post(
                `/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'image',
                    image: {
                        link: imageUrl,
                        caption: caption
                    }
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService] Error sending image:', error.response?.data || error.message);
            throw error;
        }
    }
}

export const whatsappService = new WhatsAppService();
