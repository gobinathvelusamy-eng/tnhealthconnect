/**
 * Placeholder Views
 */

window.renderPlaceholder = function(title, description, icon) {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="dashboard-header">
            <h1 class="dashboard-title">${title}</h1>
            <p class="dashboard-subtitle">${description}</p>
        </div>
        <div class="card" style="text-align: center; padding: 64px 24px; margin-top: 24px;">
            <i class="ph ${icon}" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 24px; opacity: 0.5;"></i>
            <h2 style="color: var(--text-secondary); margin-bottom: 8px;">Coming Soon</h2>
            <p style="color: var(--text-secondary);">This module is currently under development.</p>
        </div>
    `;
    return container;
};

window.renderPatients = function() {
    const container = document.createElement('div');
    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const activeHospitalId = window.store.activeHospitalId;
        
        let displayAppointments = state.appointments;
        if (activeRole === 'hospital_admin' && activeHospitalId) {
            displayAppointments = state.appointments.filter(a => String(a.hospitalId) === String(activeHospitalId) || String(a.hospitalId) === String(activeHospitalId).replace('h', ''));
        }
        
        // Group appointments by unique patient name
        const uniquePatientsMap = new Map();
        displayAppointments.forEach(a => {
            if (!uniquePatientsMap.has(a.patientName)) {
                uniquePatientsMap.set(a.patientName, { 
                    name: a.patientName, 
                    phone: a.patientPhone,
                    age: a.patientAge || '25',
                    healthIssue: a.healthIssue || a.department || 'General Medicine', 
                    lastVisit: a.date, 
                    hospitalId: a.hospitalId,
                    hospitalName: a.hospitalName || state.hospitals.find(h => String(h.id) === String(a.hospitalId))?.name || 'Salem City Hospital',
                    appointments: [a]
                });
            } else {
                const p = uniquePatientsMap.get(a.patientName);
                p.lastVisit = a.date;
                p.appointments.push(a);
            }
        });
        const uniquePatients = Array.from(uniquePatientsMap.values());
        
        container.innerHTML = `
            <div class="dashboard-header flex-between" style="align-items: center;">
                <div>
                    <h1 class="dashboard-title">Patients Directory</h1>
                    <p class="dashboard-subtitle">Manage all patient records, history, and booked slots.</p>
                </div>
            </div>
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>PATIENT NAME</th>
                                <th>HEALTH ISSUE</th>
                                <th>HOSPITAL REGISTERED</th>
                                <th>LAST VISIT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${uniquePatients.map((p, idx) => `
                                <tr>
                                    <td style="font-weight: 600;">${p.name} <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(${p.phone || 'WhatsApp'})</span></td>
                                    <td><span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight: 600;">${p.healthIssue}</span></td>
                                    <td>${p.hospitalName}</td>
                                    <td>${p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'Today'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline btn-view-history" data-patient-idx="${idx}" style="padding: 4px 10px; border-radius: 6px;">
                                            <i class="ph ph-eye"></i> View History
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${uniquePatients.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-secondary);">No patient records found yet.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Patient History Modal -->
            <div id="patient-history-modal" class="modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div class="card" style="width: 100%; max-width: 650px; background: var(--bg-surface); padding: 28px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-height: 85vh; overflow-y: auto;">
                    <div class="flex-between" style="border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px;">
                        <h2 id="modal-patient-name" style="font-size: 20px; font-weight: 700; color: var(--text-primary);">Patient Consultation History</h2>
                        <button id="close-patient-modal" class="btn btn-sm btn-outline" style="border: none; font-size: 20px; cursor: pointer;">&times;</button>
                    </div>
                    <div id="modal-history-content">
                        <!-- History table injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const modal = container.querySelector('#patient-history-modal');
            const closeBtn = container.querySelector('#close-patient-modal');
            if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

            const historyBtns = container.querySelectorAll('.btn-view-history');
            historyBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.currentTarget.dataset.patientIdx);
                    const patient = uniquePatients[idx];
                    if (!patient) return;

                    container.querySelector('#modal-patient-name').textContent = `${patient.name}'s History (${patient.phone || 'WhatsApp'})`;
                    
                    const content = container.querySelector('#modal-history-content');
                    content.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${patient.appointments.map(a => `
                                <div style="border: 1px solid var(--border-color); background: var(--bg-main); border-radius: 10px; padding: 14px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-weight: 700; color: var(--primary); font-family: monospace;">📋 ${a.id}</span>
                                        <span class="badge ${a.status === 'Booked' ? 'badge-primary' : 'badge-success'}">${a.status}</span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                                        <div>🏥 <b>Hospital:</b> ${a.hospitalName || 'Salem City Hospital'}</div>
                                        <div>👨‍⚕️ <b>Doctor:</b> ${a.doctorName || 'Dr. Specialist'}</div>
                                        <div>🩺 <b>Department:</b> ${a.department || a.healthIssue || 'General Medicine'}</div>
                                        <div>⏰ <b>Slot:</b> ${a.date} at ${a.time}</div>
                                        <div>💳 <b>Payment:</b> ₹${a.financials?.totalPaid || 350} (${a.paymentStatus || 'Paid'})</div>
                                        <div>🎟️ <b>Token:</b> ${a.tokenNumber || 'TKN-1'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    modal.style.display = 'flex';
                };
            });
        }, 0);
    }
    window.store.subscribe('appointments_updated', render);
    render();
    return container;
};

window.renderBilling = function() {
    const container = document.createElement('div');
    
    let filterDateStr = ""; 
    let filterHospitalId = "";
    let searchTerm = "";

    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const activeHospitalId = window.store.activeHospitalId;
        
        let displayAppointments = state.appointments;
        
        if (activeRole !== 'super_admin' && activeHospitalId) {
            displayAppointments = displayAppointments.filter(a => String(a.hospitalId) === String(activeHospitalId));
        }
        
        if (filterHospitalId) {
            displayAppointments = displayAppointments.filter(a => String(a.hospitalId) === String(filterHospitalId));
        }
        if (filterDateStr) {
            displayAppointments = displayAppointments.filter(a => {
                const aDate = new Date(a.date).toISOString().split('T')[0];
                return aDate === filterDateStr;
            });
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            displayAppointments = displayAppointments.filter(a => {
                const hName = (a.hospitalName || '').toLowerCase();
                return a.patientName.toLowerCase().includes(term) || a.id.toLowerCase().includes(term) || hName.includes(term);
            });
        }
        
        container.innerHTML = `
            <div class="dashboard-header flex-between" style="align-items: center;">
                <div>
                    <h1 class="dashboard-title">Billing & Invoices</h1>
                    <p class="dashboard-subtitle">Manage payments, downloadable PDF receipts, and revenue splits.</p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${activeRole === 'super_admin' ? `
                    <select id="bill-filter-hospital" class="wa-input" style="padding: 8px; border-radius: 8px;">
                        <option value="">All Hospitals</option>
                        ${state.hospitals.map(h => `<option value="${h.id}" ${filterHospitalId === String(h.id) ? 'selected' : ''}>${h.name}</option>`).join('')}
                    </select>
                    ` : ''}
                    <input type="date" id="bill-filter-date" class="wa-input" value="${filterDateStr}" style="padding: 8px; border-radius: 8px;">
                    <div style="position: relative;">
                        <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                        <input type="text" id="bill-search" value="${searchTerm}" placeholder="Search invoices..." style="padding-left: 36px; padding-top: 8px; padding-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
                    </div>
                </div>
            </div>
            
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Date</th>
                                <th>Patient</th>
                                <th>Hospital</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${displayAppointments.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 24px;">No records found.</td></tr>' : ''}
                            ${displayAppointments.map(a => `
                                <tr>
                                    <td style="font-family: monospace; font-weight: 600;">INV-${a.id}</td>
                                    <td>${a.date} ${a.time}</td>
                                    <td style="font-weight: 500;">${a.patientName}</td>
                                    <td>${a.hospitalName || 'Salem City Hospital'}</td>
                                    <td style="font-weight: 600; color: var(--success);">₹${a.financials?.totalPaid || 350}</td>
                                    <td><span class="badge badge-success">${a.paymentStatus || 'Success'}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-primary btn-print-pdf" data-invoice="INV-${a.id}" data-patient="${a.patientName}" data-amount="${a.financials?.totalPaid || 350}" data-consultfee="${a.financials?.consultationFee || 300}" data-platfee="${a.financials?.platformFee || 50}" data-date="${a.date} ${a.time}" data-hospital="${a.hospitalName || 'Salem City Hospital'}" data-doctor="${a.doctorName || 'Dr. Specialist'}" data-dept="${a.department || 'General Medicine'}" style="padding: 4px 10px; border-radius: 6px;">
                                            <i class="ph ph-file-pdf"></i> Download PDF
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        setTimeout(() => {
            const hospFilter = container.querySelector('#bill-filter-hospital');
            if (hospFilter) hospFilter.onchange = (e) => { filterHospitalId = e.target.value; render(); };
            
            const dateFilter = container.querySelector('#bill-filter-date');
            if (dateFilter) dateFilter.onchange = (e) => { filterDateStr = e.target.value; render(); };
            
            const searchBox = container.querySelector('#bill-search');
            if (searchBox) searchBox.oninput = (e) => { searchTerm = e.target.value; render(); };

            const printBtns = container.querySelectorAll('.btn-print-pdf');
            printBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const data = e.currentTarget.dataset;
                    
                    // Create formatted printable HTML receipt window
                    const printWindow = window.open('', '_blank', 'width=750,height=800');
                    if (!printWindow) return alert('Please allow popups to download/print PDF invoices.');

                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${data.invoice} - Official Receipt</title>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                                .invoice-card { max-width: 600px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
                                .logo { font-size: 24px; font-weight: bold; color: #0284c7; }
                                .inv-title { font-size: 18px; color: #64748b; font-weight: 600; }
                                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 14px; }
                                .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                                .fee-table th, .fee-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                                .fee-table th { background: #f8fafc; font-weight: 600; color: #475569; }
                                .total-row { font-size: 16px; font-weight: bold; color: #0f172a; border-top: 2px solid #0284c7; }
                                .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
                                @media print { body { padding: 0; } .invoice-card { border: none; box-shadow: none; } }
                            </style>
                        </head>
                        <body>
                            <div class="invoice-card">
                                <div class="header">
                                    <div class="logo">🏥 TN Health Connect</div>
                                    <div class="inv-title">${data.invoice}</div>
                                </div>
                                <div class="details-grid">
                                    <div>
                                        <strong>Billed To:</strong><br>
                                        ${data.patient}<br>
                                        Date: ${data.date}
                                    </div>
                                    <div style="text-align: right;">
                                        <strong>Hospital & Doctor:</strong><br>
                                        ${data.hospital}<br>
                                        ${data.doctor} (${data.dept})
                                    </div>
                                </div>
                                <table class="fee-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th style="text-align: right;">Amount (INR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Doctor Consultation Fee</td>
                                            <td style="text-align: right;">₹${data.consultfee}</td>
                                        </tr>
                                        <tr>
                                            <td>Platform Booking & Digital Queue Service Fee</td>
                                            <td style="text-align: right;">₹${data.platfee}</td>
                                        </tr>
                                        <tr class="total-row">
                                            <td>Total Paid (Razorpay UPI)</td>
                                            <td style="text-align: right; color: #16a34a;">₹${data.amount}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style="text-align: center; margin-top: 16px;">
                                    <span style="background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">✅ PAYMENT COMPLETED (ONLINE)</span>
                                </div>
                                <div class="footer">
                                    Official electronic invoice generated by TN Health Connect Platform.<br>
                                    Please present your booking QR Code at the hospital reception desk.
                                </div>
                            </div>
                            <script>
                                window.onload = function() { window.print(); };
                            </script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                };
            });
        }, 0);
    }
    window.store.subscribe('appointments_updated', render);
    render();
    return container;
};

window.renderSettings = function() {
    const container = document.createElement('div');
    
    function render() {
        container.innerHTML = `
            <div class="dashboard-header">
                <h1 class="dashboard-title">Settings</h1>
                <p class="dashboard-subtitle">Platform configuration and integrations.</p>
            </div>
            
            <div class="card p-6" style="margin-bottom: 24px; max-width: 800px; background: var(--bg-surface);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                    <i class="ph ph-whatsapp-logo" style="font-size: 32px; color: #25D366;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">WhatsApp Cloud API Integrations</h3>
                        <p style="margin: 4px 0 0; font-size: 0.9rem; color: var(--text-secondary);">Manage credentials used by the ConversationEngine.</p>
                    </div>
                </div>

                <div style="display: grid; gap: 16px;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">WhatsApp Access Token</label>
                        <input type="password" id="set-wa-token" value="${window.store.settings?.whatsapp_access_token || ''}" placeholder="EAAIxxx..." style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: monospace; background: var(--bg-main); color: var(--text-primary);">
                    </div>

                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">WhatsApp Phone Number ID</label>
                        <input type="text" id="set-wa-phone" value="${window.store.settings?.whatsapp_phone_number_id || ''}" placeholder="104xxxxxxxxxx" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: monospace; background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Webhook Verify Token (Meta Developer Portal)</label>
                        <input type="text" id="set-wa-verify" value="${window.store.settings?.whatsapp_webhook_verify_token || ''}" placeholder="salem_health_secure_token" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: monospace; background: var(--bg-main); color: var(--text-primary);">
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                        <button id="btn-save-settings" class="btn btn-primary" style="padding: 12px 24px;">
                            <i class="ph ph-floppy-disk"></i> Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const btn = container.querySelector('#btn-save-settings');
            if(btn) {
                btn.onclick = async () => {
                    const token = container.querySelector('#set-wa-token').value;
                    const phone = container.querySelector('#set-wa-phone').value;
                    const verify = container.querySelector('#set-wa-verify').value;
                    
                    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                    
                    await window.store.saveSettings({
                        whatsapp_access_token: token,
                        whatsapp_phone_number_id: phone,
                        whatsapp_webhook_verify_token: verify
                    });
                    
                    btn.innerHTML = '<i class="ph ph-check"></i> Saved!';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Configuration';
                    }, 2000);
                };
            }
        }, 0);
    }
    
    window.store.subscribe('settings_saved', render);
    render();
    return container;
};

window.renderAnalytics = function() {
    const container = document.createElement('div');
    
    let filterDateStr = "";
    let filterHospitalId = "";
    
    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const activeHospitalId = window.store.activeHospitalId;
        
        let displayAppointments = state.appointments;
        if (activeRole !== 'super_admin' && activeHospitalId) {
            displayAppointments = state.appointments.filter(a => a.hospitalId === activeHospitalId);
        }
        
        // User filters
        if (filterHospitalId) {
            displayAppointments = displayAppointments.filter(a => a.hospitalId === filterHospitalId);
        }
        if (filterDateStr) {
            displayAppointments = displayAppointments.filter(a => {
                const aDate = new Date(a.date).toISOString().split('T')[0];
                return aDate === filterDateStr;
            });
        }
        
        let todaysRevenue = 0;
        displayAppointments.forEach(a => {
            if(a.paymentStatus === 'Paid') {
                todaysRevenue += a.financials.totalPaid;
            }
        });
        
        container.innerHTML = `
            <div class="dashboard-header flex-between" style="align-items: center;">
                <div>
                    <h1 class="dashboard-title">Analytics & Reports</h1>
                    <p class="dashboard-subtitle">Track hospital performance and platform revenue.</p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${activeRole === 'super_admin' ? `
                    <select id="analytics-filter-hospital" class="wa-input" style="padding: 8px; border-radius: 8px;">
                        <option value="">All Hospitals</option>
                        ${state.hospitals.map(h => `<option value="${h.id}" ${filterHospitalId === h.id ? 'selected' : ''}>${h.name}</option>`).join('')}
                    </select>
                    ` : ''}
                    <input type="date" id="analytics-filter-date" class="wa-input" value="${filterDateStr}" style="padding: 8px; border-radius: 8px;">
                </div>
            </div>
            
            <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(37, 211, 102, 0.1); color: #25D366;">
                        <i class="ph ph-money"></i>
                    </div>
                    <div class="stat-value">₹${todaysRevenue}</div>
                    <div class="stat-label">Total Payment (Filtered)</div>
                </div>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="card" style="margin-top: 24px; background: var(--bg-surface); padding: 24px;">
                    <h3 style="margin-bottom: 24px;">Revenue Chart (Platform vs Hospital)</h3>
                    <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center;">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px; background: var(--bg-surface); padding: 24px;">
                    <h3 style="margin-bottom: 24px;">Consultation Success Rate</h3>
                    <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center;">
                        <canvas id="successChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const hospFilter = container.querySelector('#analytics-filter-hospital');
            if (hospFilter) hospFilter.onchange = (e) => { filterHospitalId = e.target.value; render(); };
            
            const dateFilter = container.querySelector('#analytics-filter-date');
            if (dateFilter) dateFilter.onchange = (e) => { filterDateStr = e.target.value; render(); };

            const ctx = container.querySelector('#revenueChart');
            if (ctx && typeof Chart !== 'undefined') {
                let platformTotal = 0;
                let hospitalTotal = 0;
                displayAppointments.forEach(a => {
                    platformTotal += a.financials.platformFee;
                    hospitalTotal += a.financials.consultationFee;
                });

                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Platform Revenue (₹)', 'Hospital Consultation (₹)'],
                        datasets: [{
                            data: [platformTotal, hospitalTotal],
                            backgroundColor: ['rgba(79, 70, 229, 0.7)', 'rgba(16, 185, 129, 0.7)'],
                            borderColor: ['#4F46E5', '#10B981'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }

            const ctx2 = container.querySelector('#successChart');
            if (ctx2 && typeof Chart !== 'undefined') {
                let completed = 0;
                let notConsulted = 0;
                let inProgress = 0;
                displayAppointments.forEach(a => {
                    if (a.status === 'Completed') completed++;
                    else if (a.status === 'Not Consulted' || a.status === 'Cancelled') notConsulted++;
                    else inProgress++;
                });

                new Chart(ctx2, {
                    type: 'pie',
                    data: {
                        labels: ['Consulted (Completed)', 'Non-Consulted', 'In Progress / Booked'],
                        datasets: [{
                            data: [completed, notConsulted, inProgress],
                            backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)'],
                            borderColor: ['#10B981', '#EF4444', '#F59E0B'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }, 0);
    }
    window.store.subscribe('state_changed', render);
    render();
    return container;
};

window.renderStaff = function() {
    const container = document.createElement('div');
    
    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const activeHospitalId = window.store.activeHospitalId;
        
        let staff = state.doctors || []; 
        if (activeRole === 'hospital_admin' && activeHospitalId) {
            staff = staff.filter(d => d.hospitalId === activeHospitalId);
        }
        
        container.innerHTML = `
            <div class="dashboard-header flex-between" style="align-items: center;">
                <div>
                    <h1 class="dashboard-title">Doctor Management</h1>
                    <p class="dashboard-subtitle">Manage doctors and receptionists.</p>
                </div>
                <button class="btn btn-primary" id="btn-add-staff"><i class="ph ph-plus"></i> Add Doctor</button>
            </div>
            
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Hospital</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${staff.map(d => `
                                <tr>
                                    <td style="font-weight: 500;">${d.name}</td>
                                    <td><span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4F46E5;">Doctor</span></td>
                                    <td>${d.department}</td>
                                    <td>${state.hospitals.find(h=>h.id === d.hospitalId)?.name || 'Unknown'}</td>
                                    <td><span class="badge badge-success">${d.status || 'Active'}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline btn-edit-staff" data-id="${d.id}" data-name="${d.name}" data-dept="${d.department}"><i class="ph ph-pencil"></i> Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Modal -->
            <div id="add-staff-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
                <div class="card" style="width: 400px; background: var(--bg-surface);">
                    <h3 style="margin-bottom: 16px;">Add Doctor</h3>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Name</label>
                        <input type="text" id="add-s-name" style="width: 100%;" placeholder="e.g. Dr. Jane Doe">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Department</label>
                        <select id="add-s-dept" style="width: 100%;">
                            ${state.departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <div style="margin-bottom: 16px; ${window.store.activeRole === 'hospital_admin' ? 'display:none;' : ''}">
                        <label style="display: block; margin-bottom: 8px;">Hospital</label>
                        <select id="add-s-hospital" style="width: 100%;">
                            ${state.hospitals.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" id="btn-cancel-add">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-add">Add Doctor</button>
                    </div>
                </div>
            </div>

            <!-- Edit Staff Modal -->
            <div id="edit-staff-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
                <div class="card" style="width: 400px; background: var(--bg-surface);">
                    <h3 style="margin-bottom: 16px;">Edit Staff</h3>
                    <input type="hidden" id="edit-s-id">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Name</label>
                        <input type="text" id="edit-s-name" style="width: 100%;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Department</label>
                        <select id="edit-s-dept" style="width: 100%;">
                            ${state.departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" id="btn-cancel-edit-staff">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-edit-staff">Save Changes</button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            // Edit Staff Logic
            const editBtns = container.querySelectorAll('.btn-edit-staff');
            const editModal = container.querySelector('#edit-staff-modal');
            editBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.dataset.id;
                    const name = e.currentTarget.dataset.name;
                    const dept = e.currentTarget.dataset.dept;
                    container.querySelector('#edit-s-id').value = id;
                    container.querySelector('#edit-s-name').value = name;
                    container.querySelector('#edit-s-dept').value = dept;
                    editModal.style.display = 'flex';
                };
            });
            
            const cancelEdit = container.querySelector('#btn-cancel-edit-staff');
            if (cancelEdit) cancelEdit.onclick = () => editModal.style.display = 'none';
            
            const saveEdit = container.querySelector('#btn-save-edit-staff');
            if (saveEdit) saveEdit.onclick = () => {
                const id = container.querySelector('#edit-s-id').value;
                const name = container.querySelector('#edit-s-name').value;
                const dept = container.querySelector('#edit-s-dept').value;
                function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)); }
                
                if (name) {
                    const doc = state.doctors.find(d => d.id === id);
                    if (doc) {
                        doc.name = escapeHTML(name);
                        doc.department = escapeHTML(dept);
                        doc.dept = escapeHTML(dept);
                        window.store.notify('state_changed', state);
                        editModal.style.display = 'none';
                        render();
                    }
                }
            };

            // Add Staff Logic
            const addBtn = container.querySelector('#btn-add-staff');
            const addModal = container.querySelector('#add-staff-modal');
            if (addBtn) addBtn.onclick = () => addModal.style.display = 'flex';
            
            const cancelAdd = container.querySelector('#btn-cancel-add');
            if (cancelAdd) cancelAdd.onclick = () => addModal.style.display = 'none';
            
            const saveAdd = container.querySelector('#btn-save-add');
            if (saveAdd) saveAdd.onclick = () => {
                const name = container.querySelector('#add-s-name').value;
                const dept = container.querySelector('#add-s-dept').value;
                const activeRole = window.store.activeRole;
                const activeHospitalId = window.store.activeHospitalId;
                
                const hosp = (activeRole === 'hospital_admin' && activeHospitalId) 
                            ? activeHospitalId 
                            : container.querySelector('#add-s-hospital').value;
                
                function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)); }
                
                if (name && dept && hosp) {
                    state.doctors.push({
                        id: 'd' + (state.doctors.length + 1),
                        name: escapeHTML(name),
                        department: escapeHTML(dept),
                        dept: escapeHTML(dept),
                        hospitalId: hosp,
                        status: 'Active'
                    });
                    window.store.notify('state_changed', state);
                    addModal.style.display = 'none';
                }
            };

        }, 0);
    }
    window.store.subscribe('state_changed', render);
    render();
    return container;
};

window.renderRefunds = function() {
    const container = document.createElement('div');
    function render() {
        const state = window.store.state;
        const requests = state.refundRequests || [];
        
        container.innerHTML = `
            <div class="dashboard-header flex-between" style="align-items: center;">
                <div>
                    <h1 class="dashboard-title">Refund Requests</h1>
                    <p class="dashboard-subtitle">Manage patient non-consultation refund requests.</p>
                </div>
            </div>
            
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Patient Name</th>
                                <th>UPI ID</th>
                                <th>Refund Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${requests.map(r => `
                                <tr>
                                    <td style="font-family: monospace;">${r.bookingId}</td>
                                    <td style="font-weight: 500;">${r.patientName}</td>
                                    <td>${r.upiId}</td>
                                    <td style="font-weight: 700; color: var(--danger);">₹${r.amount}</td>
                                    <td>
                                        <span class="badge badge-${r.status === 'Processing' ? 'warning' : (r.status === 'Refunded' ? 'success' : 'danger')}">${r.status}</span>
                                    </td>
                                    <td>
                                        ${r.status === 'Processing' ? `
                                            <button class="btn btn-sm btn-primary btn-approve-refund" data-id="${r.id}">Process</button>
                                            <button class="btn btn-sm btn-outline btn-cancel-refund" data-id="${r.id}" style="margin-left: 8px; border-color: var(--danger); color: var(--danger);">Cancel</button>
                                        ` : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                            ${requests.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 24px;">No refund requests pending.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            container.querySelectorAll('.btn-approve-refund').forEach(btn => {
                btn.onclick = (e) => {
                    const req = state.refundRequests.find(r => r.id === e.currentTarget.dataset.id);
                    if(req) {
                        req.status = 'Refunded';
                        const appointment = state.appointments.find(a => a.id === req.bookingId);
                        if(appointment) {
                            appointment.paymentStatus = 'Refunded';
                            appointment.status = 'Refunded';
                        }
                        window.store.notify('state_changed', state);
                    }
                };
            });
            container.querySelectorAll('.btn-cancel-refund').forEach(btn => {
                btn.onclick = (e) => {
                    const req = state.refundRequests.find(r => r.id === e.currentTarget.dataset.id);
                    if(req) {
                        req.status = 'Cancelled';
                        window.store.notify('state_changed', state);
                    }
                };
            });
        }, 100);
    }
    window.store.subscribe('state_changed', render);
    render();
    return container;
};
