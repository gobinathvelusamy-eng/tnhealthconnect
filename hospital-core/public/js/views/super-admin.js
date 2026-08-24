/**
 * Super Admin View - V2
 */

window.renderSuperAdmin = function() {
    const container = document.createElement('div');
    
    function render() {
        const state = window.store.state;
        
        let totalCustomerPayments = 0;
        let totalConsultationRev = 0;
        let totalPlatformFees = 0;

        state.appointments.forEach(a => {
            totalCustomerPayments += a.financials.totalPaid;
            totalConsultationRev += a.financials.consultationFee;
            totalPlatformFees += a.financials.platformFee;
        });
        
        container.innerHTML = `
            <div class="dashboard-header flex-between">
                <div>
                    <h1 class="dashboard-title">Super Admin Control</h1>
                    <p class="dashboard-subtitle">Platform overview and hospital management</p>
                </div>
                <button class="btn btn-primary" id="btn-add-hospital"><i class="ph ph-plus"></i> Add Hospital</button>
            </div>
            
            <div class="stats-grid">
                <div class="card stat-card" style="border-top: 4px solid var(--primary);">
                    <div class="stat-header">
                        <div class="stat-icon primary"><i class="ph-fill ph-users"></i></div>
                    </div>
                    <div class="stat-value">${state.appointments.length}</div>
                    <div class="stat-label">Total Appointments</div>
                </div>
                <div class="card stat-card" style="border-top: 4px solid #3b82f6;">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#dbeafe; color:#3b82f6;"><i class="ph-fill ph-wallet"></i></div>
                    </div>
                    <div class="stat-value">₹${totalCustomerPayments.toLocaleString()}</div>
                    <div class="stat-label">Total Customer Payments</div>
                </div>
                <div class="card stat-card" style="border-top: 4px solid var(--success);">
                    <div class="stat-header">
                        <div class="stat-icon success"><i class="ph-fill ph-money"></i></div>
                    </div>
                    <div class="stat-value">₹${totalConsultationRev.toLocaleString()}</div>
                    <div class="stat-label">Hospital Consultation Revenue</div>
                </div>
                <div class="card stat-card" style="border-top: 4px solid var(--warning);">
                    <div class="stat-header">
                        <div class="stat-icon warning"><i class="ph-fill ph-coin"></i></div>
                    </div>
                    <div class="stat-value">₹${totalPlatformFees.toLocaleString()}</div>
                    <div class="stat-label">Platform Service Fees</div>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Module Management -->
                <div class="glass-panel" style="padding: 24px;">
                    <div class="flex-between" style="margin-bottom: 16px;">
                        <h3 style="margin: 0;">Hospital Module Management</h3>
                        <div style="position: relative;">
                            <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                            <input type="text" id="hospital-search-input" placeholder="Search by name, district, or place..." style="padding-left: 36px; width: 300px; border: 1px solid var(--border-color); border-radius: 8px; padding-top: 8px; padding-bottom: 8px;">
                        </div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Hospital Name</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="hospital-table-body">
                                ${state.hospitals.map(h => `
                                    <tr class="hospital-row" data-name="${(h.name || '').toLowerCase()}" data-district="${(h.district || '').toLowerCase()}" data-place="${(h.place || '').toLowerCase()}">
                                        <td style="font-weight: 500;">${h.name}</td>
                                        <td>
                                            <div style="font-size: 14px;">${h.district || 'N/A'}</div>
                                            <div style="font-size: 12px; color: var(--text-secondary);">${h.place || ''}</div>
                                        </td>
                                        <td>
                                            <span class="badge badge-${h.status === 'Enabled' ? 'success' : 'danger'}">${h.status}</span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline btn-toggle-status" data-id="${h.id}" style="padding: 4px 8px; color: ${h.status === 'Enabled' ? 'var(--danger)' : 'var(--success)'}; border-color: ${h.status === 'Enabled' ? 'var(--danger)' : 'var(--success)'};">${h.status === 'Enabled' ? 'Disable' : 'Enable'}</button>
                                            <button class="btn btn-sm btn-outline btn-edit-hospital" data-id="${h.id}" data-name="${h.name}" style="padding: 4px 8px; margin-left: 8px;"><i class="ph ph-pencil"></i> Edit</button>
                                            <button class="btn btn-sm btn-primary btn-copy-login" data-id="${h.id}" data-name="${h.name}" style="padding: 4px 8px; margin-left: 8px;"><i class="ph ph-link"></i> Get Login Link</button>
                                            <button class="btn btn-sm btn-danger btn-delete-hospital" data-id="${h.id}" data-name="${h.name}" style="padding: 4px 8px; margin-left: 8px; border-color: var(--danger); color: var(--danger); background: transparent;"><i class="ph ph-trash"></i> Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Live Hospital Monitor -->
                <div class="card">
                    <h3 style="margin-bottom: 16px;">Live Hospital Monitor</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${state.hospitals.map(h => {
                            const hApts = state.appointments.filter(a => a.hospitalId === h.id);
                            const checkedIn = hApts.filter(a => a.status === 'Checked In').length;
                            const waiting = hApts.filter(a => a.status === 'Booked').length;
                            const hRev = hApts.reduce((sum, a) => sum + a.financials.consultationFee, 0);
                            return `
                                <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
                                    <div class="flex-between" style="margin-bottom: 8px;">
                                        <span style="font-weight: 600;">${h.name}</span>
                                        <span class="badge badge-success" style="font-size: 10px;">Online</span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: var(--text-secondary);">
                                        <div>Appointments: ${hApts.length}</div>
                                        <div>Collection: ₹${hRev.toLocaleString()}</div>
                                        <div>Checked In: ${checkedIn}</div>
                                        <div>Waiting: ${waiting}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Detailed Payment Report -->
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <div class="flex-between" style="margin-bottom: 16px;">
                    <h3>Detailed Payment Report</h3>
                    <select style="width: auto;"><option>Today</option><option>This Week</option></select>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Hospital</th>
                                <th>Patient</th>
                                <th>Consultation Fee</th>
                                <th>Platform Fee</th>
                                <th>Total Payment</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.appointments.map(a => `
                                <tr>
                                    <td style="font-family: monospace;">${a.id}</td>
                                    <td>${state.hospitals.find(h=>h.id===a.hospitalId)?.name}</td>
                                    <td>${a.patientName}</td>
                                    <td style="color: var(--success); font-weight: 500;">₹${a.financials.consultationFee}</td>
                                    <td style="color: var(--warning); font-weight: 500;">₹${a.financials.platformFee}</td>
                                    <td style="font-weight: 600;">₹${a.financials.totalPaid}</td>
                                    <td>${a.paymentMethod}</td>
                                    <td><span class="badge badge-success">${a.paymentStatus}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">System Audit Logs</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Time</th>
                                <th>Patient</th>
                                <th>Action / Status Update</th>
                                <th>Performed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const allLogs = [];
                                state.appointments.forEach(a => {
                                    if(a.auditTimeline) {
                                        a.auditTimeline.forEach(log => {
                                            allLogs.push({
                                                bookingId: a.id,
                                                patient: a.patientName,
                                                time: log.time,
                                                action: log.action || log.status || 'Updated',
                                                user: log.user || 'System'
                                            });
                                        });
                                    }
                                });
                                return allLogs.reverse().map(log => `
                                    <tr>
                                        <td style="font-family: monospace;">${log.bookingId}</td>
                                        <td>${log.time}</td>
                                        <td>${log.patient}</td>
                                        <td><span class="badge" style="background:#e2e8f0; color:#475569;">${log.action}</span></td>
                                        <td>${log.user}</td>
                                    </tr>
                                `).join('');
                            })()}
                            ${state.appointments.every(a => !a.auditTimeline || a.auditTimeline.length === 0) ? '<tr><td colspan="5" style="text-align:center;">No logs available.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Hospital Modal -->
            <div id="add-hospital-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
                <div class="card" style="width: 500px; max-height: 85vh; overflow-y: auto; background: var(--bg-surface);">
                    <h3 style="margin-bottom: 16px;">Add New Hospital</h3>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Hospital Name</label>
                        <input type="text" id="add-h-name" style="width: 100%;" placeholder="e.g. Apollo Hospitals">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">District</label>
                        <select id="add-h-district" style="width: 100%;">
                            ${state.districts.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Place (City/Town/Area)</label>
                        <input type="text" id="add-h-place" style="width: 100%;" placeholder="e.g. Anna Nagar">
                    </div>

                    <!-- Dynamic Departments & Doctors Section -->
                    <div style="margin-bottom: 24px; border: 1px solid var(--border-color); padding: 16px; border-radius: 10px; background: var(--bg-main);">
                        <div class="flex-between" style="margin-bottom: 12px;">
                            <label style="font-weight: bold; margin: 0; color: var(--text-primary);">Departments, Doctors & Timings</label>
                            <button class="btn btn-sm btn-outline" id="btn-add-dept-row" style="padding: 4px 10px;"><i class="ph ph-plus"></i> Add Doctor</button>
                        </div>
                        <div id="add-h-dept-container" style="display: flex; flex-direction: column; gap: 12px;">
                            <div class="dept-row" style="display: flex; flex-direction: column; gap: 8px; border: 1px dashed var(--border-color); padding: 12px; border-radius: 8px; background: var(--bg-surface);">
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" placeholder="Dept (e.g. Cardiology)" class="dept-name" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" value="Cardiology">
                                    <input type="text" placeholder="Doctor Name" class="dept-doctor" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" value="Dr. Ramesh">
                                    <input type="number" placeholder="Fee (₹)" class="dept-fee" style="width: 100px; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" min="0" value="500">
                                    <button class="btn btn-sm btn-danger btn-remove-dept" style="padding: 6px 10px; border-radius: 6px;"><i class="ph ph-trash"></i></button>
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--text-secondary);">
                                    <span>⏰ Available Hours:</span>
                                    <input type="text" placeholder="Start Time (e.g. 09:00 AM)" class="dept-start-time" style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);" value="09:00 AM">
                                    <span>to</span>
                                    <input type="text" placeholder="End Time (e.g. 05:00 PM)" class="dept-end-time" style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);" value="05:00 PM">
                                </div>
                                <span style="font-size: 11px; color: var(--primary);">⚡ Auto-generates 4 slots per hour (15-min intervals)</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex-between">
                        <button class="btn btn-outline" id="btn-cancel-add">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-hospital">Save Hospital & Doctors</button>
                    </div>
                </div>
            </div>

            <!-- Get Login Link Modal -->
            <div id="login-link-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div class="card" style="width: 450px; background: var(--bg-surface); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: rgba(79, 70, 229, 0.1); color: var(--primary); font-size: 28px; margin-bottom: 16px;">
                            <i class="ph ph-link"></i>
                        </div>
                        <h3 id="login-modal-title" style="margin-bottom: 8px; color: var(--text-primary);">Hospital Credentials</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">Share these credentials with the hospital administrator securely.</p>
                    </div>
                    
                    <div style="background: var(--bg-body); border-radius: 8px; padding: 16px; border: 1px solid var(--border-color); margin-bottom: 24px;">
                        <div style="display: flex; flex-direction: column; gap: 12px; font-family: monospace; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-secondary);">URL:</span>
                                <span style="color: var(--text-primary);"></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-secondary);">ID:</span>
                                <span id="login-modal-id" style="color: var(--text-primary); font-weight: bold;"></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-secondary);">Password:</span>
                                <span style="color: var(--text-primary); font-weight: bold;">temp123</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <button class="btn btn-outline" id="btn-close-login-modal" style="flex: 1; justify-content: center;">Close</button>
                        <button class="btn btn-primary" id="btn-copy-login-link" style="flex: 1; justify-content: center;"><i class="ph ph-copy"></i> Copy Credentials</button>
                    </div>
                    
                    <div style="text-align: center;">
                        <button id="btn-magic-login" style="background: none; border: none; color: var(--text-secondary); font-size: 12px; text-decoration: underline; cursor: pointer; transition: color 0.2s;">Developer: Login instantly to test</button>
                    </div>
                </div>
            </div>

            <!-- Edit Hospital Modal (Hidden by Default) -->
            <div id="edit-hospital-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
                <div class="card" style="width: 400px; background: var(--bg-surface);">
                    <h3 style="margin-bottom: 16px;">Edit Hospital</h3>
                    <input type="hidden" id="edit-h-id">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Hospital Name</label>
                        <input type="text" id="edit-h-name" style="width: 100%;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px;">Place</label>
                        <input type="text" id="edit-h-place" style="width: 100%;">
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" id="btn-cancel-edit">Cancel</button>
                        <button class="btn btn-primary" id="btn-save-edit">Save Changes</button>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        setTimeout(() => {
            // Search Functionality
            const searchInput = container.querySelector('#hospital-search-input');
            const rows = container.querySelectorAll('.hospital-row');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    rows.forEach(row => {
                        const name = row.dataset.name;
                        const dist = row.dataset.district;
                        const place = row.dataset.place;
                        if (name.includes(term) || dist.includes(term) || place.includes(term)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            }

            // Status Toggle
            document.querySelectorAll('.btn-toggle-status').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const h = state.hospitals.find(h => h.id == id);
                    if(h) {
                        const newStatus = h.status === 'Enabled' ? 'Disabled' : 'Enabled';
                        window.store.updateHospital(id, { status: newStatus });
                    }
                });
            });

            // Delete Logic
            const deleteBtns = container.querySelectorAll('.btn-delete-hospital');
            deleteBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.dataset.id;
                    const name = e.currentTarget.dataset.name;
                    if(confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) {
                        window.store.deleteHospital(id);
                        if(window.refreshWaHospitals) window.refreshWaHospitals();
                    }
                };
            });

            // Copy Login Link Modal Logic
            const copyBtns = container.querySelectorAll('.btn-copy-login');
            const loginModal = container.querySelector('#login-link-modal');
            const loginModalTitle = container.querySelector('#login-modal-title');
            const loginModalId = container.querySelector('#login-modal-id');
            const btnCloseLoginModal = container.querySelector('#btn-close-login-modal');
            const btnCopyLoginLink = container.querySelector('#btn-copy-login-link');
            const btnMagicLogin = container.querySelector('#btn-magic-login');
            
            let activeModalHospitalId = null;
            let activeModalHospitalName = null;

            copyBtns.forEach(btn => {
                btn.onclick = (e) => {
                    activeModalHospitalId = e.currentTarget.dataset.id;
                    activeModalHospitalName = e.currentTarget.dataset.name;
                    
                    const slug = activeModalHospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    
                    loginModalTitle.textContent = `${activeModalHospitalName} Credentials`;
                    loginModalId.textContent = `admin@${activeModalHospitalId}.com`;
                    
                    // Update URL display
                    const urlDisplay = container.querySelector('#login-link-modal .card div > div > div > span:nth-child(2)');
                    if(urlDisplay) {
                        urlDisplay.textContent = `${window.location.origin}/${slug}/login`;
                    }
                    
                    loginModal.style.display = 'flex';
                };
            });
            
            btnCloseLoginModal.onclick = () => {
                loginModal.style.display = 'none';
            };
            
            btnCopyLoginLink.onclick = () => {
                const slug = activeModalHospitalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const text = `Hospital Portal Login for ${activeModalHospitalName}\nURL: ${window.location.origin}/${slug}/login\nID: admin@${activeModalHospitalId}.com\nPassword: temp123`;
                navigator.clipboard.writeText(text).then(() => {
                    const origHtml = btnCopyLoginLink.innerHTML;
                    btnCopyLoginLink.innerHTML = '<i class="ph ph-check"></i> Copied!';
                    setTimeout(() => {
                        btnCopyLoginLink.innerHTML = origHtml;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy', err);
                });
            };
            
            btnMagicLogin.onclick = () => {
                if(activeModalHospitalId) {
                    window.store.loginAsHospital(activeModalHospitalId);
                }
            };

            // Edit Modal Logic
            const editBtns = container.querySelectorAll('.btn-edit-hospital');
            const editModal = container.querySelector('#edit-hospital-modal');
            const cancelEditBtn = container.querySelector('#btn-cancel-edit');
            const saveEditBtn = container.querySelector('#btn-save-edit');
            
            editBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.currentTarget.dataset.id;
                    const h = state.hospitals.find(h => h.id === id);
                    if(h) {
                        container.querySelector('#edit-h-id').value = h.id;
                        container.querySelector('#edit-h-name').value = h.name;
                        container.querySelector('#edit-h-place').value = h.place || '';
                        editModal.style.display = 'flex';
                    }
                };
            });

            cancelEditBtn.onclick = () => editModal.style.display = 'none';

            saveEditBtn.onclick = () => {
                const id = container.querySelector('#edit-h-id').value;
                const newName = container.querySelector('#edit-h-name').value;
                const newPlace = container.querySelector('#edit-h-place').value;
                if (newName) {
                    window.store.updateHospital(id, { name: newName, place: newPlace });
                    editModal.style.display = 'none';
                }
            };
            
            // Add Modal Logic
            const addBtn = container.querySelector('#btn-add-hospital');
            const addModal = container.querySelector('#add-hospital-modal');
            const cancelAddBtn = container.querySelector('#btn-cancel-add');
            const saveAddBtn = container.querySelector('#btn-save-hospital');
            const addDeptRowBtn = container.querySelector('#btn-add-dept-row');
            const deptContainer = container.querySelector('#add-h-dept-container');
            
            const createDoctorRowHtml = (dept = 'Cardiology', doctor = '', fee = '500', startTime = '09:00 AM', endTime = '05:00 PM') => `
                <div class="dept-row" style="display: flex; flex-direction: column; gap: 8px; border: 1px dashed var(--border-color); padding: 12px; border-radius: 8px; background: var(--bg-surface);">
                    <div style="display: flex; gap: 8px;">
                        <input type="text" placeholder="Dept (e.g. Cardiology)" class="dept-name" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" value="${dept}">
                        <input type="text" placeholder="Doctor Name" class="dept-doctor" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" value="${doctor}">
                        <input type="number" placeholder="Fee (₹)" class="dept-fee" style="width: 100px; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);" min="0" value="${fee}">
                        <button class="btn btn-sm btn-danger btn-remove-dept" style="padding: 6px 10px; border-radius: 6px;"><i class="ph ph-trash"></i></button>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--text-secondary);">
                        <span>⏰ Available Hours:</span>
                        <input type="text" placeholder="09:00 AM" class="dept-start-time" style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);" value="${startTime}">
                        <span>to</span>
                        <input type="text" placeholder="05:00 PM" class="dept-end-time" style="flex: 1; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);" value="${endTime}">
                    </div>
                    <span style="font-size: 11px; color: var(--primary);">⚡ Auto-generates 4 slots per hour (15-min intervals)</span>
                </div>
            `;

            if (addDeptRowBtn) {
                addDeptRowBtn.onclick = (e) => {
                    e.preventDefault();
                    const div = document.createElement('div');
                    div.innerHTML = createDoctorRowHtml('General Medicine', '', '300', '09:00 AM', '05:00 PM');
                    deptContainer.appendChild(div.firstElementChild);
                };
            }
            
            // Delegate delete row event
            if (deptContainer) {
                deptContainer.onclick = (e) => {
                    if (e.target.closest('.btn-remove-dept')) {
                        const rows = deptContainer.querySelectorAll('.dept-row');
                        if (rows.length > 1) {
                            e.target.closest('.dept-row').remove();
                        } else {
                            alert('At least one department & doctor is required.');
                        }
                    }
                };
            }

            if (addBtn) {
                addBtn.onclick = () => {
                    container.querySelector('#add-h-name').value = '';
                    deptContainer.innerHTML = createDoctorRowHtml('Cardiology', 'Dr. Rajesh Kumar', '500', '09:00 AM', '05:00 PM');
                    addModal.style.display = 'flex';
                };
            }
            
            if (cancelAddBtn) {
                cancelAddBtn.onclick = () => addModal.style.display = 'none';
            }
            
            if (saveAddBtn) {
                saveAddBtn.onclick = () => {
                    const name = container.querySelector('#add-h-name').value;
                    const district = container.querySelector('#add-h-district').value;
                    const place = container.querySelector('#add-h-place').value;
                    
                    const rows = deptContainer.querySelectorAll('.dept-row');
                    const doctors = [];
                    rows.forEach(r => {
                        const dpt = r.querySelector('.dept-name').value.trim();
                        const doc = r.querySelector('.dept-doctor').value.trim();
                        const fee = r.querySelector('.dept-fee').value.trim() || "0";
                        const startTime = r.querySelector('.dept-start-time')?.value.trim() || '09:00 AM';
                        const endTime = r.querySelector('.dept-end-time')?.value.trim() || '05:00 PM';
                        if(dpt && doc) {
                            doctors.push({ department: dpt, name: doc, fee: fee, start_time: startTime, end_time: endTime });
                        }
                    });

                    if (name) {
                        window.store.addHospital({ name, district, place, doctors });
                        addModal.style.display = 'none';
                    }
                };
            }
        }, 0);
    }

    function safeRender() {
        const addModal = container.querySelector('#add-hospital-modal');
        const editModal = container.querySelector('#edit-hospital-modal');
        const loginModal = container.querySelector('#login-link-modal');
        if ((addModal && addModal.style.display === 'flex') ||
            (editModal && editModal.style.display === 'flex') ||
            (loginModal && loginModal.style.display === 'flex')) {
            return; // Modal is open! Do not disrupt user.
        }
        render();
    }

    window.store.subscribe('state_changed', safeRender);
    window.store.subscribe('appointments_updated', safeRender);
    render();
    
    return container;
};
