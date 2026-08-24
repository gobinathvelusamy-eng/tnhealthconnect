import axios, { AxiosInstance } from 'axios';

export class TemplateService {
    private client: AxiosInstance;
    private apiVersion = 'v19.0';

    constructor() {
        this.client = axios.create({
            baseURL: `https://graph.facebook.com/${this.apiVersion}`,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Submit a new template to Meta for approval
     */
    async createTemplate(wabaId: string, accessToken: string, templateData: any) {
        try {
            const response = await this.client.post(
                `/${wabaId}/message_templates`,
                templateData,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data; // Usually returns { id: "<meta_template_id>" }
        } catch (error: any) {
            console.error('[TemplateService] Error creating template:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Fetch all templates from Meta to synchronize status
     */
    async getTemplates(wabaId: string, accessToken: string) {
        try {
            const response = await this.client.get(
                `/${wabaId}/message_templates`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data.data; // Array of templates with their statuses
        } catch (error: any) {
            console.error('[TemplateService] Error fetching templates:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete a template from Meta
     */
    async deleteTemplate(wabaId: string, accessToken: string, templateName: string) {
        try {
            const response = await this.client.delete(
                `/${wabaId}/message_templates?name=${templateName}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('[TemplateService] Error deleting template:', error.response?.data || error.message);
            throw error;
        }
    }
}

export const templateService = new TemplateService();
