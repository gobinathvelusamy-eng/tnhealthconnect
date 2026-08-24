window.renderPayments = function() {
    const container = document.createElement('div');

    function render() {
        container.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Global Payment Settings</h1>
                    <p class="dashboard-subtitle">Configure default fallback fees for all hospitals</p>
                </div>
            </div>

            <div class="card" style="max-width: 600px; margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">Fee Configuration</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
                    These global settings apply to all hospitals. If a specific department has a custom consultation fee set, that custom fee will override the global default consultation fee. The platform fee is applied globally to all transactions.
                </p>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Default Consultation Fee (₹)</label>
                        <input type="number" id="global-consultation-fee" class="form-control" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);" placeholder="e.g. 500" min="0">
                        <small style="color: var(--text-secondary); display: block; margin-top: 4px;">Used if a hospital department doesn't have a specific fee.</small>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Global Platform Fee (₹)</label>
                        <input type="number" id="global-platform-fee" class="form-control" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);" placeholder="e.g. 25" min="0">
                        <small style="color: var(--text-secondary); display: block; margin-top: 4px;">Fixed fee added to every booking.</small>
                    </div>

                    <button class="btn btn-primary" id="btn-save-payment-settings" style="margin-top: 8px; width: fit-content;">
                        <i class="ph ph-floppy-disk"></i> Save Settings
                    </button>
                </div>
            </div>
        `;
        
        attachEvents();
    }

    async function attachEvents() {
        // Fetch current settings
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                
                const getSetting = (key, defaultVal) => {
                    const item = settings.find(s => s.setting_key === key);
                    return item ? item.setting_value : defaultVal;
                };

                const consFeeEl = container.querySelector('#global-consultation-fee');
                const platFeeEl = container.querySelector('#global-platform-fee');
                
                if(consFeeEl) consFeeEl.value = getSetting('default_consultation_fee', '500');
                if(platFeeEl) platFeeEl.value = getSetting('default_platform_fee', '25');
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }

        // Save settings
        const saveBtn = container.querySelector('#btn-save-payment-settings');
        if(saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                btn.disabled = true;

                const cFee = container.querySelector('#global-consultation-fee').value || 500;
                const pFee = container.querySelector('#global-platform-fee').value || 25;

                try {
                    const res = await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            default_consultation_fee: cFee,
                            default_platform_fee: pFee
                        })
                    });

                    if (res.ok) {
                        btn.innerHTML = '<i class="ph ph-check"></i> Saved!';
                        btn.classList.add('btn-success');
                        setTimeout(() => {
                            btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Settings';
                            btn.classList.remove('btn-success');
                            btn.disabled = false;
                        }, 2000);
                    } else {
                        throw new Error('Save failed');
                    }
                } catch (err) {
                    console.error(err);
                    btn.innerHTML = '<i class="ph ph-warning"></i> Error';
                    btn.classList.add('btn-danger');
                    setTimeout(() => {
                        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Settings';
                        btn.classList.remove('btn-danger');
                        btn.disabled = false;
                    }, 2000);
                }
            });
        }
    }

    render();
    return container;
};
