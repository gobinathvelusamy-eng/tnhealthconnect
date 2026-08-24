import { whatsappService } from '../whatsapp/WhatsAppService';
import { paymentService } from '../payment/PaymentService';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const LARAVEL_API = 'http://localhost:8000/api';

interface FlowSession {
    flowId: string;
    flowVersionId: string;
    nodes: any[];
    edges: any[];
    currentNodeId: string;
    variables: Record<string, any>;
    lastActivity: number;
}

const activeSessions = new Map<string, FlowSession>();

export class FlowEngine {

    /**
     * Entry point for all incoming WhatsApp messages
     */
    async handleIncomingMessage(
        phoneId: string,
        token: string,
        waId: string,
        message: any
    ) {
        try {
            let session = activeSessions.get(waId);

            // 1. Handle incoming text
            if (message.type === 'text' && message.text?.body) {
                const textBody = message.text.body.trim();
                const keyword = textBody.toLowerCase();

                // If user sent "Payment Completed" or returning from payment
                if (session) {
                    const currentNode = session.nodes.find(n => n.id === session!.currentNodeId);
                    const label = (currentNode?.data?.label || '').trim();

                    if (label === 'Collect Payment' || label === 'Razorpay Payment' || keyword.includes('paid') || keyword.includes('payment completed')) {
                        console.log(`[FlowEngine] User ${waId} completed payment. Advancing to confirmation.`);
                        session.variables.payment_status = 'PAID';
                        
                        const nextEdge = session.edges.find(e => e.source === currentNode?.id);
                        if (nextEdge) {
                            session.currentNodeId = nextEdge.target;
                            await this.executeCurrentNode(phoneId, token, waId, session);
                            return;
                        }
                    }
                }

                // If no active session or keyword restart (e.g. 'hi')
                if (keyword === 'hi' || keyword === 'hello' || keyword === 'start' || !session) {
                    const trigger = await prisma.keywordTrigger.findUnique({
                        where: { keyword: 'hi' },
                        include: { flow: { include: { versions: { where: { isPublished: true }, orderBy: { versionNumber: 'desc' }, take: 1 } } } }
                    }) || await prisma.keywordTrigger.findFirst({
                        include: { flow: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } } }
                    });

                    if (trigger && trigger.flow) {
                        const latestVersion = trigger.flow.versions[0] || await prisma.flowVersion.findFirst({
                            where: { flowId: trigger.flow.id },
                            orderBy: { versionNumber: 'desc' }
                        });

                        if (latestVersion && latestVersion.nodes) {
                            console.log(`[FlowEngine] Matched Flow "${trigger.flow.name}" (Version v${latestVersion.versionNumber}) for ${waId}`);

                            const nodes = JSON.parse(latestVersion.nodes as string);
                            const edges = JSON.parse(latestVersion.edges as string);

                            const startNode = nodes.find((n: any) => n.type === 'input' || n.data?.label?.toLowerCase().includes('start')) || nodes[0];
                            const firstEdge = edges.find((e: any) => e.source === startNode?.id);
                            const firstNodeId = firstEdge ? firstEdge.target : startNode?.id;

                            session = {
                                flowId: trigger.flow.id,
                                flowVersionId: latestVersion.id,
                                nodes,
                                edges,
                                currentNodeId: firstNodeId,
                                variables: {},
                                lastActivity: Date.now()
                            };

                            activeSessions.set(waId, session);
                            await this.executeCurrentNode(phoneId, token, waId, session);
                            return;
                        }
                    }
                }
            }

            // 2. If no active session exists
            if (!session) {
                await whatsappService.sendTextMessage(
                    phoneId,
                    token,
                    waId,
                    'Hello! Welcome to TN Health Connect.\nPlease send "hi" to start booking an appointment.'
                );
                return;
            }

            // 3. Process user's response for the currentNode
            const currentNode = session.nodes.find(n => n.id === session!.currentNodeId);
            if (!currentNode) {
                activeSessions.delete(waId);
                await whatsappService.sendTextMessage(phoneId, token, waId, 'Session completed. Send "hi" to start over.');
                return;
            }

            const inputExtracted = this.extractInput(message, currentNode);
            if (inputExtracted !== null) {
                this.saveVariableForNode(session, currentNode, inputExtracted);
                console.log(`[FlowEngine] Saved for Node "${currentNode.data?.label}":`, session.variables);

                const nextEdge = session.edges.find(e => e.source === currentNode.id);
                if (nextEdge) {
                    session.currentNodeId = nextEdge.target;
                    await this.executeCurrentNode(phoneId, token, waId, session);
                } else {
                    console.log(`[FlowEngine] Flow reached final node for ${waId}.`);
                    activeSessions.delete(waId);
                }
            } else {
                console.log(`[FlowEngine] Waiting for valid response from ${waId} for node ${currentNode.data?.label}`);
            }

        } catch (error) {
            console.error('[FlowEngine] Error handling message:', error);
        }
    }

    /**
     * Triggered by Razorpay Webhook on successful payment
     */
    async confirmPaidAppointment(referenceId: string, paymentId: string, contact?: string) {
        console.log(`[FlowEngine] Automatic webhook payment confirmation for ref: "${referenceId}", contact: "${contact}"`);
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
        const token = process.env.WHATSAPP_ACCESS_TOKEN!;

        const cleanContact = contact ? contact.replace(/\D/g, '') : '';

        for (const [waId, session] of activeSessions.entries()) {
            const cleanWaId = waId.replace(/\D/g, '');
            const isMatch = (referenceId && session.variables.booking_id === referenceId) ||
                (cleanContact && (cleanWaId.endsWith(cleanContact) || cleanContact.endsWith(cleanWaId))) ||
                (session.variables.payment_link && !session.variables.payment_id);

            if (isMatch) {
                console.log(`[FlowEngine] Matched active session for user ${waId}! Generating confirmed appointment.`);
                session.variables.payment_status = 'PAID';
                session.variables.payment_id = paymentId;

                const currentNode = session.nodes.find(n => n.id === session.currentNodeId);
                const nextEdge = session.edges.find(e => e.source === currentNode?.id);
                if (nextEdge) {
                    session.currentNodeId = nextEdge.target;
                    await this.executeCurrentNode(phoneId, token, waId, session);
                }
                return;
            }
        }
        console.log('[FlowEngine] No active waiting session matched webhook. Active sessions:', Array.from(activeSessions.keys()));
    }

    /**
     * Executes the node currently pointed to by session.currentNodeId
     */
    private async executeCurrentNode(
        phoneId: string,
        token: string,
        waId: string,
        session: FlowSession
    ) {
        const node = session.nodes.find(n => n.id === session.currentNodeId);
        if (!node) {
            console.log('[FlowEngine] No node found for ID:', session.currentNodeId);
            activeSessions.delete(waId);
            return;
        }

        const label = (node.data?.label || '').trim();
        console.log(`[FlowEngine] 🚀 Executing Visual Node: "${label}" (${node.id}) for user ${waId}`);

        // --- 1. Ask Name ---
        if (label === 'Ask Name') {
            await whatsappService.sendTextMessage(
                phoneId,
                token,
                waId,
                '🏥 *Welcome to TN Health Connect!*\n\nPlease type the *Patient\'s Name* to get started:'
            );
        }

        // --- 2. Ask Age ---
        else if (label === 'Ask Age') {
            const name = session.variables.patient_name || 'Patient';
            await whatsappService.sendTextMessage(
                phoneId,
                token,
                waId,
                `Thanks ${name}! Please enter the *Patient\'s Age*:`
            );
        }

        // --- 3. Ask Gender ---
        else if (label === 'Ask Gender') {
            await whatsappService.sendButtonMessage(
                phoneId,
                token,
                waId,
                'Please select the Patient\'s Gender:',
                [
                    { id: 'gender_male', title: 'Male' },
                    { id: 'gender_female', title: 'Female' },
                    { id: 'gender_other', title: 'Other' }
                ]
            );
        }

        // --- Terms & Conditions Node ---
        else if (label === 'Terms & Conditions') {
            const termsUrl = node.data?.termsUrl || 'https://salemhealthconnect.com/terms';
            const body = `📜 *Terms & Conditions*\n\nPlease review our platform booking policies:\n🔗 ${termsUrl}\n\nDo you accept the Terms & Conditions to proceed?`;
            await whatsappService.sendButtonMessage(
                phoneId,
                token,
                waId,
                body,
                [
                    { id: 'terms_agree', title: '✅ Agree & Continue' },
                    { id: 'terms_decline', title: '❌ Decline & Cancel' }
                ]
            );
        }

        // --- 4. District Selector ---
        else if (label === 'District Selector') {
            try {
                const { data: districts } = await axios.get(`${LARAVEL_API}/districts`);
                const rows = (districts || []).slice(0, 10).map((d: any) => ({
                    id: `dist_${d.id}_${d.name}`,
                    title: d.name.substring(0, 24),
                    description: 'Select this district'
                }));

                if (rows.length > 0) {
                    await whatsappService.sendListMessage(
                        phoneId,
                        token,
                        waId,
                        'Select District',
                        'Please choose your District in Tamil Nadu:',
                        'View Districts',
                        [{ title: 'Districts', rows }]
                    );
                } else {
                    await this.skipToNextNode(phoneId, token, waId, session);
                }
            } catch (err) {
                console.error('[FlowEngine] Error fetching districts:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 5. Place Selector ---
        else if (label === 'Place Selector') {
            try {
                const districtId = session.variables.district_id || '';
                const url = districtId ? `${LARAVEL_API}/places?district_id=${districtId}` : `${LARAVEL_API}/places`;
                const { data: places } = await axios.get(url);

                const rows = (places || []).slice(0, 10).map((p: any) => ({
                    id: `place_${p.id}_${p.name}`,
                    title: (p.name || p.id).substring(0, 24),
                    description: 'Select location'
                }));

                if (rows.length > 0) {
                    await whatsappService.sendListMessage(
                        phoneId,
                        token,
                        waId,
                        'Select Location',
                        'Please choose a City / Area location:',
                        'View Locations',
                        [{ title: 'Locations', rows }]
                    );
                } else {
                    await this.skipToNextNode(phoneId, token, waId, session);
                }
            } catch (err) {
                console.error('[FlowEngine] Error fetching places:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 6. Hospital Selector ---
        else if (label === 'Hospital Selector') {
            try {
                const districtId = session.variables.district_id || '';
                const url = districtId ? `${LARAVEL_API}/hospitals?district_id=${districtId}` : `${LARAVEL_API}/hospitals`;
                const { data: hospitals } = await axios.get(url);

                const rows = (hospitals || []).slice(0, 10).map((h: any) => ({
                    id: `hosp_${h.id}_${h.name}`,
                    title: h.name.substring(0, 24),
                    description: (h.area || 'Hospital').substring(0, 72)
                }));

                if (rows.length > 0) {
                    await whatsappService.sendListMessage(
                        phoneId,
                        token,
                        waId,
                        'Select Hospital',
                        'Please select the Hospital for your visit:',
                        'View Hospitals',
                        [{ title: 'Hospitals', rows }]
                    );
                } else {
                    await this.skipToNextNode(phoneId, token, waId, session);
                }
            } catch (err) {
                console.error('[FlowEngine] Error fetching hospitals:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 7. Health Issue Selector / Specialities ---
        else if (label === 'Health Issue Selector' || label === 'Speciality Selector') {
            try {
                const hospitalId = session.variables.hospital_id || '';
                const url = hospitalId ? `${LARAVEL_API}/specialities?hospital_id=${hospitalId}` : `${LARAVEL_API}/specialities`;
                const { data: specialities } = await axios.get(url);

                let rows = (specialities || []).slice(0, 10).map((s: any) => ({
                    id: `issue_${s.id}_${s.name}`,
                    title: s.name.substring(0, 24),
                    description: 'Select this department'
                }));

                if (rows.length === 0) {
                    const fallbackDepts = [
                        { id: '1', name: 'General Medicine' },
                        { id: '2', name: 'Cardiology' },
                        { id: '3', name: 'Orthopedics' },
                        { id: '4', name: 'Pediatrics' },
                        { id: '5', name: 'Dermatology' }
                    ];
                    rows = fallbackDepts.map(s => ({
                        id: `issue_${s.id}_${s.name}`,
                        title: s.name.substring(0, 24),
                        description: 'Select this department'
                    }));
                }

                await whatsappService.sendListMessage(
                    phoneId,
                    token,
                    waId,
                    'Health Issue',
                    'Please select the Department or Health Issue you need care for:',
                    'Select Issue',
                    [{ title: 'Departments', rows }]
                );
            } catch (err) {
                console.error('[FlowEngine] Error fetching specialities:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 8. Doctor Selector ---
        else if (label === 'Doctor Selector') {
            try {
                const { data: doctors } = await axios.get(`${LARAVEL_API}/doctors`);
                const rows = (doctors || []).slice(0, 10).map((doc: any) => ({
                    id: `doc_${doc.id}_${doc.name}`,
                    title: `Dr. ${doc.name}`.substring(0, 24),
                    description: 'Available Specialist'
                }));

                if (rows.length > 0) {
                    await whatsappService.sendListMessage(
                        phoneId,
                        token,
                        waId,
                        'Select Doctor',
                        'Please select a Doctor for your consultation:',
                        'View Doctors',
                        [{ title: 'Doctors', rows }]
                    );
                } else {
                    await this.skipToNextNode(phoneId, token, waId, session);
                }
            } catch (err) {
                console.error('[FlowEngine] Error fetching doctors:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 9. Available Dates ---
        else if (label === 'Available Dates') {
            try {
                const { data: dates } = await axios.get(`${LARAVEL_API}/doctors/1/dates`);
                const rows = (dates || []).slice(0, 10).map((d: any) => ({
                    id: `date_${d.id}_${d.title}`,
                    title: d.title.substring(0, 24),
                    description: 'Appointment Date'
                }));

                await whatsappService.sendListMessage(
                    phoneId,
                    token,
                    waId,
                    'Select Date',
                    'Choose an appointment date:',
                    'View Dates',
                    [{ title: 'Available Dates', rows }]
                );
            } catch (err) {
                console.error('[FlowEngine] Error fetching dates:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 10. Available Slots ---
        else if (label === 'Available Slots') {
            try {
                const date = session.variables.appointment_date || new Date().toISOString().split('T')[0];
                const { data: slots } = await axios.get(`${LARAVEL_API}/doctors/1/slots?date=${date}`);

                const rows = (slots || []).slice(0, 10).map((s: any) => ({
                    id: `slot_${s.id}_${s.title}`,
                    title: s.title.substring(0, 24),
                    description: 'Consultation Slot'
                }));

                await whatsappService.sendListMessage(
                    phoneId,
                    token,
                    waId,
                    'Select Time Slot',
                    `Choose your preferred time on ${date}:`,
                    'View Time Slots',
                    [{ title: 'Time Slots', rows }]
                );
            } catch (err) {
                console.error('[FlowEngine] Error fetching slots:', err);
                await this.skipToNextNode(phoneId, token, waId, session);
            }
        }

        // --- 11. Collect Payment (Direct "Pay ₹350" CTA Button) ---
        else if (label === 'Collect Payment' || label === 'Razorpay Payment') {
            const patientName = session.variables.patient_name || 'Patient';
            const healthIssue = session.variables.health_issue_name || session.variables.speciality_name || 'General Medicine';
            const hospital = session.variables.hospital_name || 'TN Health Connect Center';
            const date = session.variables.appointment_date || 'Upcoming';
            const slot = session.variables.slot_time || '10:00 AM';

            const bookingRef = 'TNHC-' + Math.floor(100000 + Math.random() * 900000);
            session.variables.booking_id = bookingRef;

            const paymentResult = await paymentService.createPaymentLink(
                350,
                'INR',
                patientName,
                waId,
                bookingRef,
                `Consultation Fee for ${healthIssue} at ${hospital}`
            );

            session.variables.payment_link = paymentResult.short_url;

            const paymentBody = `Please pay the consultation fee to finalize your appointment:\n\n` +
                `💰 *Amount:* ₹350\n` +
                `👤 *Patient:* ${patientName}\n` +
                `🏥 *Hospital:* ${hospital}\n` +
                `🩺 *Department:* ${healthIssue}\n` +
                `📅 *Date & Time:* ${date} at ${slot}\n\n` +
                `Tap the *Pay ₹350* button below to pay securely. Your confirmed booking QR code will be generated immediately once paid!`;

            await whatsappService.sendCtaUrlMessage(
                phoneId,
                token,
                waId,
                '💳 Consultation Fee',
                paymentBody,
                '💳 Pay ₹350',
                paymentResult.short_url,
                'Secured by Razorpay'
            );
        }

        // --- 12. Create Appointment / Final Confirmation + Live QR Code ---
        else if (label === 'Create Appointment') {
            const patientName = session.variables.patient_name || 'Patient';
            const age = session.variables.patient_age || 'N/A';
            const gender = session.variables.patient_gender || 'N/A';
            const healthIssue = session.variables.health_issue_name || session.variables.speciality_name || 'General Medicine';
            const hospital = session.variables.hospital_name || 'TN Health Connect Center';
            const date = session.variables.appointment_date || 'Upcoming';
            const slot = session.variables.slot_time || '10:00 AM';

            const bookingId = session.variables.booking_id || ('TNHC-' + Math.floor(100000 + Math.random() * 900000));

            // Persist to Hospital Database API
            try {
                const laravelPayload = {
                    booking_id: bookingId,
                    patient_name: patientName,
                    patient_phone: waId,
                    patient_age: age !== 'N/A' ? parseInt(age) : 25,
                    patient_gender: gender !== 'N/A' ? gender : 'Male',
                    hospital_id: session.variables.hospital_id ? parseInt(session.variables.hospital_id) : 1,
                    doctor_id: session.variables.doctor_id ? parseInt(session.variables.doctor_id) : 1,
                    department_id: session.variables.department_id ? parseInt(session.variables.department_id) : 1,
                    appointment_date: date !== 'Upcoming' ? date : new Date().toISOString().split('T')[0],
                    slot_time: slot,
                    payment_id: session.variables.payment_id || 'pay_confirmed'
                };
                console.log('[FlowEngine] Syncing appointment to Hospital Admin Database:', laravelPayload);
                await axios.post(`${LARAVEL_API}/appointments`, laravelPayload);
                console.log('[FlowEngine] Successfully recorded in Hospital Database!');
            } catch (saveErr: any) {
                console.error('[FlowEngine] Failed to save appointment to Laravel DB:', saveErr.response?.data || saveErr.message);
            }

            const summary = `✅ *Appointment Confirmed!*\n\n` +
                `📋 *Booking ID:* ${bookingId}\n` +
                `👤 *Patient:* ${patientName} (${age} yrs, ${gender})\n` +
                `🏥 *Hospital:* ${hospital}\n` +
                `🩺 *Department:* ${healthIssue}\n` +
                `📅 *Date:* ${date}\n` +
                `⏰ *Time Slot:* ${slot}\n` +
                `💳 *Payment Status:* PAID (₹350)\n\n` +
                `Please show this QR code at the hospital reception.\n_Thank you for using TN Health Connect!_`;

            const qrData = encodeURIComponent(`Booking:${bookingId}|Status:PAID|Patient:${patientName}|Hospital:${hospital}|Dept:${healthIssue}|Date:${date}|Slot:${slot}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${qrData}`;

            await whatsappService.sendImageMessage(phoneId, token, waId, qrUrl, summary);

            activeSessions.delete(waId);
        }

        // --- Fallback for generic nodes ---
        else {
            await whatsappService.sendTextMessage(
                phoneId,
                token,
                waId,
                `Processing: ${label}`
            );
            await this.skipToNextNode(phoneId, token, waId, session);
        }
    }

    private async skipToNextNode(phoneId: string, token: string, waId: string, session: FlowSession) {
        const currentNode = session.nodes.find(n => n.id === session.currentNodeId);
        if (currentNode) {
            const nextEdge = session.edges.find(e => e.source === currentNode.id);
            if (nextEdge) {
                session.currentNodeId = nextEdge.target;
                await this.executeCurrentNode(phoneId, token, waId, session);
                return;
            }
        }
        activeSessions.delete(waId);
    }

    private extractInput(message: any, node: any): string | null {
        if (message.type === 'text' && message.text?.body) {
            return message.text.body.trim();
        }

        if (message.type === 'interactive') {
            if (message.interactive.type === 'button_reply') {
                return message.interactive.button_reply.id;
            }
            if (message.interactive.type === 'list_reply') {
                return message.interactive.list_reply.id;
            }
        }

        return null;
    }

    private saveVariableForNode(session: FlowSession, node: any, input: string) {
        const label = (node.data?.label || '').trim();

        if (label === 'Ask Name') {
            session.variables.patient_name = input;
        } else if (label === 'Ask Age') {
            session.variables.patient_age = input;
        } else if (label === 'Ask Gender') {
            session.variables.patient_gender = input.replace('gender_', '').toUpperCase();
        } else if (label === 'Terms & Conditions') {
            if (input === 'terms_decline' || input.toLowerCase().includes('decline') || input.toLowerCase().includes('cancel') || input.toLowerCase().includes('no')) {
                const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
                const token = process.env.WHATSAPP_ACCESS_TOKEN!;
                whatsappService.sendTextMessage(phoneId, token, session.waId, '❌ *Booking Cancelled*\n\nYou have declined the Terms & Conditions. Your appointment request has been cancelled.\n\nReply *Hi* whenever you wish to restart.');
                activeSessions.delete(session.waId);
                return;
            }
            session.variables.terms_agreed = 'YES';
        } else if (label === 'District Selector') {
            const parts = input.split('_');
            session.variables.district_id = parts[1];
            session.variables.district_name = parts.slice(2).join('_');
        } else if (label === 'Place Selector') {
            const parts = input.split('_');
            session.variables.place_id = parts[1];
            session.variables.place_name = parts.slice(2).join('_');
        } else if (label === 'Hospital Selector') {
            const parts = input.split('_');
            session.variables.hospital_id = parts[1];
            session.variables.hospital_name = parts.slice(2).join('_');
        } else if (label === 'Health Issue Selector' || label === 'Speciality Selector') {
            const parts = input.split('_');
            session.variables.department_id = parts[1];
            session.variables.health_issue_name = parts.slice(2).join('_');
        } else if (label === 'Doctor Selector') {
            const parts = input.split('_');
            session.variables.doctor_id = parts[1];
            session.variables.doctor_name = parts.slice(2).join('_');
        } else if (label === 'Available Dates') {
            const parts = input.split('_');
            session.variables.appointment_date = parts[1];
        } else if (label === 'Available Slots') {
            const parts = input.split('_');
            session.variables.slot_id = parts[1];
            session.variables.slot_time = parts.slice(2).join('_');
        }
    }
}

export const flowEngine = new FlowEngine();
