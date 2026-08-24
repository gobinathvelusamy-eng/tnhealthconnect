import axios, { AxiosInstance } from 'axios';

/**
 * TN Health Connect API Integration Service
 * 
 * This service acts as the dedicated abstraction layer between the WhatsApp Flow Engine
 * and the existing Laravel Healthcare system of record.
 */
export class TNHCService {
    private client: AxiosInstance;

    constructor() {
        const baseURL = process.env.TNHC_API_BASE_URL;
        const apiKey = process.env.TNHC_API_KEY;

        if (!baseURL) {
            console.warn('Warning: TNHC_API_BASE_URL is not defined in environment variables.');
        }

        this.client = axios.create({
            baseURL: baseURL || 'http://localhost:8000/api',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 10000 // 10 second timeout for external API calls
        });
    }

    // --- Placeholder Methods for Future Phases ---

    async getPatientByWhatsappNumber(phoneNumber: string): Promise<any> {
        // GET /patients?phone=phoneNumber
        throw new Error('Not implemented yet');
    }

    async getDistricts(): Promise<any[]> {
        // GET /districts
        throw new Error('Not implemented yet');
    }

    async getHospitalsByDistrict(districtId: string): Promise<any[]> {
        // GET /hospitals?district_id=districtId
        throw new Error('Not implemented yet');
    }

    async getSpecialitiesByHospital(hospitalId: string): Promise<any[]> {
        // GET /specialities?hospital_id=hospitalId
        throw new Error('Not implemented yet');
    }

    async getDoctors(hospitalId: string, specialityId: string): Promise<any[]> {
        // GET /doctors?hospital_id=...&speciality_id=...
        throw new Error('Not implemented yet');
    }

    async getAvailableDates(doctorId: string): Promise<any[]> {
        // GET /availability/dates?doctor_id=...
        throw new Error('Not implemented yet');
    }

    async getAvailableSlots(doctorId: string, date: string): Promise<any[]> {
        // GET /availability/slots?doctor_id=...&date=...
        throw new Error('Not implemented yet');
    }

    async createAppointment(payload: any) {
        // POST /appointments
        throw new Error('Not implemented yet');
    }
}

export const tnhcService = new TNHCService();

