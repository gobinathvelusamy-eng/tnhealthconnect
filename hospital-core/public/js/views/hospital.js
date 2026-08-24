/**
 * Hospital Admin View - V2
 */

window.renderHospital = function() {
    const container = document.createElement('div');
    
    function render() {
        const state = window.store.state;
        const myHospitalId = 'h1';
        const myHospital = state.hospitals.find(h => h.id === myHospitalId);
        const myDoctors = state.doctors.filter(d => d.hospitalId === myHospitalId);
        const myAppointments = state.appointments.filter(a => a.hospitalId === myHospitalId);
        
        let totalConsultationRev = 0;
        myAppointments.forEach(a => {
            totalConsultationRev += a.financials.consultationFee;
        });
        
        container.innerHTML = `
            <div class="dashboard-header flex-between">
                <div>
                    <h1 class="dashboard-title">${myHospital.name} Dashboard</h1>
                    <p class="dashboard-subtitle">${myHospital.district} Branch</p>
                </div>
                <span class="badge badge-primary">ID: ${myHospital.id.toUpperCase()}</span>
            </div>
            
            <div class="stats-grid">
                <div class="card stat-card" style="border-top: 4px solid var(--success);">
                    <div class="stat-header">
                        <div class="stat-icon success"><i class="ph-fill ph-money"></i></div>
                    </div>
                    <div class="stat-value">₹${totalConsultationRev.toLocaleString()}</div>
                    <div class="stat-label">Today's Collection (Hospital Share Only)</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div class="stat-icon primary"><i class="ph-fill ph-calendar-check"></i></div>
                    </div>
                    <div class="stat-value">${myAppointments.length}</div>
                    <div class="stat-label">Total Appointments</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-header">
                        <div class="stat-icon warning"><i class="ph-fill ph-users"></i></div>
                    </div>
                    <div class="stat-value">${myAppointments.filter(a => a.status === 'Checked In').length}</div>
                    <div class="stat-label">Patients Checked In</div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="glass-panel" style="padding: 24px;">
                    <h3 style="margin-bottom: 16px;">Live Appointment Stream</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Collection</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${myAppointments.slice().reverse().map(a => `
                                    <tr class="animate-item">
                                        <td><span class="badge" style="background:#e2e8f0; color:#475569;">${a.id}</span></td>
                                        <td style="font-weight: 500;">${a.patientName} <br><span style="font-size: 11px; color: var(--text-secondary);">${a.type}</span></td>
                                        <td>${state.doctors.find(d => d.id === a.doctorId)?.name || 'Unknown'}</td>
                                        <td>${a.time}</td>
                                        <td><span class="badge badge-${a.status === 'Completed' || a.status === 'Consultation Completed' ? 'success' : (a.status === 'Booked' ? 'warning' : 'primary')}">${a.status}</span></td>
                                        <td style="color: var(--success); font-weight: 500;">₹${a.financials.consultationFee}</td>
                                    </tr>
                                `).join('')}
                                ${myAppointments.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No appointments yet.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 16px;">Audit Timeline Explorer</h3>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">View the lifecycle of recent appointments.</p>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${myAppointments.slice(-3).reverse().map(a => `
                            <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
                                <div class="flex-between" style="margin-bottom: 8px;">
                                    <span style="font-weight: 600;">${a.patientName}</span>
                                    <span style="font-size: 11px; color: var(--text-secondary);">${a.id}</span>
                                </div>
                                <div class="timeline" style="margin-top: 8px;">
                                    ${a.auditTimeline.slice(-2).map(log => `
                                        <div class="timeline-item">
                                            <div class="timeline-time">${log.time}</div>
                                            <div class="timeline-action">${log.action}</div>
                                            <div class="timeline-user">by ${log.user}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    window.store.subscribe('state_changed', render);
    render();
    
    return container;
};
