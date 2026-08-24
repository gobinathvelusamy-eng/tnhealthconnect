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
exports.tnhcService = exports.TNHCService = void 0;
const axios_1 = __importStar(require("axios"));
/**
 * TN Health Connect API Integration Service
 *
 * This service acts as the dedicated abstraction layer between the WhatsApp Flow Engine
 * and the existing Laravel Healthcare system of record.
 */
class TNHCService {
    client;
    constructor() {
        const baseURL = process.env.TNHC_API_BASE_URL;
        const apiKey = process.env.TNHC_API_KEY;
        if (!baseURL) {
            console.warn('Warning: TNHC_API_BASE_URL is not defined in environment variables.');
        }
        this.client = axios_1.default.create({
            baseURL: baseURL || 'http://localhost:8000/api',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 10000 // 10 second timeout for external API calls
        });
    }
    // --- Placeholder Methods for Future Phases ---
    async getPatientByWhatsappNumber(phoneNumber) {
        // GET /patients?phone=phoneNumber
        throw new Error('Not implemented yet');
    }
    async getDistricts() {
        // GET /districts
        throw new Error('Not implemented yet');
    }
    async getHospitalsByDistrict(districtId) {
        // GET /hospitals?district_id=districtId
        throw new Error('Not implemented yet');
    }
    async getSpecialitiesByHospital(hospitalId) {
        // GET /specialities?hospital_id=hospitalId
        throw new Error('Not implemented yet');
    }
    async getDoctors(hospitalId, specialityId) {
        // GET /doctors?hospital_id=...&speciality_id=...
        throw new Error('Not implemented yet');
    }
    async getAvailableDates(doctorId) {
        // GET /availability/dates?doctor_id=...
        throw new Error('Not implemented yet');
    }
    async getAvailableSlots(doctorId, date) {
        // GET /availability/slots?doctor_id=...&date=...
        throw new Error('Not implemented yet');
    }
    async createAppointment(payload) {
        // POST /appointments
        throw new Error('Not implemented yet');
    }
}
exports.TNHCService = TNHCService;
exports.tnhcService = new TNHCService();
//# sourceMappingURL=TNHCService.js.map