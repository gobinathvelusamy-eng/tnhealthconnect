window.renderBackups = function() {
    const container = document.createElement('div');

    function render() {
        container.innerHTML = `
            <div class="dashboard-header flex-between">
                <div>
                    <h1 class="dashboard-title">Database Backups</h1>
                    <p class="dashboard-subtitle">Manage and download automated daily database backups.</p>
                </div>
                <button class="btn btn-primary" id="btn-trigger-backup">
                    <i class="ph ph-database"></i> Run Backup Now
                </button>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="table-responsive">
                    <table class="table" id="backups-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Size</th>
                                <th>Created At</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="backups-list">
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">
                                    <i class="ph ph-spinner ph-spin" style="font-size: 24px; margin-bottom: 8px; display: inline-block;"></i>
                                    <br>Loading backups...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        attachEvents();
    }

    async function loadBackups() {
        const tbody = container.querySelector('#backups-list');
        try {
            const res = await fetch('/api/backups');
            const data = await res.json();
            
            if (data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">
                            <i class="ph ph-database" style="font-size: 24px; margin-bottom: 8px; display: inline-block;"></i>
                            <br>No backups found.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = data.map(backup => `
                <tr>
                    <td><strong>${backup.file_name}</strong></td>
                    <td>${backup.file_size}</td>
                    <td>${backup.created_at}</td>
                    <td style="text-align: right;">
                        <a href="/api/backups/download/${backup.file_name}" target="_blank" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">
                            <i class="ph ph-download-simple"></i> Download
                        </a>
                    </td>
                </tr>
            `).join('');
            
        } catch (e) {
            console.error('Failed to load backups:', e);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 24px; color: var(--danger);">
                        Failed to load backups.
                    </td>
                </tr>
            `;
        }
    }

    function attachEvents() {
        loadBackups();

        const btnTrigger = container.querySelector('#btn-trigger-backup');
        if (btnTrigger) {
            btnTrigger.addEventListener('click', async () => {
                btnTrigger.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Running...';
                btnTrigger.disabled = true;

                try {
                    const res = await fetch('/api/backups', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (res.ok) {
                        btnTrigger.innerHTML = '<i class="ph ph-check"></i> Backup Created';
                        btnTrigger.classList.add('btn-success');
                        setTimeout(() => {
                            btnTrigger.innerHTML = '<i class="ph ph-database"></i> Run Backup Now';
                            btnTrigger.classList.remove('btn-success');
                            btnTrigger.disabled = false;
                            loadBackups();
                        }, 2000);
                    } else {
                        throw new Error('Failed');
                    }
                } catch (e) {
                    btnTrigger.innerHTML = '<i class="ph ph-warning"></i> Error';
                    btnTrigger.classList.add('btn-danger');
                    setTimeout(() => {
                        btnTrigger.innerHTML = '<i class="ph ph-database"></i> Run Backup Now';
                        btnTrigger.classList.remove('btn-danger');
                        btnTrigger.disabled = false;
                    }, 2000);
                }
            });
        }
    }

    render();
    return container;
};
