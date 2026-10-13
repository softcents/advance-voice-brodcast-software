# VoiceBroadcastPro / VSMS (Next-Gen Telephony Platform)

Enterprise Voice Broadcasting, Multi-Level Reseller Management, and Real-Time Asterisk Engine.

---

## 🏛️ 1. Architecture Overview

- **Asterisk PBX**: Runs in **Docker** (`docker/asterisk/docker-compose.asterisk.yml`) with host networking for ultra-low latency RTP VoIP traffic and ARI (WebSocket & REST API on port `8088`).
- **Backend**: **NestJS 11 + TypeScript** running natively on aaPanel via PM2 on port `4000`.
- **Frontend**: **Next.js 15 (App Router) + TypeScript + Tailwind CSS** running natively on aaPanel via PM2 on port `3000`.
- **Database**: **PostgreSQL 16** (aaPanel managed) with Prisma ORM and strict double-entry ledger.
- **Cache & Concurrency**: **Redis 7** (aaPanel managed).
- **Message Broker**: **RabbitMQ 3.12** (aaPanel managed).
- **Web Server / SSL**: **Nginx** (aaPanel managed reverse proxy).

---

## 🚀 2. Quick Start & Deployment Guide

### Step 1: Start Asterisk in Docker
```bash
cd /www/wwwroot/vsms.ominaz.com/voice-pro/docker/asterisk
docker compose -f docker-compose.asterisk.yml up -d --build
```
Verify Asterisk is running:
```bash
docker ps | grep voice-pro-asterisk
curl http://127.0.0.1:8088/ari/api-docs/resources.json
```

### Step 2: Setup Database & Seed Initial Hierarchy
```bash
cd /www/wwwroot/vsms.ominaz.com/voice-pro/backend
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### Step 3: Run via aaPanel PM2
From the `voice-pro` root:
```bash
pm2 start ecosystem.config.cjs
pm2 save
```
Verify status:
```bash
pm2 status
```
- `voice-pro-backend`: Running on `http://127.0.0.1:4000`
- `voice-pro-frontend`: Running on `http://127.0.0.1:3000`

### Step 4: Configure aaPanel Nginx
Copy the contents of `/www/wwwroot/vsms.ominaz.com/voice-pro/aapanel-nginx-config.conf` into your website's Nginx configuration inside aaPanel (`Website > vsms.ominaz.com > Conf > Configuration file`).

---

## 👥 3. Multi-Level Reseller Hierarchy

| Tier | Role | Capabilities |
|---|---|---|
| **Level 0** | `SUPER_ADMIN` | Global platform administration, server & trunk config, wholesale root |
| **Level 1** | `SERVICE_PROVIDER` (SP) | Telecom wholesale management, provider buy rates, Master Reseller accounts |
| **Level 2** | `MASTER_RESELLER` | Commercial resale, Sub-reseller accounts, custom pricing plans |
| **Level 3** | `SUB_RESELLER` | Agency sales, customer accounts, balance distribution |
| **Level 4** | `CUSTOMER` | End user, voice campaigns, voice OTP API, balance recharges |

### Lineage Isolation:
Server-side `HierarchyGuard` enforces that resellers can **only** view and manage accounts and CDR records within their own subtree path.

---

## 💰 4. Financial Ledger & Pricing Engine

- **Pulse Billing Formula**:
  $$\text{Pulses} = \left\lceil \frac{\text{Duration (seconds)}}{\text{Pulse Increment (e.g. 10s)}} \right\rceil$$
  $$\text{Customer Price} = \text{Pulses} \times \text{Selling Rate}$$
  $$\text{Telecom Cost} = \text{Pulses} \times \text{Buy Rate}$$
  $$\text{Gross Profit} = \text{Customer Price} - \text{Telecom Cost}$$

- **Double-Entry Ledger Types**:
  - `CREDIT`: Balance added via recharge or transfer
  - `DEBIT`: Balance deducted for finalized call charges
  - `RESERVE`: Temporary balance hold during campaign in-flight execution
  - `REFUND`: Automatic return of unused reserves on non-connected calls
  - `TRANSFER`: Parent-to-child balance transfer with sender DEBIT and recipient CREDIT

---

## 🧪 5. Automated Tests

Run backend unit tests:
```bash
cd backend
npm test
```
Tests included:
- `billing-accuracy.spec.ts`: Tests pulse rounding, buy vs sell rate margins, and zero-charge handling for unanswered calls.
- `hierarchy-permissions.spec.ts`: Tests role hierarchy creation boundaries and tree lineage depth calculations.
