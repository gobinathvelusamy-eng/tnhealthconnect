import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const envPath = path.resolve(__dirname, '../../.env');

router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            whatsappAccessTokenConfigured: !!process.env.WHATSAPP_ACCESS_TOKEN,
            whatsappAccessTokenMasked: process.env.WHATSAPP_ACCESS_TOKEN 
                ? `${process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 10)}...${process.env.WHATSAPP_ACCESS_TOKEN.slice(-6)}` 
                : '',
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
            razorpayKeySecretConfigured: !!process.env.RAZORPAY_KEY_SECRET,
            razorpayKeySecretMasked: process.env.RAZORPAY_KEY_SECRET 
                ? `••••••••••••${process.env.RAZORPAY_KEY_SECRET.slice(-4)}` 
                : '',
            consultationFee: 350
        }
    });
});

router.post('/', (req: Request, res: Response) => {
    try {
        const { 
            razorpayKeyId, 
            razorpayKeySecret, 
            whatsappPhoneNumberId, 
            whatsappAccessToken 
        } = req.body;

        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

        const updateEnvVar = (key: string, value: string) => {
            if (!value) return;
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const cleanVal = value.trim();
            const formatted = cleanVal.includes(' ') ? `"${cleanVal}"` : cleanVal;
            
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${formatted}`);
            } else {
                envContent += `\n${key}=${formatted}`;
            }
            process.env[key] = cleanVal;
        };

        if (razorpayKeyId) updateEnvVar('RAZORPAY_KEY_ID', razorpayKeyId);
        if (razorpayKeySecret) updateEnvVar('RAZORPAY_KEY_SECRET', razorpayKeySecret);
        if (whatsappPhoneNumberId) updateEnvVar('WHATSAPP_PHONE_NUMBER_ID', whatsappPhoneNumberId);
        if (whatsappAccessToken) updateEnvVar('WHATSAPP_ACCESS_TOKEN', whatsappAccessToken);

        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

        return res.json({ 
            success: true, 
            message: 'Settings updated successfully! Keys are active immediately.' 
        });
    } catch (error: any) {
        console.error('[Settings] Error saving settings:', error);
        return res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
});

export default router;
