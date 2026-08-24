# TN Health Connect - WhatsApp Automation Platform
## Master Deployment Guide

This document outlines the steps required to deploy the complete Node.js / Next.js WhatsApp automation platform.

### System Requirements
* Node.js v18.x or v20.x
* PostgreSQL (v14+)
* PM2 (Process Manager for Node.js)
* Nginx (Reverse Proxy & SSL termination)
* Domain Name with HTTPS (Required by Meta Webhooks)

---

### Step 1: Database Setup
1. Create a fresh PostgreSQL database (e.g., `tnhc_whatsapp`).
2. Do **not** use the existing Laravel MySQL database for this platform.

### Step 2: Environment Variables
Create a `.env` file in the `backend/` directory using the provided `.env.example`:

```env
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tnhc_whatsapp?schema=public"

# TN Health Connect (Laravel API Integration)
TNHC_API_BASE_URL="https://mediumseagreen-gnu-652009.hostingersite.com/api"
TNHC_API_KEY="your_secure_api_key_here"

# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN="your_permanent_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
WHATSAPP_WABA_ID="your_business_account_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="tnhc_secure_verify_token"

# Razorpay Integration
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

### Step 3: Backend Deployment
1. Navigate to the backend directory:
   `cd backend`
2. Install production dependencies:
   `npm ci`
3. Run Prisma Migrations to generate the tables:
   `npx prisma migrate deploy`
4. Generate the Prisma Client:
   `npx prisma generate`
5. Compile TypeScript to JavaScript:
   `npx tsc`
6. Start the backend using PM2:
   `pm2 start dist/index.js --name tnhc-whatsapp-api`

### Step 4: Frontend Deployment
1. Navigate to the frontend directory:
   `cd frontend`
2. Install production dependencies:
   `npm ci`
3. Build the Next.js application:
   `npm run build`
4. Start the frontend using PM2:
   `pm2 start npm --name tnhc-whatsapp-dashboard -- start`

### Step 5: Nginx Configuration
Configure Nginx to route traffic to both the frontend (Dashboard) and the backend (API & Webhooks). 
Ensure you secure the domain with an SSL certificate (e.g., Let's Encrypt), as Meta will reject HTTP webhooks.

```nginx
server {
    listen 443 ssl;
    server_name whatsapp.tnhealthconnect.com;
    
    # SSL config...

    # Route frontend Dashboard
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Route backend APIs and Webhooks
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: Meta Webhook Registration
1. Go to your Meta Developer App.
2. Navigate to WhatsApp -> Configuration.
3. Click **Edit Webhook**.
4. Callback URL: `https://whatsapp.tnhealthconnect.com/api/webhook/whatsapp`
5. Verify Token: `tnhc_secure_verify_token` (Must match `.env`).
6. Subscribe to `messages` and `message_template_status_update`.

### Step 7: Final End-to-End Test
Send the word "Hi" to your official WhatsApp Business Number. The Flow Engine will automatically detect the missing session and spawn the Default Appointment Flow.
