import { tnhcService } from '../tnhc/TNHCService';

export const ComponentLibrary = {
    'tnhc_district': async (context: any, config: any) => {
        try {
            const districts = await tnhcService.getDistricts();
            return {
                status: 'success',
                messageType: 'interactive_list',
                messagePayload: { body: 'Select District' },
                awaitsInput: true,
                outputVariable: 'selected_district_id'
            };
        } catch (error) {
            return { status: 'error', fallbackMessage: 'Sorry, we could not fetch districts.' };
        }
    },
    'tnhc_payment': async (context: any, config: any) => {
        const appointmentAmount = context.variables['appointment_amount'] || 500;
        const patientName = context.variables['patient_name'] || 'Patient';
        const patientPhone = context.variables['patient_phone'] || '9999999999';
        const referenceId = context.variables['session_id']; 

        try {
            const { paymentService } = await import('../payment/PaymentService');
            const payment = await paymentService.createPaymentLink(appointmentAmount, 'INR', patientName, patientPhone, referenceId);
            
            return {
                status: 'success',
                messageType: 'text',
                messagePayload: {
                    body: "Please complete your payment of Rs. " + appointmentAmount + " to confirm your appointment.\n\nPayment Link: " + payment.short_url
                },
                awaitsInput: true,
                outputVariable: 'payment_status'
            };
        } catch (error) {
            return { status: 'error', fallbackMessage: 'Could not generate payment link.' };
        }
    }
};
