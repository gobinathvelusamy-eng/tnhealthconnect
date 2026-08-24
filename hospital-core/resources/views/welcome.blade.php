<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TN Health Connect | Enterprise Dashboard</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Icons (Phosphor Icons) -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    
    <link rel="stylesheet" href="/css/styles.css?v=3">
    <link rel="stylesheet" href="/css/styles-v2.css?v=3">
    <link rel="stylesheet" href="/css/whatsapp.css?v=1">
    
    <!-- Security & Scripts -->
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" type="text/javascript"></script>
    <script src="/js/store.js?v=10" defer></script>
    <script src="/js/views/placeholders.js?v=10" defer></script>
    <script src="/js/views/super-admin.js?v=10" defer></script>
    <script src="/js/views/hospital.js?v=10" defer></script>
    <script src="/js/views/leaves.js?v=10" defer></script>
    <script src="/js/views/reception.js?v=10" defer></script>
    <script src="/js/views/doctor.js?v=10" defer></script>
    <script src="/js/views/login.js?v=10" defer></script>
    <script src="/js/views/payments.js?v=1" defer></script>
    <script src="/js/views/backups.js?v=1" defer></script>
    <script src="/js/whatsapp-simulator.js?v=2" defer></script>
    <script src="/js/app.js?v=10" defer></script>
</head>
<body>
    <div class="app-container">
        
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="ph-fill ph-heartbeat"></i>
                    <span>TN Health Connect</span>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <div class="nav-group">
                    <div class="nav-group-title">Platform</div>
                    <a href="#" class="nav-item active" data-view="super-admin">
                        <i class="ph ph-shield-star"></i>
                        <span>Super Admin</span>
                    </a>
                </div>
                
                <div class="nav-group">
                    <div class="nav-group-title" id="secondary-nav-title">System Modules</div>
                    <a href="#" class="nav-item" data-view="reception" data-feature="Reception">
                        <i class="ph ph-users"></i>
                        <span>Reception</span>
                    </a>
                    <a href="#" class="nav-item" data-view="doctor" data-feature="Doctors">
                        <i class="ph ph-stethoscope"></i>
                        <span>Doctor</span>
                    </a>
                    <a href="#" class="nav-item" data-view="patients" data-feature="Dashboard">
                        <i class="ph ph-identification-card"></i>
                        <span>Patients</span>
                    </a>
                    <a href="#" class="nav-item" data-view="analytics" data-feature="Dashboard">
                        <i class="ph ph-chart-line-up"></i>
                        <span>Analytics & Reports</span>
                    </a>
                    <a href="#" class="nav-item" data-view="staff" data-feature="Dashboard">
                        <i class="ph ph-user-list"></i>
                        <span>Doctor Management</span>
                    </a>
                    <a href="#" class="nav-item" data-view="billing" data-feature="Dashboard">
                        <i class="ph ph-receipt"></i>
                        <span>Billing & Invoices</span>
                    </a>
                    <a href="#" class="nav-item" data-view="refunds" data-feature="Dashboard">
                        <i class="ph ph-currency-inr"></i>
                        <span>Refund Requests</span>
                    </a>
                    <a href="#" class="nav-item" data-view="leaves" data-feature="Dashboard">
                        <i class="ph ph-calendar-x"></i>
                        <span>Leave Management</span>
                    </a>
                    <a href="#" class="nav-item" data-view="payments" data-feature="Dashboard">
                        <i class="ph ph-currency-inr"></i>
                        <span>Payments</span>
                    </a>
                    <a href="#" class="nav-item" data-view="backups" data-feature="Dashboard">
                        <i class="ph ph-database"></i>
                        <span>Backups</span>
                    </a>
                    <a href="#" class="nav-item" data-view="settings" data-feature="Dashboard">
                        <i class="ph ph-gear"></i>
                        <span>Settings</span>
                    </a>
                </div>

                <div class="nav-group">
                    <div class="nav-group-title">WhatsApp Integrations</div>
                    <a href="{{ route('bot-builder.index') }}" class="nav-link-external">
                        <i class="ph ph-robot"></i>
                        <span>Bot Builder</span>
                    </a>
                    <a href="{{ route('live-chat.index') }}" class="nav-link-external">
                        <i class="ph ph-chat-circle-dots"></i>
                        <span>Live Chat</span>
                    </a>
                    <a href="{{ route('settings.whatsapp') }}" class="nav-link-external">
                        <i class="ph ph-whatsapp-logo"></i>
                        <span>WhatsApp Config</span>
                    </a>
                </div>
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="avatar">SA</div>
                    <div class="user-info">
                        <span class="user-name">System Admin</span>
                        <span class="user-role">Super Admin</span>
                    </div>
                </div>
                <button id="btn-return-superadmin" class="btn btn-outline" style="width: 100%; margin-top: 12px; display: none; padding: 6px; font-size: 12px;">
                    <i class="ph ph-arrow-left"></i> Return to Super Admin
                </button>
            </div>
        </aside>

        <!-- Templates for dynamic views -->
        <div id="templates" style="display: none;"></div>
        
        <!-- Main Dashboard Content -->
        <main class="main-content" id="main-content">
            <!-- Dynamic view content gets injected here -->
        </main>
        
        <!-- Top Bar Notification -->
        <div class="top-bar">
            
            <!-- User Profile Dropdown -->
        </div>

    </div>
</body>
</html>
