# SYSTEM AUDIT REPORT — Voice SMS & Outbound IVR SaaS

**Date:** October 17, 2026  
**Auditor:** Lead Architect & DevOps Engineer  
**Target Domain:** `vsms.ominaz.com`  
**Host Environment:** Linux (Ubuntu / aaPanel Environment)

---

## 1. Executive Summary

This comprehensive audit was performed using non-destructive, read-only inspection methods across the operating system, container runtime, telephony engine, databases, queues, and application layers. 

The environment hosts an enterprise Voice SMS and Outbound IVR SaaS platform with:
- **Telephony Engine:** Asterisk 20.9.3 running in Docker container `voice-pro-asterisk` (Network: host).
- **Backend API:** NestJS (TypeScript, Prisma ORM, WebSocket client for ARI) on Port 4000.
- **Frontend Portal:** Next.js 15 (TypeScript, Tailwind CSS, Lucide React) on Port 3000.
- **Database:** PostgreSQL 16 on `127.0.0.1:5432`, Database `voice_pro`.
- **Cache & Distributed Coordination:** Redis 7 on `127.0.0.1:6379`.
- **Queue / Message Broker:** RabbitMQ 3.x on `127.0.0.1:5672` (Management: 15672).
- **Web Reverse Proxy:** Nginx with SSL terminating for `vsms.ominaz.com`.

---

## 2. Infrastructure & Container Runtime

### 2.1 Docker & Existing Asterisk Container
- **Docker Version:** 27.x installed and healthy.
- **Running Container:** `voice-pro-asterisk` (Image: `asterisk-asterisk`).
- **Container ID:** `2cb188e80a17`
- **Network Mode:** `host` (Required for VoIP/RTP UDP port ranges 10000-20000 with zero NAT penalty).
- **Mounts & Volumes:**
  - `./conf/ari.conf -> /etc/asterisk/ari.conf:ro`
  - `./conf/http.conf -> /etc/asterisk/http.conf:ro`
  - `./conf/pjsip.conf -> /etc/asterisk/pjsip.conf:ro`
  - `./conf/extensions.conf -> /etc/asterisk/extensions.conf:ro`
  - `./conf/rtp.conf -> /etc/asterisk/rtp.conf:ro`
  - `./conf/logger.conf -> /etc/asterisk/logger.conf:ro`
  - `/www/wwwroot/vsms.ominaz.com/storage/app/public/audios -> /var/lib/asterisk/sounds/audios:ro`
  - `/www/wwwroot/vsms.ominaz.com/public/sounds -> /var/lib/asterisk/sounds/sounds:ro`
  - `/www/wwwroot/vsms.ominaz.com/storage/logs/asterisk -> /var/log/asterisk`
  - Volume `asterisk_sounds -> /var/lib/asterisk/sounds`

### 2.2 Telephony Subsystems Audit
| Subsystem | Configuration State | Operational Status | Notes |
| :--- | :--- | :--- | :--- |
| **Asterisk Version** | 20.9.3 LTS | Active / Up 10+ hrs | Zero active channels during idle. |
| **HTTP Server** | Bound to `0.0.0.0:8088` | Active | Endpoints: `/ari/...`, `/ws`, `/metrics` |
| **ARI (REST & WS)** | Enabled, User Count: 1 | Active & Connected | App `VoiceProStasis` subscribed by NestJS. |
| **AMI (Manager)** | Disabled | Inactive | Telephony control standardizes on ARI. |
| **PJSIP Transports** | `transport-udp`, `transport-tcp` | Bound to `0.0.0.0:5060` | Dual TCP/UDP signaling available. |
| **PJSIP Endpoints** | `bdpbx-999`, `telco-trunk-01` | Active (NonQual) | Pre-configured carrier gateways. |
| **Dialplan Contexts** | `[default]`, `[from-pstn]`, `[stasis-outbound]`, `[from-internal]` | Active | All route outbound/inbound calls into `Stasis(VoiceProStasis,${EXTEN})`. |
| **CDR Engine** | CSV & Custom | Enabled | Records stored in Asterisk log directory. |
| **CEL Engine** | Disabled | Inactive | Channel Event Logging disabled by default. |

---

## 3. Database & Financial Engine Audit

### 3.1 PostgreSQL Engine
- Host: `127.0.0.1:5432`
- Database: `voice_pro`
- Connection: Pooled Prisma Client with schema `public`.
- Character Set: UTF-8.

### 3.2 Existing Schema & Models
1. **Multi-Tenant Hierarchy:** `User` with roles (`SUPER_ADMIN`, `SERVICE_PROVIDER`, `MASTER_RESELLER`, `SUB_RESELLER`, `CUSTOMER`), materialized lineage path `path` (e.g. `root/reseller/customer`), depth index, parent-child relations.
2. **Financial Core:** `Wallet`, `LedgerEntry` (Double-entry / transaction type: CREDIT, DEBIT, RESERVE, RELEASE, REFUND, COMMISSION, ADJUSTMENT), `BalanceTransfer`, `RechargeRequest`.
3. **Telephony & Carrier:** `AsteriskServer`, `SipTrunk`, `CallerId`.
4. **Campaign & CDR:** `Campaign`, `CallRecord` (stores uniqueId, linkedId, channelId, status, duration, billableSeconds, costPrice, sellingPrice, grossProfit, resellerMargin, hangupCause).
5. **Assets & Audience:** `AudioAsset`, `ContactGroup`, `Contact`.
6. **Reporting:** `ReportExport` with async processing tracking.

---

## 4. Message Broker, Caching & Process Supervision

- **Process Manager:** PM2 v7 managing:
  - `voice-pro-backend` (Cluster/Fork, Node.js NestJS on port 4000)
  - `voice-pro-frontend` (Cluster/Fork, Node.js Next.js 15 on port 3000)
- **Redis:** Port 6379, authenticated. Connected via `redis.service.ts` for distributed locks, caching, and rate limiting.
- **RabbitMQ:** Port 5672 (AMQP) and 15672 (HTTP API Management). Operational for durable message queues.

---

## 5. Security & Isolation Findings

1. **Local Binding Protection:**
   - PostgreSQL (5432), Redis (6379), and RabbitMQ (5672) are firewalled / bound locally.
2. **Asterisk ARI Authentication:**
   - Secured via HTTP Basic Auth with internal non-default passwords.
3. **Tenant Scoping:**
   - Previous fix (`5e51da4`) established tenant scoping across campaigns, audio, contacts, and calls. Needs verification and full enforcement on all reports and exports.
4. **Idempotency Defect Identified:**
   - Error log reveals race condition on duplicate `idempotencyKey` when hangup settlement is triggered multiple times for the same channel. Needs atomic state locking.
5. **Data Type Mismatch:**
   - Asterisk `hangupCause` (e.g., integer 16 or 32) was being passed as an integer into Prisma's `String?` field, causing an unhandled validation exception. Must coerce with `String(event.cause || '')`.

---

## 6. Audit Verdict

The underlying infrastructure is intact, well-architected, and fully ready for the target multi-tenant Outbound IVR and Voice SMS platform expansion. **No reinstallation or destructive action is required.**
