# IMPLEMENTATION PLAN — Voice SMS & Outbound IVR SaaS

**Target Platform:** Voice Broadcast Pro SaaS  
**Execution Strategy:** Autonomous, Safe, Incremental, Non-Destructive  

---

## Phase 1: Environment Audit & Foundational Hardening (Done)
- [x] Read-only audit of Docker containers, Asterisk 20.9.3, ARI status, PJSIP trunks.
- [x] Database schema verification and credential validation.
- [x] Fix discovered bugs:
  - Fix Asterisk `hangupCause` numeric-to-string coercion in `AsteriskAriService`.
  - Fix `LedgerEntry` duplicate `idempotencyKey` race condition during simultaneous hangup events.
  - Implement Redis-backed distributed lock during settlement.

---

## Phase 2: Schema Enhancements for IVR & White-Label Reseller Engine
- [ ] Add Prisma models:
  - `IvrFlow`: Configurable Outbound IVR flows (welcome audio/TTS, key mappings, timeouts, max repeats).
  - `IvrOrder`: Automated order confirmation tracking (order number, customer number, amount, items, status: PENDING, CONFIRMED, CANCELLATION_REQUESTED, CALLBACK_SCHEDULED, FAILED).
  - `IvrCallback`: Scheduled callbacks with retry count and business-hour enforcement.
  - `ResellerBrand`: White-label domain, logo URL, brand name, support email, color palette.
  - `AuditLog`: Security and administrative change tracking.
  - `OutboxEvent`: Reliable messaging outbox for RabbitMQ event dispatching.
- [ ] Generate Prisma client and apply migration safely (`npx prisma db push` without data loss).

---

## Phase 3: Outbound IVR & DTMF Engine in NestJS
- [ ] Implement `IvrModule` with controller and service:
  - DTMF Event processor hooked into Asterisk ARI `ChannelDtmfReceived`.
  - Actions: 1 Confirm, 2 Request Cancellation, 3 Schedule Callback, 0 Transfer to Agent.
  - No input timeout & repeat counter.
  - Order status updater and webhook dispatcher.
- [ ] Create order confirmation REST API endpoints:
  - `POST /api/ivr/orders/dispatch`: Dispatches an automated confirmation call for an e-commerce order.
  - `GET /api/ivr/orders`: Filterable list of orders and call results.
  - `POST /api/ivr/flows`: Create/update custom IVR flows.

---

## Phase 4: Financial & Wholesale-Retail Billing Hardening
- [ ] Ensure strict double-entry ledger entries for every transaction type:
  - Balance reservation when campaigns/IVR calls are queued.
  - Final charge settlement based on billable pulse duration.
  - Refund of unused reserved balance.
  - Commission/reseller margin crediting.
- [ ] Reseller credit limit enforcement & negative balance controls.

---

## Phase 5: Advanced Reporting & XLSX Export Engine
- [ ] Implement Super Admin & Reseller financial reports in `ReportingService`:
  - Platform Financial Summary
  - Reseller Profitability & Margin
  - Customer Profitability
  - Usage & Billing Details
  - Outbound IVR Order Conversion Rate (Cost per confirmed order)
  - Missing CDR & Unrated Usage Exception Reports
- [ ] Implement streaming XLSX exporter (using `exceljs`) for all report types.

---

## Phase 6: Next.js Frontend Dashboards & IVR Flow Builder
- [ ] Update Navigation & Role-based Header with IVR, Orders, and Advanced Reports.
- [ ] Build Outbound IVR & Order Confirmation Page:
  - Order submission, live status badges, DTMF responses.
- [ ] Build IVR Flow Builder UI (configure prompts, keys 1/2/3/0, fallback).
- [ ] Build Advanced Financial Reporting & XLSX Export modal.
- [ ] Build White-Label Reseller Branding Settings.

---

## Phase 7: Verification, Testing & Deployment
- [ ] Run backend unit and integration tests.
- [ ] Run frontend production build check (`npm run build`).
- [ ] Test live Asterisk ARI call dispatch and DTMF simulation.
- [ ] Reload PM2 services gracefully (`pm2 reload all`).
- [ ] Document final deliverables and rollback instructions.
