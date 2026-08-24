window.renderLogin = function() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.minHeight = '100vh';
    container.style.width = '100%';
    container.style.background = 'var(--bg-body)';
    
    function render() {
        container.innerHTML = `
            <div class="card" style="width: 100%; max-width: 400px; padding: 40px; background: var(--bg-surface); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 16px; border: 1px solid var(--border-color);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, var(--primary) 0%, #2e2694 100%); color: white; font-size: 32px; margin-bottom: 16px;">
                        <i class="ph ph-heartbeat"></i>
                    </div>
                    <h2 style="color: var(--text-primary); margin-bottom: 8px;">Welcome Back</h2>
                    <p style="color: var(--text-secondary); font-size: 14px;">Sign in to your dashboard</p>
                </div>
                
                <form id="login-form">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">Email Address</label>
                        <input type="email" id="login-email" required placeholder="e.g. admin@h1.com" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">Password</label>
                        <input type="password" id="login-password" required placeholder="••••••••" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-body); color: var(--text-primary);">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 16px; justify-content: center;">Sign In</button>
                </form>
                
                <div id="login-error" style="display: none; margin-top: 16px; padding: 12px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 14px; text-align: center;">
                </div>
            </div>
        `;

        setTimeout(() => {
            const form = container.querySelector('#login-form');
            const errorBox = container.querySelector('#login-error');
            const emailInput = container.querySelector('#login-email');
            
            // Check URL for pre-fill
            const pathName = window.location.pathname;
            if (pathName.length > 1) {
                const slug = pathName.split('/')[1]; // e.g. /salem-city-hospital
                if (slug && slug !== 'login') {
                    // Try to find hospital by slug
                    const state = window.store.state;
                    const matchedHospital = state.hospitals.find(h => {
                        const hSlug = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        return hSlug === slug;
                    });
                    if (matchedHospital) {
                        emailInput.value = `admin@${matchedHospital.id}.com`;
                    }
                }
            }
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = container.querySelector('#login-email').value.trim();
                const pass = container.querySelector('#login-password').value;
                
                errorBox.style.display = 'none';
                
                if ((email === 'superadmin@system.com' || email === 'admin@salemhealth.com') && (pass === 'password' || pass === 'admin123')) {
                    window.store.loginAsSuperAdmin();
                } else if (email === 'hospital@salemhealth.com' && (pass === 'password' || pass === 'temp123')) {
                    const firstHospital = (window.store.state.hospitals && window.store.state.hospitals[0]) || { id: '1' };
                    window.store.loginAsHospital(firstHospital.id);
                } else if (email.startsWith('admin@') && email.endsWith('.com')) {
                    // Extract hospital ID (e.g. admin@h1.com -> h1 or admin@1.com -> 1)
                    const hId = email.split('@')[1].replace('.com', '');
                    const hospital = window.store.state.hospitals.find(h => String(h.id) === hId || String(h.id) === hId.replace('h', '') || `h${h.id}` === hId);
                    
                    if (hospital && (pass === 'temp123' || pass === 'password')) {
                        window.store.loginAsHospital(hospital.id);
                    } else {
                        errorBox.textContent = 'Invalid hospital credentials. (Use password "temp123" or "password")';
                        errorBox.style.display = 'block';
                    }
                } else {
                    errorBox.textContent = 'Invalid email or password.';
                    errorBox.style.display = 'block';
                }
            });
        }, 0);
    }
    
    render();
    return container;
};
