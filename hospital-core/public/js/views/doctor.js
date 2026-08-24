/**
 * Doctor Directory View
 */

window.renderDoctor = function() {
    const container = document.createElement('div');
    
    // Internal state for the view
    let currentView = 'list'; // 'list' or 'details'
    let selectedDoctorId = null;

    function render() {
        const state = window.store.state;

        if (currentView === 'list') {
            let doctors = state.doctors || [];
            
            if (window.store.activeRole === 'hospital_admin' && window.store.activeHospitalId) {
                doctors = doctors.filter(d => d.hospitalId === window.store.activeHospitalId);
            }
            
            container.innerHTML = `
                <div class="dashboard-header flex-between" style="align-items: center;">
                    <div>
                        <h1 class="dashboard-title">Doctor Directory</h1>
                        <p class="dashboard-subtitle">Select a doctor to view their consultations.</p>
                    </div>
                </div>
                
                <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Doctor Name</th>
                                    <th>Department</th>
                                    <th>Hospital</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${doctors.map(d => `
                                    <tr>
                                        <td style="font-weight: 500;">${d.name}</td>
                                        <td><span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4F46E5;">${d.department || d.dept}</span></td>
                                        <td>${state.hospitals.find(h => h.id === d.hospitalId)?.name || 'Unknown'}</td>
                                        <td><span class="badge badge-success">${d.status || 'Active'}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-primary btn-view-consultations" data-id="${d.id}"><i class="ph ph-eye"></i> View Consultations</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${doctors.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No doctors available.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const btns = container.querySelectorAll('.btn-view-consultations');
                btns.forEach(btn => {
                    btn.onclick = (e) => {
                        selectedDoctorId = e.currentTarget.dataset.id;
                        currentView = 'details';
                        render();
                    };
                });
            }, 0);

        } else if (currentView === 'details') {
            const doctor = state.doctors.find(d => d.id === selectedDoctorId);
            if (!doctor) {
                currentView = 'list';
                render();
                return;
            }

            const hospitalName = state.hospitals.find(h => String(h.id) === String(doctor.hospitalId))?.name || 'Salem City Hospital';
            const consultations = state.appointments.filter(a => String(a.doctorId) === String(doctor.id) || (a.doctorName && doctor.name && (a.doctorName.includes(doctor.name) || doctor.name.includes(a.doctorName))));

            container.innerHTML = `
                <div class="dashboard-header flex-between" style="align-items: center;">
                    <div>
                        <button class="btn btn-sm btn-outline" id="btn-back-to-list" style="margin-bottom: 12px;">
                            <i class="ph ph-arrow-left"></i> Back to Directory
                        </button>
                        <h1 class="dashboard-title">${doctor.name}'s Consultations</h1>
                        <p class="dashboard-subtitle">${doctor.department || doctor.dept} • ${hospitalName}</p>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                    <h3 style="margin-bottom: 16px;">Patient Queue & History</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Time</th>
                                    <th>Patient Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${consultations.map(c => `
                                    <tr>
                                        <td style="font-family: monospace;">${c.id}</td>
                                        <td>${c.time || new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td style="font-weight: 500;">${c.patientName}</td>
                                        <td><span class="badge" style="background:#e2e8f0; color:#475569;">${c.type || 'Unknown'}</span></td>
                                        <td>
                                            <span class="badge badge-${
                                                c.status === 'In Consultation' ? 'warning' :
                                                (c.status === 'Completed' ? 'success' :
                                                (c.status === 'Not Consulted' ? 'danger' : 'primary'))
                                            }">${c.status}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${consultations.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No consultations found for this doctor.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const backBtn = container.querySelector('#btn-back-to-list');
                if (backBtn) {
                    backBtn.onclick = () => {
                        selectedDoctorId = null;
                        currentView = 'list';
                        render();
                    };
                }
            }, 0);
        }
    }

    // Subscribe to state changes so the view updates if a new patient books
    window.store.subscribe('state_changed', () => {
        // Only re-render if we are actually visible (in the DOM)
        if (container.isConnected) {
            render();
        }
    });

    render();
    return container;
};
