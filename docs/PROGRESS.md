# ADVANCED VOICE SMS SAAS & OUTBOUND IVR — PROGRESS REPORT

**Platform:** VoiceBroadcastPro / Softcents Voice SMS SaaS  
**Domain:** `vsms.ominaz.com`  
**Execution Status:** COMPLETED & PRODUCTION READY  
**Last Updated:** October 18, 2026

---

## 1. System & Infrastructure Audit Summary
- **Asterisk / FreePBX Container:** `voice-pro-asterisk` (Asterisk 20.9.3 LTS) running on host networking with ARI listening on `0.0.0.0:8088`. Verified intact; no containers deleted, renamed, or modified.
- **SIP Trunks & Endpoints:** Verified existing PJSIP trunks (`bdpbx-999`, `telco-trunk-01`), codecs (`alaw`, `ulaw`, `g729`), audio recordings, and dialplan contexts preserved without disruption.
- **PostgreSQL 16 Database:** Database `voice_pro` updated with non-destructive headless migration (`apply-ivr-schema.ts`). All existing tables, legacy IDs, wallets, and ledger entries intact.
- **Redis 7:** Connected on `127.0.0.1:6379`. Used for distributed mutex locks (`lock:settle:${callId}`, `lock:dispatch:${callId}`), idempotency keys, and tenant concurrency counters.
- **RabbitMQ Broker:** Active on `127.0.0.1:5672`. Configured with durable queues, dead-letter exchanges, and controlled prefetch workers.
- **Nginx Reverse Proxy:** Dual reverse proxy with SSL termination; routes `/api` to NestJS (Port 4000) and `/` to Next.js (Port 3000).

---

## 2. Implemented Features & Modules

### 2.1 Outbound IVR & Auto Order Confirmation Engine
- **Module:** `backend/src/modules/ivr/` (`ivr.service.ts`, `ivr.controller.ts`, `ivr.module.ts`)
- **Keypad Options:**
  - **Key 1:** Confirm Order (`CONFIRMED`), audio acknowledgment, and HMAC SHA-256 merchant webhook.
  - **Key 2:** Cancellation Request (`CANCELLATION_REQUESTED` or `CANCELLED` based on `autoCancelPolicy`).
  - **Key 3:** Schedule Callback (`CALLBACK_SCHEDULED`), logs callback request into `IvrCallback` table.
  - **Key 0:** Live Support Transfer to configured agent destination.
- **Asterisk ARI Stasis Integration:**
  - Registered application `VoiceProStasis` via persistent WebSocket in `AsteriskAriService`.
  - Ingests `ChannelDtmfReceived`, `StasisStart`, `PlaybackFinished`, and `ChannelHangupRequest`.
  - Automatic Bengali TTS and audio playback (`sound:sounds/order-welcome`, `sound:sounds/order-confirmed`, etc.).

### 2.2 Financial Ledger & Multi-Tenant Billing
- **Upfront Balance Reservation:** Reserves estimated cost before call origination; refunds unused balance on no-answer/busy calls.
- **Idempotent Settlement:** Redis distributed lock `lock:settle:${callId}` and PostgreSQL transaction with unique `idempotencyKey` prevents duplicate billing.
- **Tiered Margins:** Accurate calculation of Buy Rate (Telco wholesale cost), Sell Rate (Customer retail), Gross Profit, and Reseller Share.

### 2.3 RabbitMQ Background Queues & Controlled Workers
- **Module:** `backend/src/modules/queue/` (`queue.service.ts`, `queue.worker.ts`, `queue.controller.ts`)
- **Durable Queues & DLQs:**
  - `voice.campaign.dispatch` (DLX: `voice.campaign.dlx`, DLQ: `voice.campaign.dlq`, prefetch: 15)
  - `voice.ivr.retry` (DLX: `voice.ivr.dlx`, DLQ: `voice.ivr.dlq`, prefetch: 5)
  - `voice.webhook.dispatch` (DLX: `voice.webhook.dlx`, DLQ: `voice.webhook.dlq`, prefetch: 20)
- **Features:** Campaign pause/resume checking, per-tenant concurrency limits (30 channels/tenant, 100 for admin), exponential backoff retries (5s, 15s, 45s, 120s), and live queue metrics API (`GET /api/queue/metrics`).

### 2.4 White-Label Reseller Portal
- **Branding & Identity:** `ResellerBrand` model supporting custom domains, brand names, logos, favicons, custom primary/secondary colors, and support contacts.
- **Credit Limit & Overdraft:** Super Admin can set and approve credit limits and negative balance allowances per reseller.
- **Frontend Management:** Modern dashboard page at `/resellers/branding` with real-time preview card.

### 2.5 Advanced Analytics & Excel Export
- **IVR Order Conversion Report:** Aggregates total orders, confirmed orders, cancellation requests, callbacks, conversion rates, and total revenue vs cost.
- **Streaming XLSX Export:** Low-memory streaming export via `ExcelJS` at `/api/reports/ivr-orders/export` with styled headers and automated column auto-sizing.

### 2.6 Next.js 15 Frontend Modernization
- Built and statically compiled 34 routes in Next.js 15 App Router:
  - `/ivr/orders` — Real-time order dispatch, live KPI metrics, status filters, keypad indicator badges, and Excel export.
  - `/ivr/flows` — Interactive IVR flow builder for Bengali TTS text, key actions, timeouts, and repeat limits.
  - `/ivr/callbacks` — Customer callback management queue.
  - `/resellers/branding` — Reseller white-label configuration with instant UI preview.
  - `/reports` & `/reports/usage` — Financial reports, reseller profit margins, and usage breakdowns.
  - Updated `Sidebar.tsx` navigation groups with modern icons and tenant-aware role visibility.

---

## 3. Automated Test Verification

| Test Suite | Spec File | Result |
| :--- | :--- | :---: |
| Billing & Pulse Accuracy | `backend/test/billing-accuracy.spec.ts` | **PASS (2/2)** |
| Reseller Hierarchy & Permissions | `backend/test/hierarchy-permissions.spec.ts` | **PASS (2/2)** |
| Reporting & Margins Accuracy | `backend/test/reporting-accuracy.spec.ts` | **PASS (2/2)** |
| Outbound IVR & DTMF Handling | `backend/test/ivr-order-flow.spec.ts` | **PASS (3/3)** |
| Tenant Isolation & Cross-Tenant Security | `backend/test/tenant-isolation.spec.ts` | **PASS (3/3)** |
| RabbitMQ Queue & DLQ Metrics | `backend/test/rabbitmq-queue.spec.ts` | **PASS (3/3)** |
| **Total Test Coverage** | **6 Suites** | **15/15 PASS** |

---

## 4. Current Service & Process Health

| Service | Port / Process | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Asterisk PBX** | Docker `voice-pro-asterisk` | **Active / Up 10+ hrs** | Host net, ARI registered on port 8088 |
| **RabbitMQ Broker** | Host port 5672 | **Active / Running** | Durable queues & DLXs asserted |
| **Redis Cache** | Host port 6379 | **Active / Running** | Distributed locking & cache active |
| **PostgreSQL 16** | Host port 5432 | **Active / Running** | Database `voice_pro` synced |
| **NestJS Backend** | PM2 Process 0 (Port 4000) | **Active (Cluster)** | ARI WebSocket connected, 3 consumers online |
| **Next.js Frontend** | PM2 Process 1 (Port 3000) | **Active (Cluster)** | Next.js 15 production build active |
| **Nginx Web Server** | Ports 80 & 443 (SSL) | **Active / Running** | SSL proxying to 4000 & 3000 |

---

## 5. Production Readiness & Next Steps for Super Admin
1. **Live Telecom Trunk Balance:** Before launching large-scale outbound broadcasts to external subscribers, ensure positive balance on carrier accounts associated with `bdpbx-999` and `telco-trunk-01`.
2. **Custom Audio Uploads (Optional):** Super Admin and customers can upload custom Studio Bengali audio files (`.wav`) via `/calling/audio` to override the default text-to-speech prompts.
3. **White-Label DNS Records:** When resellers map a custom domain (e.g. `voice.resellerbrand.com`), add a CNAME record pointing to `vsms.ominaz.com`.
