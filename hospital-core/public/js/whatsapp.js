/**
 * WhatsApp Simulator Logic - V2
 */

window.initWhatsApp = function() {
    const chatContainer = document.getElementById('whatsapp-chat-container');
    const actionSheet = document.getElementById('wa-action-sheet');
    const inputTrigger = document.getElementById('wa-input-trigger');
    
    let bookingState = {
        step: 0,
        district: null,
        hospitalId: null,
        hospitalName: null,
        dept: null,
        doctorId: null,
        doctorName: null,
        slot: null
    };

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addBotMessage(text, options = null) {
        const typingId = 'typing-' + Date.now();
        const typingEl = document.createElement('div');
        typingEl.id = typingId;
        typingEl.className = 'typing-indicator';
        typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        chatContainer.appendChild(typingEl);
        scrollToBottom();

        setTimeout(() => {
            const tEl = document.getElementById(typingId);
            if (tEl) tEl.remove();

            const msgEl = document.createElement('div');
            msgEl.className = 'wa-msg bot';
            
            let html = `<span>${text}</span>`;
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            html += `<span class="wa-msg-time">${time}</span>`;
            
            msgEl.innerHTML = html;
            chatContainer.appendChild(msgEl);
            
            if (options) {
                const interactiveEl = document.createElement('div');
                interactiveEl.className = 'wa-interactive';
                
                if (options.type === 'buttons') {
                    options.items.forEach(item => {
                        const btn = document.createElement('div');
                        btn.className = 'wa-btn';
                        btn.innerText = item.label;
                        btn.onclick = () => handleUserAction(item.value, item.label);
                        interactiveEl.appendChild(btn);
                    });
                } else if (options.type === 'list') {
                    const listBtn = document.createElement('div');
                    listBtn.className = 'wa-list-btn';
                    listBtn.innerHTML = `
                        <div>
                            <div class="wa-list-title">${options.title}</div>
                            <div class="wa-list-desc">Tap to select</div>
                        </div>
                        <i class="ph ph-list"></i>
                    `;
                    listBtn.onclick = () => showActionSheet(options.title, options.items);
                    interactiveEl.appendChild(listBtn);
                }
                
                msgEl.appendChild(interactiveEl);
            }
            
            scrollToBottom();
        }, 1000 + Math.random() * 1000);
    }

    function addUserMessage(text) {
        const msgEl = document.createElement('div');
        msgEl.className = 'wa-msg user';
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        msgEl.innerHTML = `
            <span>${text}</span>
            <span class="wa-msg-time">${time} <i class="ph-fill ph-check-double" style="color: #53bdeb;"></i></span>
        `;
        chatContainer.appendChild(msgEl);
        scrollToBottom();
    }

    function showActionSheet(title, items) {
        actionSheet.innerHTML = `
            <div class="sheet-header">
                <span>${title}</span>
                <i class="ph ph-x sheet-close"></i>
            </div>
            <div class="sheet-content">
                ${items.map(item => `
                    <div class="sheet-item" data-value="${item.value}" data-label="${item.label}">
                        <div class="sheet-item-radio"></div>
                        <span>${item.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        actionSheet.querySelector('.sheet-close').onclick = () => actionSheet.classList.remove('active');
        
        actionSheet.querySelectorAll('.sheet-item').forEach(el => {
            el.onclick = () => {
                actionSheet.classList.remove('active');
                handleUserAction(el.dataset.value, el.dataset.label);
            };
        });
        
        actionSheet.classList.add('active');
    }

    function handleUserAction(value, label) {
        addUserMessage(label);
        processFlow(value, label);
    }

    function processFlow(value, label) {
        switch(bookingState.step) {
            case 0:
                if (value === 'book') {
                    bookingState.step = 1;
                    const districts = window.store.state.districts;
                    const items = districts.map(d => ({ label: d, value: d }));
                    
                    addBotMessage("Please select your District to find hospitals nearby:", {
                        type: 'list', title: 'Select District', items: items
                    });
                }
                break;
            case 1:
                bookingState.district = value;
                bookingState.step = 2;
                
                const hospitals = window.store.getHospitalsByDistrict(value);
                if (hospitals.length === 0) {
                    addBotMessage(`Sorry, no active hospitals in ${value}.`, {
                        type: 'buttons', items: [{ label: 'Start Over', value: 'book' }]
                    });
                    bookingState.step = 0;
                    return;
                }
                
                const hospItems = hospitals.map(h => ({ label: h.name, value: h.id }));
                addBotMessage(`Here are the partnered hospitals in ${value}:`, {
                    type: 'list', title: 'Select Hospital', items: hospItems
                });
                break;
            case 2:
                bookingState.hospitalId = value;
                bookingState.hospitalName = label;
                bookingState.step = 3;
                
                const depts = window.store.getDepartmentsByHospital(bookingState.hospitalId);
                if (depts.length === 0) {
                    addBotMessage(`Sorry, ${label} has no active departments.`, {
                        type: 'buttons', items: [{ label: 'Start Over', value: 'book' }]
                    });
                    bookingState.step = 0;
                    return;
                }
                const deptItems = depts.map(d => ({ label: d, value: d }));
                
                addBotMessage(`You selected ${label}. Which department do you want to visit?`, {
                    type: 'list', title: 'Select Department', items: deptItems
                });
                break;
            case 3:
                bookingState.dept = value;
                bookingState.step = 4;
                
                let doctors = window.store.getDoctorsByHospital(bookingState.hospitalId);
                let deptDocs = doctors.filter(d => d.dept === value);
                if (deptDocs.length === 0) deptDocs = doctors; 
                
                const docItems = deptDocs.map(d => ({ label: d.name, value: d.id }));
                
                addBotMessage(`Available doctors for ${value}:`, {
                    type: 'list', title: 'Select Doctor', items: docItems
                });
                break;
            case 4:
                bookingState.doctorId = value;
                bookingState.doctorName = label;
                bookingState.step = 5;
                
                // Dynamic Slot Lookup
                const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                const slots = window.store.getDoctorSlots(value, currentDay);
                
                if (slots.length === 0) {
                    addBotMessage(`Sorry, ${label} has no available slots today.`, {
                        type: 'buttons', items: [{ label: 'Start Over', value: 'book' }]
                    });
                    bookingState.step = 0;
                    return;
                }

                const slotItems = slots.map(s => ({ label: s, value: s }));
                addBotMessage(`When would you like to visit ${label}?`, {
                    type: 'list', title: 'Available Slots', items: slotItems
                });
                break;
            case 5:
                bookingState.slot = value;
                bookingState.step = 6;
                
                // Explicit Financials display for Patient
                const msg = `Almost done! Please review your payment details:

*Consultation Fee:* ₹300
*Platform Service Fee:* ₹50
*Total Payment:* ₹350

How would you like to pay?`;

                addBotMessage(msg, {
                    type: 'buttons',
                    items: [
                        { label: 'Pay Online (QR)', value: 'pay_online' },
                        { label: 'Pay at Hospital', value: 'pay_hospital' }
                    ]
                });
                break;
            case 6:
                if (value === 'pay_online') {
                    addBotMessage(`Scan this QR code to pay ₹350.\n<br><img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" style="width:150px; height:150px; margin: 10px 0; border-radius: 8px;">`);
                    
                    setTimeout(() => confirmBooking(), 4000);
                } else {
                    confirmBooking('Payment Pending');
                }
                break;
        }
    }

    function confirmBooking(paymentStatus = 'Paid') {
        const aptData = {
            patientName: 'Guest Patient ' + Math.floor(Math.random() * 100),
            hospitalId: bookingState.hospitalId,
            doctorId: bookingState.doctorId,
            time: bookingState.slot,
            status: 'Booked',
            paymentStatus: paymentStatus,
            financials: {
                consultationFee: 300,
                platformFee: 50,
                totalPaid: 350
            }
        };
        
        const newApt = window.store.addAppointment(aptData);
        
        // Return Booking ID and QR for Reception to scan
        addBotMessage(`✅ *Appointment Confirmed!*\n\n*Booking ID:* ${newApt.id}\nHospital: ${bookingState.hospitalName}\nDoctor: ${bookingState.doctorName}\nTime: ${bookingState.slot}\n\nPlease show this QR code at the reception to check-in.\n<br><img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" style="width:150px; height:150px; margin: 10px 0; border-radius: 8px;">`, {
            type: 'buttons',
            items: [{ label: 'Book Another', value: 'book' }]
        });
        
        bookingState.step = 0;
    }

    setTimeout(() => {
        addBotMessage("👋 Welcome to *Salem Health Connect*!\nI can help you book hospital appointments instantly.", {
            type: 'buttons', items: [{ label: 'Book Appointment', value: 'book' }]
        });
    }, 1000);
    
    inputTrigger.onclick = () => handleUserAction('book', 'Hi');

    // Expose method to simulate incoming API push messages
    window.waSendReschedule = function(patientName, aptId) {
        addBotMessage(`⚠️ *Action Required: Missed Appointment*\n\nHi ${patientName}, you missed your appointment (${aptId}). Please reschedule to keep your consultation fee valid.`, {
            type: 'buttons',
            items: [
                { label: 'Reschedule Now', value: 'book' },
                { label: 'Cancel', value: 'cancel' }
            ]
        });
    };
};
