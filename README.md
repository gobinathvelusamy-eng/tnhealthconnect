# TN Health Connect — WhatsApp Automation Platform

This is the standalone Node.js & Next.js platform that manages the WhatsApp Flow Builder, Meta Cloud API Webhooks, and Payments, acting as the intelligent middleware layer for the legacy Laravel backend.

## Project Structure
- `backend/`: Node.js, Express, TypeScript, Prisma (PostgreSQL)
- `frontend/`: Next.js 14, React Flow, TailwindCSS, Zustand

## System Architecture Highlights
1. **Isolated Data:** The Postgres database here *only* stores WhatsApp configurations, Templates, and Flow definitions. It does NOT store Hospitals or Patients (that remains securely in Laravel).
2. **TNHCService Abstraction:** The Flow Engine doesn't know about Laravel databases. It strictly communicates via HTTP to the existing `https://mediumseagreen-gnu-652009.hostingersite.com/api` Laravel routes.
3. **Component Library:** Drag-and-drop React Flow nodes (`tnhc_hospital`, `tnhc_doctor`) are securely mapped to automated server-side executors.
4. **Resilient Flow Engine:** Pauses execution state when awaiting user input or waiting for an asynchronous payment webhook, ensuring zero data loss during the patient journey.

## Setup Instructions
Please refer to `DEPLOYMENT.md` for comprehensive production server deployment instructions (Nginx, PM2, Postgres).
