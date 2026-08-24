class WhatsAppSimulator {
    constructor() {
        this.isOpen = false;
        this.step = 0;
        this.bookingData = {
            hospitalId: null,
            doctorId: null,
            amount: 350
        };
        this.init();
    }

    init() {
        // Only inject if store is ready
        if(!window.store) {
            setTimeout(() => this.init(), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'wa-widget-container';
        container.innerHTML = `
            <div id="wa-chat-window">
                <div class="wa-header">
                    <i class="ph-fill ph-user-circle" style="font-size: 36px;"></i>
                    <div class="wa-header-info">
                        <h4>TN Health Connect</h4>
                        <p>Official WhatsApp Bot</p>
                    </div>
                    <i class="ph ph-x" id="wa-close-btn" style="margin-left: auto; cursor: pointer; font-size: 20px;"></i>
                </div>
                <div class="wa-messages" id="wa-messages">
                    <!-- Messages will be injected here -->
                </div>
                <div class="wa-input-area">
                    <input type="text" class="wa-input" id="wa-input" placeholder="Type a message...">
                    <button class="wa-send-btn" id="wa-send-btn"><i class="ph-fill ph-paper-plane-right"></i></button>
                </div>
            </div>
            <div id="wa-fab">
                <i class="ph-fill ph-whatsapp-logo"></i>
            </div>
        `;
        document.body.appendChild(container);

        this.fab = document.getElementById('wa-fab');
        this.chatWindow = document.getElementById('wa-chat-window');
        this.closeBtn = document.getElementById('wa-close-btn');
        this.messages = document.getElementById('wa-messages');
        this.input = document.getElementById('wa-input');
        this.sendBtn = document.getElementById('wa-send-btn');

        this.fab.onclick = () => this.toggle();
        this.closeBtn.onclick = () => this.toggle();
        
        this.sendBtn.onclick = () => this.handleSend();
        this.input.onkeypress = (e) => {
            if(e.key === 'Enter') this.handleSend();
        };

        // Initial bot greeting
        setTimeout(() => {
            this.addBotMessage("👋 Hello! Welcome to TN Health Connect.");
            setTimeout(() => {
                this.promptHospitalSelection();
            }, 500);
        }, 500);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.chatWindow.style.display = this.isOpen ? 'flex' : 'none';
        if(this.isOpen) {
            this.input.focus();
        }
    }

    addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'wa-msg wa-msg-bot';
        div.innerHTML = text;
        this.messages.appendChild(div);
        this.scrollToBottom();
    }

    addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'wa-msg wa-msg-user';
        div.innerText = text;
        this.messages.appendChild(div);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    handleSend() {
        const text = this.input.value.trim();
        if(!text) return;
        
        this.input.value = '';
        this.addUserMessage(text);
        
        // Simple mock responses if user types manually instead of clicking buttons
        setTimeout(() => {
            if (this.step === 0) {
                this.addBotMessage("Please select a hospital from the list above to continue.");
            } else if (this.step === 10) {
                // User enters Date
                this.bookingData.date = text;
                this.addBotMessage("What is the issue or reason for your visit? (e.g., Fever, Consultation, Hernia Surgery)");
                this.step = 11;
            } else if (this.step === 11) {
                // User enters Issue
                this.bookingData.issue = text;
                this.promptDoctorSelection(this.bookingData.hospitalId);
            } else if (this.step === 1) {
                this.addBotMessage("Please select a doctor to book an appointment.");
            } else if (this.step === 6) {
                // User enters UPI ID
                const upiId = text;
                const state = window.store.state;
                if(!state.refundRequests) state.refundRequests = [];
                
                const appointment = state.appointments.find(a => a.id === this.currentBookingId);
                const patientName = appointment ? appointment.patientName : 'Unknown Patient';
                
                state.refundRequests.unshift({
                    id: 'REF-' + Date.now(),
                    bookingId: this.currentBookingId,
                    patientName: patientName,
                    upiId: upiId,
                    amount: 250,
                    status: 'Processing',
                    date: new Date().toISOString()
                });
                window.store.notify('state_changed', state);
                
                this.addBotMessage("Your refund is processing. It will take 24 hours to reflect in your account.");
                this.step = 7;
            }
        }, 800);
    }

    promptHospitalSelection() {
        this.step = 0;
        const hospitals = window.store.state.hospitals;
        
        let listHtml = `<div class="wa-list-msg">`;
        hospitals.forEach(h => {
            listHtml += `<button class="wa-list-btn hospital-btn" data-id="${h.id}">${h.name} (${h.district})</button>`;
        });
        listHtml += `</div>`;

        this.addBotMessage(`Please select a hospital to book an appointment:${listHtml}`);
        
        // Add listeners
        setTimeout(() => {
            document.querySelectorAll('.hospital-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const hId = e.target.dataset.id;
                    const hName = e.target.innerText;
                    this.bookingData.hospitalId = hId;
                    this.addUserMessage(hName);
                    this.addBotMessage("Please type the date you want to visit (e.g., YYYY-MM-DD or 'Tomorrow').");
                    this.step = 10;
                };
            });
        }, 100);
    }

    promptDoctorSelection(hospitalId) {
        this.step = 1;
        const allDocs = window.store.state.doctors.filter(d => d.hospitalId === hospitalId);
        
        let targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1); // default tomorrow
        const dateStr = (this.bookingData.date || '').toLowerCase();
        if (dateStr !== 'tomorrow' && dateStr !== '') {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) targetDate = parsed;
        }
        
        const doctors = allDocs.filter(d => {
            const leaves = window.store.state.leaves || [];
            return !leaves.some(l => {
                if (l.doctorId !== d.id) return false;
                const from = new Date(l.fromDate);
                from.setHours(0,0,0,0);
                const to = new Date(l.toDate);
                to.setHours(23,59,59,999);
                return targetDate >= from && targetDate <= to;
            });
        });
        
        if(doctors.length === 0) {
            this.addBotMessage("Sorry, no doctors are available on that date. Try another hospital or date.");
            this.promptHospitalSelection();
            return;
        }

        let listHtml = `<div class="wa-list-msg">`;
        doctors.forEach(d => {
            listHtml += `<button class="wa-list-btn doctor-btn" data-id="${d.id}">${d.name} (${d.department})</button>`;
        });
        listHtml += `</div>`;

        setTimeout(() => {
            this.addBotMessage(`Great! Available doctors:${listHtml}`);
            
            setTimeout(() => {
                document.querySelectorAll('.doctor-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        const dId = e.target.dataset.id;
                        const dName = e.target.innerText;
                        this.bookingData.doctorId = dId;
                        this.addUserMessage(dName);
                        this.promptPayment();
                    };
                });
            }, 100);
        }, 800);
    }

    promptPayment() {
        this.step = 2;
        setTimeout(() => {
            this.addBotMessage(`Confirming your slot for ${this.bookingData.date || 'tomorrow'} at 10:00 AM.`);
            setTimeout(() => {
                const payHtml = `
                    <div class="wa-list-msg">
                        <div style="padding: 12px; font-weight: bold; text-align: center; border-bottom: 1px solid #eee;">
                            Total Amount: ₹${this.bookingData.amount}
                        </div>
                        <button class="wa-list-btn pay-btn" style="color: white; background: #00a884; font-weight: bold;">
                            Pay via Razorpay / UPI
                        </button>
                    </div>
                `;
                this.addBotMessage(`Please complete your payment to confirm the booking:${payHtml}`);
                
                setTimeout(() => {
                    document.querySelector('.pay-btn').onclick = () => {
                        this.addUserMessage("Paid ₹350 successfully!");
                        this.finalizeBooking();
                    };
                }, 100);
            }, 1000);
        }, 800);
    }

    finalizeBooking() {
        this.step = 3;
        const state = window.store.state;
        const hospital = state.hospitals.find(h => h.id === this.bookingData.hospitalId);
        const doctor = state.doctors.find(d => d.id === this.bookingData.doctorId);
        
        // Generate mock data
        const idNum = state.appointments.length + 1001;
        const appointment = {
            id: `AP-${idNum}`,
            hospitalId: hospital.id,
            doctorId: doctor.id,
            patientName: "John Doe (Simulated)",
            type: this.bookingData.issue || "General Consultation",
            date: this.bookingData.date && this.bookingData.date.toLowerCase() !== 'tomorrow' 
                  ? new Date(this.bookingData.date).toISOString() 
                  : new Date(Date.now() + 86400000).toISOString(),
            time: "10:00 AM",
            status: "Waiting",
            paymentStatus: "Paid",
            financials: {
                consultationFee: 300,
                platformFee: 50,
                totalPaid: 350
            }
        };

        // Mutate state directly via store
        state.appointments.unshift(appointment);
        window.store.notify('state_changed');

        setTimeout(() => {
            this.addBotMessage(`🎉 *Booking Confirmed!*
            
Booking ID: *${appointment.id}*
Hospital: ${hospital.name}
Doctor: ${doctor.name}

Please show this ID at the reception. Thanks for using TN Health Connect!`);

            // Simulate Doctor Unavailable / Reschedule / Refund scenario
            setTimeout(() => {
                this.promptRescheduleOrRefund(appointment.id);
            }, 3000);

        }, 1200);
    }
    
    promptRescheduleOrRefund(bookingId) {
        this.step = 4;
        this.currentBookingId = bookingId;
        const msg = `⚠️ *Notice:* We apologize, but the doctor is currently unavailable for your scheduled time.

Please choose an option below:
<div class="wa-list-msg">
    <button class="wa-list-btn btn-reschedule" style="font-weight:bold; color:var(--primary);">Reschedule Appointment</button>
    <button class="wa-list-btn btn-refund" style="font-weight:bold; color:var(--danger);">Cancel & Request Refund</button>
</div>`;
        this.addBotMessage(msg);
        
        setTimeout(() => {
            document.querySelector('.btn-reschedule').onclick = () => {
                this.addUserMessage("Reschedule Appointment");
                this.addBotMessage("Please type your preferred new date and time.");
                this.step = 5;
            };
            document.querySelector('.btn-refund').onclick = () => {
                this.addUserMessage("Cancel & Request Refund");
                this.addBotMessage("Please enter your UPI ID to process the refund of ₹250 (₹100 booking fee deducted).");
                this.step = 6;
            };
        }, 100);
    }
}

// Global initialization
window.initWhatsApp = () => {
    if(!window.waSimulator) {
        window.waSimulator = new WhatsAppSimulator();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Only load if the UI is ready
    if(window.store) {
        window.initWhatsApp();
    }
});
