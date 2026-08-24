window.renderLeaves = function() {
    const container = document.createElement('div');

    function render() {
        const state = window.store.state;
        const activeRole = window.store.activeRole;
        const activeHospitalId = window.store.activeHospitalId;

        // Ensure leaves array exists
        if (!state.leaves) state.leaves = [];

        // Filter leaves
        let displayLeaves = state.leaves;
        if (activeRole !== 'super_admin' && activeHospitalId) {
            displayLeaves = state.leaves.filter(l => l.hospitalId === activeHospitalId);
        }

        // Available Hospitals
        const availableHospitals = state.hospitals.filter(h => h.status !== 'Disabled');

        container.innerHTML = `
            <div class="dashboard-header flex-between">
                <div>
                    <h1 class="dashboard-title">Leave Management</h1>
                    <p class="dashboard-subtitle">Manage doctor holidays and unavailability</p>
                </div>
                <button class="btn btn-primary" id="btn-add-leave"><i class="ph ph-plus"></i> Record Leave</button>
            </div>
            
            <div class="glass-panel" style="padding: 24px;">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Leave ID</th>
                                ${activeRole === 'super_admin' ? '<th>Hospital</th>' : ''}
                                <th>Doctor</th>
                                <th>Department</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${displayLeaves.length === 0 ? '<tr><td colspan="8" style="text-align:center; color: var(--text-secondary);">No leave records found.</td></tr>' : ''}
                            ${displayLeaves.map(l => {
                                const hospital = state.hospitals.find(h => h.id === l.hospitalId);
                                const doctor = state.doctors.find(d => d.id === l.doctorId);
                                return `
                                    <tr>
                                        <td style="font-family: monospace;">${l.id}</td>
                                        ${activeRole === 'super_admin' ? `<td>${hospital ? hospital.name : 'Unknown'}</td>` : ''}
                                        <td style="font-weight: 500;">${doctor ? doctor.name : 'Unknown'}</td>
                                        <td><span class="badge" style="background:#e2e8f0; color:#475569;">${l.department}</span></td>
                                        <td>${new Date(l.fromDate).toLocaleDateString()}</td>
                                        <td>${new Date(l.toDate).toLocaleDateString()}</td>
                                        <td>${l.reason}</td>
                                        <td>
                                            <button class="btn btn-sm btn-danger btn-delete-leave" data-id="${l.id}" style="padding: 4px 8px;"><i class="ph ph-trash"></i> Cancel</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Leave Modal -->
            <div id="add-leave-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
                <div class="card" style="width: 500px; max-height: 85vh; overflow-y: auto; background: var(--bg-surface);">
                    <h3 style="margin-bottom: 16px;">Record Doctor Leave</h3>
                    
                    ${activeRole === 'super_admin' ? `
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Hospital</label>
                        <select id="add-l-hospital" style="width: 100%;">
                            <option value="">-- Select Hospital --</option>
                            ${availableHospitals.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
                        </select>
                    </div>
                    ` : `<input type="hidden" id="add-l-hospital" value="${activeHospitalId}">`}

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Department</label>
                        <select id="add-l-department" style="width: 100%;">
                            <option value="">-- Select Department --</option>
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Doctor</label>
                        <select id="add-l-doctor" style="width: 100%;">
                            <option value="">-- Select Doctor --</option>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px;">From Date</label>
                            <input type="date" id="add-l-from" style="width: 100%;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px;">To Date</label>
                            <input type="date" id="add-l-to" style="width: 100%;">
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px;">Reason</label>
                        <select id="add-l-reason" style="width: 100%;">
                            <option value="Holiday">Holiday</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Personal Leave">Personal Leave</option>
                            <option value="Conference/Training">Conference/Training</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="flex-between">
                        <button class="btn btn-outline" id="btn-cancel-leave">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-leave">Save Leave</button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const addModal = container.querySelector('#add-leave-modal');
            const btnAdd = container.querySelector('#btn-add-leave');
            const btnCancel = container.querySelector('#btn-cancel-leave');
            const btnSave = container.querySelector('#btn-save-leave');

            const hospitalSelect = container.querySelector('#add-l-hospital');
            const deptSelect = container.querySelector('#add-l-department');
            const doctorSelect = container.querySelector('#add-l-doctor');

            // Populate departments based on hospital
            function updateDepartments() {
                const hId = hospitalSelect.value;
                deptSelect.innerHTML = '<option value="">-- Select Department --</option>';
                doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
                if (!hId) return;

                const hDoctors = state.doctors.filter(d => d.hospitalId === hId && d.status === 'Active');
                const depts = [...new Set(hDoctors.map(d => d.department))];
                depts.forEach(dept => {
                    if (dept) deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
                });
            }

            // Populate doctors based on hospital and department
            function updateDoctors() {
                const hId = hospitalSelect.value;
                const dept = deptSelect.value;
                doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
                if (!hId || !dept) return;

                const docs = state.doctors.filter(d => d.hospitalId === hId && d.department === dept && d.status === 'Active');
                docs.forEach(doc => {
                    doctorSelect.innerHTML += `<option value="${doc.id}">${doc.name}</option>`;
                });
            }

            if (hospitalSelect && activeRole === 'super_admin') {
                hospitalSelect.addEventListener('change', updateDepartments);
            }
            if (deptSelect) {
                deptSelect.addEventListener('change', updateDoctors);
            }

            if (btnAdd) {
                btnAdd.onclick = () => {
                    addModal.style.display = 'flex';
                    if (activeRole !== 'super_admin') {
                        updateDepartments(); // auto populate for hospital/reception context
                    }
                };
            }

            if (btnCancel) {
                btnCancel.onclick = () => {
                    addModal.style.display = 'none';
                };
            }

            if (btnSave) {
                btnSave.onclick = () => {
                    const hId = hospitalSelect.value;
                    const dept = deptSelect.value;
                    const docId = doctorSelect.value;
                    const fromDate = container.querySelector('#add-l-from').value;
                    const toDate = container.querySelector('#add-l-to').value;
                    const reason = container.querySelector('#add-l-reason').value;

                    if (hId && docId && fromDate && toDate) {
                        const newLeave = {
                            id: 'LV-' + Math.floor(1000 + Math.random() * 9000),
                            hospitalId: hId,
                            doctorId: docId,
                            department: dept,
                            fromDate: fromDate,
                            toDate: toDate,
                            reason: reason,
                            dateAdded: new Date().toISOString()
                        };
                        state.leaves.unshift(newLeave);
                        window.store.notify('state_changed', state);
                        addModal.style.display = 'none';
                    } else {
                        alert("Please fill all required fields.");
                    }
                };
            }

            const deleteBtns = container.querySelectorAll('.btn-delete-leave');
            deleteBtns.forEach(btn => {
                btn.onclick = (e) => {
                    if (confirm("Are you sure you want to cancel this leave?")) {
                        const id = e.currentTarget.dataset.id;
                        state.leaves = state.leaves.filter(l => l.id !== id);
                        window.store.notify('state_changed', state);
                    }
                };
            });

        }, 0);
    }

    window.store.subscribe('state_changed', render);
    render();
    
    return container;
};
