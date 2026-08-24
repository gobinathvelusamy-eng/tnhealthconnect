// Default Appointment Flow Seeder
export const defaultAppointmentFlow = {
    name: "Default Appointment Flow",
    description: "End-to-end TN Health Connect appointment flow with payment",
    nodes: [
        { id: 'n_start', type: 'tnhc_start', data: { label: 'START' } },
        { id: 'n_welcome', type: 'tnhc_message', data: { text: 'Welcome to TN Health Connect!' } },
        { id: 'n_check_patient', type: 'tnhc_check_patient', data: {} },
        
        // Location & Healthcare Selection
        { id: 'n_district', type: 'tnhc_district', data: {} },
        { id: 'n_hospital', type: 'tnhc_hospital', data: {} },
        { id: 'n_speciality', type: 'tnhc_speciality', data: {} },
        { id: 'n_doctor', type: 'tnhc_doctor', data: {} },
        
        // Availability
        { id: 'n_date', type: 'tnhc_date', data: {} },
        { id: 'n_slot', type: 'tnhc_slot', data: {} },
        
        // Confirmation & Payment
        { id: 'n_summary', type: 'tnhc_summary', data: {} },
        { id: 'n_confirm', type: 'tnhc_confirm', data: {} },
        { id: 'n_payment', type: 'tnhc_payment', data: { amount: 500 } },
        
        // Fulfillment
        { id: 'n_create_appointment', type: 'tnhc_create_appointment', data: {} },
        { id: 'n_confirmation_template', type: 'tnhc_template', data: { templateName: 'appointment_confirmed' } }
    ],
    edges: [
        { source: 'n_start', target: 'n_welcome' },
        { source: 'n_welcome', target: 'n_check_patient' },
        { source: 'n_check_patient', target: 'n_district' },
        { source: 'n_district', target: 'n_hospital' },
        { source: 'n_hospital', target: 'n_speciality' },
        { source: 'n_speciality', target: 'n_doctor' },
        { source: 'n_doctor', target: 'n_date' },
        { source: 'n_date', target: 'n_slot' },
        { source: 'n_slot', target: 'n_summary' },
        { source: 'n_summary', target: 'n_confirm' },
        { source: 'n_confirm', target: 'n_payment' },
        { source: 'n_payment', target: 'n_create_appointment' },
        { source: 'n_create_appointment', target: 'n_confirmation_template' }
    ]
};

console.log("[Seeder] Default Appointment Flow JSON generated successfully.");
