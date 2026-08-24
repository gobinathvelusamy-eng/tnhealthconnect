/**
 * Main App Controller - V2
 * Handles routing and view rendering, including feature locks
 */

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const mainContent = document.getElementById('main-content');
    
    // View Registry
    const views = {
        'super-admin': window.renderSuperAdmin,
        'hospital': window.renderHospital,
        'reception': window.renderReception,
        'doctor': window.renderDoctor,
        'patients': window.renderPatients || (() => document.createElement('div')),
        'analytics': window.renderAnalytics || (() => document.createElement('div')),
        'staff': window.renderStaff || (() => document.createElement('div')),
        'billing': window.renderBilling || (() => document.createElement('div')),
        'refunds': window.renderRefunds || (() => document.createElement('div')),
        'leaves': window.renderLeaves || (() => document.createElement('div')),
        'payments': window.renderPayments || (() => document.createElement('div')),
        'backups': window.renderBackups || (() => document.createElement('div')),
        'settings': window.renderSettings || (() => document.createElement('div')),
        'login': window.renderLogin || (() => document.createElement('div'))
    };

    function loadView(viewName, isLocked = false) {
        if (window.activeQrScanner) {
            try { window.activeQrScanner.clear(); } catch(e){}
            window.activeQrScanner = null;
        }

        // Update active nav
        navItems.forEach(item => {
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Clear main content
        mainContent.innerHTML = '';
        mainContent.style.opacity = '0';
        
        setTimeout(() => {
            try {
                if (isLocked) {
                    mainContent.innerHTML = `
                        <div class="access-denied">
                            <i class="ph ph-lock-key"></i>
                            <h2 style="margin-bottom: 12px; color: var(--text-primary);">Module Locked</h2>
                            <p>This module has not been enabled for your hospital by the Super Admin.</p>
                        </div>
                    `;
                } else if (views[viewName]) {
                    mainContent.appendChild(views[viewName]());
                } else {
                    mainContent.innerHTML = `
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">View Not Found</h1>
                            <p class="dashboard-subtitle">The requested module is not available.</p>
                        </div>
                    `;
                }
            } catch (e) {
                console.error(e);
                mainContent.innerHTML = '<div style="padding: 24px; color: red;"><h3>JS Error in View: ' + viewName + '</h3><pre>' + e.stack + '</pre></div>';
            }
            
            mainContent.style.opacity = '1';
            mainContent.style.transition = 'opacity 0.3s ease';
        }, 100);
    }

    // Attach click listeners to nav
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = e.currentTarget.dataset.view;
            if (viewName) {
                loadView(viewName, e.currentTarget.classList.contains('locked'));
            }
        });
    });

    // Handle Feature Locking UI Update
    function updateNavigationLocks() {
        // We simulate the context of 'h1' (ABC Hospital) for the hospital portal views
        const currentHospital = null;
        
        navItems.forEach(item => {
            const featureReq = item.dataset.feature;
            if (featureReq && currentHospital) {
                const lockIcon = item.querySelector('.ph-lock');
                if (currentHospital.features[featureReq] === false) {
                    item.classList.add('locked');
                    if (lockIcon) lockIcon.style.display = 'block';
                } else {
                    item.classList.remove('locked');
                    if (lockIcon) lockIcon.style.display = 'none';
                }
            }
        });
        
        // If current active view became locked, maybe redirect, but for demo it's okay to let them click it to see the lock screen
    }

    // Handle Notifications
    const notifBell = document.getElementById('notification-bell');
    const notifBadge = document.getElementById('notification-badge');
    
    window.store.subscribe('notification_added', (msg) => {
        if (notifBadge) notifBadge.classList.add('active');
        // Simple visual pulse
        if (notifBell) {
            notifBell.style.transform = 'scale(1.1)';
            setTimeout(() => notifBell.style.transform = 'scale(1)', 200);
        }
    });
    
    if (notifBell) {
        notifBell.addEventListener('click', () => {
            if (notifBadge) notifBadge.classList.remove('active');
            // In a full app, this would open a dropdown. For now, it just clears the badge.
        });
    }

    // Subscribe to feature changes to update navigation
    window.store.subscribe('feature_toggled', (data) => {
        if (data.hospitalId === 'h1') {
            updateNavigationLocks();
        }
    });

    window.store.subscribe('role_changed', (data) => {
        const saGroup = document.querySelector('.nav-group:nth-child(1)');
        const hospGroup = document.querySelector('.nav-group:nth-child(2)');
        const btnReturn = document.getElementById('btn-return-superadmin');
        const sidebar = document.querySelector('.sidebar');
        const mainContentEl = document.getElementById('main-content');
        
        if(!data.role) {
            if(sidebar) sidebar.style.display = 'none';
            if(mainContentEl) {
                mainContentEl.style.marginLeft = '';
                mainContentEl.style.padding = '0';
            }
            loadView('login');
            return;
        } else {
            if(sidebar) sidebar.style.display = 'flex';
            if(mainContentEl) {
                mainContentEl.style.marginLeft = '';
                mainContentEl.style.padding = '32px';
            }
        }
        
        if(data.role === 'hospital_admin') {
            if(saGroup) saGroup.style.display = 'none';
            if(hospGroup) {
                hospGroup.style.display = 'block';
                const title = hospGroup.querySelector('.nav-group-title');
                const hosp = window.store.state.hospitals.find(h => h.id === data.hospitalId);
                if(title && hosp) title.innerHTML = `Hospital Portal <span style="font-size: 10px; color: var(--text-secondary); margin-left: 4px;">(${hosp.name})</span>`;
                
                // Hide specific menus for hospital admin
                navItems.forEach(item => {
                    const view = item.dataset.view;
                    if(['reception', 'doctor', 'patients', 'analytics', 'staff', 'billing'].includes(view)) {
                        item.style.display = 'flex';
                    } else if (item.closest('.nav-group') === hospGroup) {
                        item.style.display = 'none';
                    }
                });
            }
            if(btnReturn) {
                btnReturn.style.display = 'block';
                btnReturn.innerHTML = '<i class="ph ph-sign-out"></i> Logout';
            }
            loadView('reception');
        } else {
            if(saGroup) saGroup.style.display = 'block';
            if(hospGroup) {
                hospGroup.style.display = 'block';
                const title = hospGroup.querySelector('.nav-group-title');
                if(title) title.innerHTML = 'System Modules';
                navItems.forEach(item => {
                    item.style.display = 'flex';
                });
            }
            if(btnReturn) {
                btnReturn.style.display = 'block';
                btnReturn.innerHTML = '<i class="ph ph-sign-out"></i> Logout';
            }
            loadView('super-admin');
        }
    });

    const btnReturn = document.getElementById('btn-return-superadmin');
    if(btnReturn) {
        btnReturn.addEventListener('click', () => {
            window.store.logout();
        });
    }

    // Initial setup
    updateNavigationLocks();

    // Load initial view based on saved role
    setTimeout(() => {
        const isLoginUrl = window.location.pathname.endsWith('/login');
        
        if (isLoginUrl) {
            window.store.logout();
        } else if (window.store.activeRole === 'hospital_admin') {
            window.store.notify('role_changed', { role: 'hospital_admin', hospitalId: window.store.activeHospitalId });
        } else if (window.store.activeRole === 'super_admin') {
            window.store.notify('role_changed', { role: 'super_admin' });
        } else {
            window.store.notify('role_changed', { role: null });
        }
    }, 200);

    // Initialise WhatsApp Simulator
    if (window.initWhatsApp) {
        window.initWhatsApp();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Listen for Settings Load
    window.store.subscribe('settings_loaded', (settings) => {
        setTimeout(() => {
            const tokenInput = document.getElementById('wa-access-token');
            const phoneInput = document.getElementById('wa-phone-id');
            const verifyInput = document.getElementById('wa-verify-token');
            if(tokenInput) tokenInput.value = settings.whatsapp_access_token || '';
            if(phoneInput) phoneInput.value = settings.whatsapp_phone_number_id || '';
            if(verifyInput) verifyInput.value = settings.whatsapp_webhook_verify_token || '';
        }, 1000);
    });

    // Handle Save Click via delegation because view is dynamic
    document.body.addEventListener('click', async (e) => {
        if(e.target.id === 'btn-save-integrations' || e.target.closest('#btn-save-integrations')) {
            const btn = e.target.closest('#btn-save-integrations');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
            
            const newSettings = {
                whatsapp_access_token: document.getElementById('wa-access-token').value,
                whatsapp_phone_number_id: document.getElementById('wa-phone-id').value,
                whatsapp_webhook_verify_token: document.getElementById('wa-verify-token').value
            };
            
            const success = await window.store.saveSettings(newSettings);
            
            btn.innerHTML = success ? '<i class="ph ph-check"></i> Saved Successfully!' : '<i class="ph ph-x"></i> Failed to Save';
            setTimeout(() => btn.innerHTML = originalText, 3000);
        }
    });
});
