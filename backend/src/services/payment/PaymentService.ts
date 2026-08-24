import Razorpay from 'razorpay';

export class PaymentService {
    private getRazorpayInstance(): Razorpay | null {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret) {
            return new Razorpay({
                key_id: keyId,
                key_secret: keySecret
            });
        }
        return null;
    }

    /**
     * Create a payment link for WhatsApp with automatic redirect back to WhatsApp
     */
    async createPaymentLink(
        amount: number,
        currency: string = 'INR',
        customerName: string,
        customerPhone: string,
        referenceId: string,
        description: string = 'TN Health Connect Consultation Fee'
    ) {
        try {
            const razorpay = this.getRazorpayInstance();

            if (razorpay) {
                console.log(`[PaymentService] Creating live Razorpay payment link for ₹${amount} for ${customerName} (${customerPhone})...`);
                
                const cleanPhone = customerPhone.replace(/\D/g, '');
                
                const paymentLink: any = await razorpay.paymentLink.create({
                    amount: Math.round(amount * 100), // in paise (e.g. 350 INR = 35000 paise)
                    currency,
                    accept_partial: false,
                    reference_id: referenceId,
                    description,
                    customer: {
                        name: customerName,
                        contact: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
                    },
                    notify: { sms: false, email: false },
                    reminder_enable: false,
                    callback_url: `https://wa.me/15556766860?text=Payment%20Completed`,
                    callback_method: 'get'
                });

                console.log(`[PaymentService] Razorpay Link created: ${paymentLink.short_url}`);

                return {
                    id: paymentLink.id,
                    short_url: paymentLink.short_url,
                    status: paymentLink.status
                };
            }

            console.log('[PaymentService] Running in Test Mock mode. Returning fallback payment link.');
            return {
                id: `plink_test_${Date.now()}`,
                short_url: `https://rzp.io/l/demo_appointment_${referenceId}`,
                status: 'created'
            };
        } catch (error: any) {
            console.error('[PaymentService] Error creating Razorpay payment link:', error.error || error.message || error);
            return {
                id: `plink_fallback_${Date.now()}`,
                short_url: `https://rzp.io/l/demo_tnhc_${referenceId}`,
                status: 'created'
            };
        }
    }
}

export const paymentService = new PaymentService();
