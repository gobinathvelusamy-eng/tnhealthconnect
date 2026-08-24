/**
 * TN Health Connect API Integration Service
 *
 * This service acts as the dedicated abstraction layer between the WhatsApp Flow Engine
 * and the existing Laravel Healthcare system of record.
 */
export declare class TNHCService {
    private client;
    constructor();
    getPatientByWhatsappNumber(phoneNumber: string): Promise<void>;
    getDistricts(): Promise<void>;
    getHospitalsByDistrict(districtId: string): Promise<void>;
    getSpecialitiesByHospital(hospitalId: string): Promise<void>;
    getDoctors(hospitalId: string, specialityId: string): Promise<void>;
    getAvailableDates(doctorId: string): Promise<void>;
    getAvailableSlots(doctorId: string, date: string): Promise<void>;
    createAppointment(payload: any): Promise<void>;
}
export declare const tnhcService: TNHCService;
//# sourceMappingURL=TNHCService.d.ts.map