/**
 * Salem Health Connect - Central State Manager
 * (Updated to fetch Real Laravel API Data + Compatibility Shim)
 */

window.store = {
    // Current Active Tab
    currentTab: 'dashboard',
    
    // Live Data
    stats: {
        total_hospitals: 0,
        total_doctors: 0,
        todays_appointments: 0,
        todays_revenue: 0
    },
    
    // RBAC Context
    activeRole: localStorage.getItem('shc_role') || null,
    activeHospitalId: localStorage.getItem('shc_hospital_id') || null,
    
    queue: [],
    
    // Configuration Settings
    settings: {
        whatsapp_access_token: '',
        whatsapp_phone_number_id: '',
        whatsapp_webhook_verify_token: ''
    },

    // State for UI components
    state: {
        hospitals: [],
        appointments: [],
        refundRequests: [],
        leaves: [],
        departments: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
        districts: ['Salem', 'Chennai', 'Coimbatore'],
        patients: [],
        doctors: []
    },

    init: async function() {
        console.log("Initializing Salem Health Store & Fetching APIs...");
        await this.fetchDistricts(); // Fetch real active districts
        await this.fetchHospitals(); // Fetch real hospitals first
        await this.fetchAppointments(); // Fetch real appointments from DB
        await this.fetchDashboardSummary();
        await this.fetchLiveQueue();
        await this.fetchSettings();
        
        // Polling to keep appointments and queue live every 5 seconds
        setInterval(() => {
            this.fetchAppointments();
            this.fetchLiveQueue();
            this.fetchDashboardSummary();
        }, 5000); 
    },

    /** API: Fetch Active Districts from DB */
    fetchDistricts: async function() {
        try {
            const res = await fetch('/api/districts/all');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                this.state.districts = data.map(d => d.name);
                this.state.allDistricts = data;
            }
        } catch (e) {
            console.error("Failed to fetch districts", e);
        }
    },

    /** API: Fetch Real Live Appointments */
    fetchAppointments: async function() {
        try {
            const res = await fetch('/api/appointments');
            const data = await res.json();
            if (Array.isArray(data)) {
                this.state.appointments = data;
                
                // Map appointments to respective hospitals
                this.state.hospitals.forEach(h => {
                    h.appointments = this.state.appointments.filter(a => String(a.hospitalId) === String(h.id));
                });

                this.notify('appointments_updated', this.state.appointments);
            }
        } catch (error) {
            console.error("Failed to fetch real appointments", error);
        }
    },

    /** API: Fetch Dashboard Stats */
    fetchDashboardSummary: async function() {
        try {
            const res = await fetch('/api/dashboard/summary');
            const data = await res.json();
            this.stats = data;
            this.notify('stats_updated', this.stats);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    },

    /** API: Fetch Live Queue */
    fetchLiveQueue: async function() {
        try {
            const res = await fetch('/api/dashboard/queue');
            const data = await res.json();
            this.queue = data;
            
            // Map real data to shim state for UI
            if (this.state.hospitals.length > 0) {
                this.state.hospitals[0].queues = data;
            }
            
            this.notify('queue_updated', this.queue);
        } catch (error) {
            console.error("Failed to fetch live queue", error);
        }
    },
    
    /** API: Fetch Global Platform Settings */
    fetchSettings: async function() {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            
            data.forEach(setting => {
                if(this.settings.hasOwnProperty(setting.setting_key)) {
                    this.settings[setting.setting_key] = setting.setting_value;
                }
            });
            this.notify('settings_loaded', this.settings);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    },

    /** Local: Toggle Feature flag */
    toggleHospitalFeature: function(hospitalId, featureName) {
        const h = this.state.hospitals.find(x => x.id === hospitalId);
        if(h) {
            h.features[featureName] = !h.features[featureName];
            this.notify('state_changed', this.state);
            this.notify('feature_toggled', { hospitalId, feature: featureName, enabled: h.features[featureName] });
        }
    },
    
    /** API: Fetch Hospitals */
    fetchHospitals: async function() {
        try {
            const res = await fetch('/api/hospitals');
            const data = await res.json();
            this.state.hospitals = data;
            
            // Re-populate doctors and departments for older prototype components if needed
            this.state.doctors = [];
            this.state.departments = [];
            
            data.forEach(h => {
                if(h.doctors && h.doctors.length > 0) {
                    h.doctors.forEach(doc => {
                        this.state.doctors.push({
                            id: 'd_' + Math.random(),
                            name: doc.name,
                            department: doc.department,
                            dept: doc.department,
                            hospitalId: h.id,
                            status: 'Active'
                        });
                        if(!this.state.departments.includes(doc.department)) {
                            this.state.departments.push(doc.department);
                        }
                    });
                }
            });
            
            this.notify('state_changed', this.state);
        } catch (error) {
            console.error("Failed to fetch hospitals", error);
        }
    },

    /** API: Update Hospital Status/Name */
    updateHospital: async function(hospitalId, updates) {
        try {
            const res = await fetch('/api/hospitals/' + hospitalId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(updates)
            });
            if(res.ok) {
                await this.fetchHospitals(); // Refresh list from backend
            }
        } catch (error) {
            console.error("Failed to update hospital", error);
        }
    },
    
    /** API: Delete Hospital */
    deleteHospital: async function(hospitalId) {
        try {
            const res = await fetch('/api/hospitals/' + hospitalId, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            if(res.ok) {
                await this.fetchHospitals();
            }
        } catch (error) {
            console.error("Failed to delete hospital", error);
        }
    },

    /** API: Add Hospital */
    addHospital: async function(hospitalData) {
        try {
            const res = await fetch('/api/hospitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(hospitalData)
            });
            if(res.ok) {
                await this.fetchHospitals();
            }
        } catch (error) {
            console.error("Failed to add hospital", error);
        }
    },

    /** WhatsApp Simulator Helpers */
    getHospitalsByDistrict: function(district) {
        return this.state.hospitals.filter(h => h.district === district && h.status === 'Enabled');
    },

    getDepartmentsByHospital: function(hospitalId) {
        const docs = this.getDoctorsByHospital(hospitalId);
        const depts = docs.map(d => d.dept || d.department);
        return [...new Set(depts)];
    },

    getDoctorsByHospital: function(hospitalId) {
        return this.state.doctors.filter(d => d.hospitalId === hospitalId);
    },

    getDoctorSlots: function(doctorId, day) {
        return ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
    },

    addAppointment: function(aptData) {
        const apt = {
            id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date(),
            type: 'Male', // Default dummy
            patientId: 'p1', // Default dummy
            ...aptData
        };
        this.state.appointments.unshift(apt);
        this.notify('state_changed', this.state);
        return apt;
    },
    
    loginAsHospital: function(hospitalId) {
        this.activeRole = 'hospital_admin';
        this.activeHospitalId = hospitalId;
        localStorage.setItem('shc_role', 'hospital_admin');
        localStorage.setItem('shc_hospital_id', hospitalId);
        this.notify('role_changed', { role: this.activeRole, hospitalId: this.activeHospitalId });
    },
    
    loginAsSuperAdmin: function() {
        this.activeRole = 'super_admin';
        this.activeHospitalId = null;
        localStorage.setItem('shc_role', 'super_admin');
        localStorage.removeItem('shc_hospital_id');
        this.notify('role_changed', { role: this.activeRole, hospitalId: null });
    },
    
    returnToSuperAdmin: function() {
        this.logout();
    },
    
    logout: function() {
        this.activeRole = null;
        this.activeHospitalId = null;
        localStorage.removeItem('shc_role');
        localStorage.removeItem('shc_hospital_id');
        this.notify('role_changed', { role: null, hospitalId: null });
    },
    
    updateAppointmentStatus: function(aptId, status, user = 'System') {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if(apt) {
            apt.status = status;
            if(!apt.auditTimeline) apt.auditTimeline = [];
            apt.auditTimeline.push({
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                action: status,
                user: user
            });
            this.notify('state_changed', this.state);
        }
    },
    
    scanQr: async function(qrToken, hospitalId) {
        try {
            const res = await fetch('/api/hospital/appointments/scan-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ qr_token: qrToken, hospital_id: hospitalId })
            });
            const data = await res.json();
            return res.ok ? data : { error: data.error || 'Invalid QR' };
        } catch (e) {
            return { error: e.message };
        }
    },

    checkIn: async function(qrToken) {
        try {
            const res = await fetch('/api/hospital/appointments/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ qr_token: qrToken })
            });
            const data = await res.json();
            if(res.ok) {
                // Refresh dashboard to show the queue update
                await this.init();
                return { success: true };
            }
            return { error: data.error || 'Check-in failed' };
        } catch (e) {
            return { error: e.message };
        }
    },

    /** API: Save Global Platform Settings */
    saveSettings: async function(newSettings) {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSettings)
            });
            
            if(res.ok) {
                // Update local store
                Object.assign(this.settings, newSettings);
                this.notify('settings_saved', this.settings);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to save settings", error);
            return false;
        }
    },

    /** Simple PubSub Event System */
    listeners: {},
    subscribe: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    notify: function(event, data) {
        if (event === 'state_changed') {
            localStorage.setItem('shc_state', JSON.stringify(this.state));
        }
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};

// Initialize Store
document.addEventListener('DOMContentLoaded', () => {
    window.store.init();
});
