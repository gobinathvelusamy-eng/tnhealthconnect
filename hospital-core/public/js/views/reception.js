/**
 * Reception View - V2 (Fixed QR Scanner & Live Queue)
 */

window.renderReception = function() {
    const container = document.createElement('div');
    
    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const myHospitalId = window.store.activeHospitalId || '1'; 
        
        let myAppointments = state.appointments;
        if (activeRole === 'hospital_admin' && myHospitalId) {
            myAppointments = state.appointments.filter(a => String(a.hospitalId) === String(myHospitalId) || String(a.hospitalId) === String(myHospitalId).replace('h', ''));
        }

        let activeQueue = myAppointments.slice().sort((a, b) => {
            const timeA = a.time ? new Date('1970/01/01 ' + a.time) : new Date();
            const timeB = b.time ? new Date('1970/01/01 ' + b.time) : new Date();
            if (timeA - timeB !== 0) return timeA - timeB;
            return a.id.localeCompare(b.id);
        });

        container.innerHTML = `
            <div class="dashboard-header">
                <h1 class="dashboard-title">Reception Desk</h1>
                <p class="dashboard-subtitle">Manage queue, QR check-ins, and walk-ins</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- QR Check-in Box -->
                    <div class="card" style="background: var(--bg-surface); text-align: center; padding: 24px;">
                        <h3 style="margin-bottom: 16px; color: var(--text-primary);">QR Scanner</h3>
                        <div id="qr-reader" style="width: 100%; max-width: 400px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color);"></div>
                        
                        <div id="scan-result" style="display: none; margin-top: 16px; text-align: left; background: var(--bg-main); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary);">
                            <!-- Injected after scan -->
                        </div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Unified Patient Queue</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Patient</th>
                                    <th>Health Issue</th>
                                    <th>Status</th>
                                    <th>Doctor</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activeQueue.map(a => `
                                    <tr class="animate-item ${a.status==='In Consultation'?'queue-card serving':''}">
                                        <td style="font-family: monospace; font-weight: 600;">${a.id}</td>
                                        <td style="font-weight: 500;">${a.patientName} (${a.patientAge || '25'}y)</td>
                                        <td><span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight: 600;">${a.department || a.healthIssue || 'General Medicine'}</span></td>
                                        <td>
                                            <select class="status-select badge" data-id="${a.id}" style="padding: 6px; border: 1px solid var(--border-color); background: var(--bg-surface); cursor: pointer; color: var(--text-primary); border-radius: 6px;">
                                                <option value="Booked" ${a.status === 'Booked' ? 'selected' : ''}>Booked</option>
                                                <option value="Checked In" ${a.status === 'Checked In' ? 'selected' : ''}>Checked In</option>
                                                <option value="In Consultation" ${a.status === 'In Consultation' ? 'selected' : ''}>In Consultation</option>
                                                <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                                <option value="Not Consulted" ${a.status === 'Not Consulted' ? 'selected' : ''}>Not Consulted</option>
                                                <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                            </select>
                                        </td>
                                        <td>${a.doctorName || 'Dr. Assigned'}</td>
                                        <td>
                                            ${a.status === 'Booked' ? `
                                                <button class="btn btn-sm btn-primary btn-action" data-id="${a.id}" data-action="checkin" style="padding: 4px 8px;"><i class="ph ph-check-circle"></i> Check In</button>
                                            ` : ''}
                                            ${a.status === 'Checked In' ? `
                                                <button class="btn btn-sm btn-outline btn-action" data-id="${a.id}" data-action="start" style="padding: 4px 8px;"><i class="ph ph-stethoscope"></i> Call In</button>
                                            ` : ''}
                                            ${a.status === 'In Consultation' ? `
                                                <button class="btn btn-sm btn-primary btn-action" data-id="${a.id}" data-action="complete" style="padding: 4px 8px; background: var(--success);"><i class="ph ph-check"></i> Complete</button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                                ${activeQueue.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-secondary);">No active patient queues right now.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        setTimeout(() => {
            const resBox = container.querySelector('#scan-result');
            let isScanning = false;
            
            // Initialize QR Scanner if Html5QrcodeScanner is loaded
            if (typeof Html5QrcodeScanner !== 'undefined') {
                const html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader", 
                    { fps: 10, qrbox: {width: 250, height: 250}, rememberLastUsedCamera: true },
                    false
                );
                
                async function onScanSuccess(decodedText, decodedResult) {
                    if(isScanning) return;
                    isScanning = true;
                    
                    html5QrcodeScanner.pause(true);
                    const qrToken = decodedText.trim();
                    const hospitalId = window.store.activeHospitalId || '1';
                    
                    resBox.style.display = 'block';
                    resBox.innerHTML = '<span style="color:var(--text-secondary)"><i class="ph ph-spinner ph-spin"></i> Verifying QR...</span>';
                    
                    const result = await window.store.scanQr(qrToken, hospitalId);
                    
                    if (result.success && result.appointment) {
                        resBox.innerHTML = `
                            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid var(--success); padding: 12px; border-radius: 8px;">
                                <strong style="color: var(--success); font-size: 16px;">✅ Verified & Checked In!</strong><br>
                                <div style="margin-top: 6px; font-size: 14px;">
                                    <b>Patient:</b> ${result.appointment.patientName}<br>
                                    <b>Booking ID:</b> ${result.appointment.id}<br>
                                    <b>Department:</b> ${result.appointment.department}<br>
                                    <b>Doctor:</b> ${result.appointment.doctorName}<br>
                                    <b>Time:</b> ${result.appointment.date} at ${result.appointment.time}
                                </div>
                            </div>
                        `;
                        
                        await window.store.checkIn(qrToken);
                        await window.store.fetchAppointments();
                        
                        setTimeout(() => { 
                            resBox.style.display = 'none'; 
                            html5QrcodeScanner.resume();
                            isScanning = false;
                        }, 5000);
                    } else {
                        resBox.innerHTML = `
                            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); padding: 12px; border-radius: 8px; color: var(--danger);">
                                <strong>❌ Scan Error:</strong> ${result.error || 'Invalid QR Token'}
                            </div>
                        `;
                        setTimeout(() => { 
                            resBox.style.display = 'none'; 
                            html5QrcodeScanner.resume();
                            isScanning = false;
                        }, 4000);
                    }
                }
                
                html5QrcodeScanner.render(onScanSuccess, (error) => {});
                window.activeQrScanner = html5QrcodeScanner;
            } else {
                container.querySelector('#qr-reader').innerHTML = '<p style="padding: 24px; color: var(--danger);">Camera library failed to load. Check internet connection.</p>';
            }

            // Manual Actions
            const actionBtns = container.querySelectorAll('.btn-action');
            actionBtns.forEach(btn => {
                btn.onclick = async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const action = e.currentTarget.dataset.action;
                    if (action === 'checkin') {
                        await window.store.checkIn(id);
                        await window.store.fetchAppointments();
                    }
                    if (action === 'start') {
                        window.store.updateAppointmentStatus(id, 'In Consultation', 'Reception');
                        await window.store.fetchAppointments();
                    }
                    if (action === 'complete') {
                        window.store.updateAppointmentStatus(id, 'Completed', 'Doctor Consultation');
                        await window.store.fetchAppointments();
                    }
                };
            });

            // Status Dropdown Edit
            const statusSelects = container.querySelectorAll('.status-select');
            statusSelects.forEach(select => {
                select.onchange = async (e) => {
                    const id = e.target.dataset.id;
                    const newStatus = e.target.value;
                    window.store.updateAppointmentStatus(id, newStatus, 'Receptionist');
                };
            });

        }, 0);
    }
    
    window.store.subscribe('appointments_updated', render);
    render();
    return container;
};
