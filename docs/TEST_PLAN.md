# TEST PLAN & VERIFICATION STRATEGY

**Status:** EXECUTED & VERIFIED (15/15 Tests Passing)  
**Last Run:** October 18, 2026

---

## 1. Test Objectives
Ensure end-to-end reliability, tenant boundary security, accurate financial settlement, durable RabbitMQ background processing, and seamless Outbound IVR call flows with DTMF confirmation.

---

## 2. Automated Test Suite Execution Summary

| Test Suite | Spec File | Tests | Status |
| :--- | :--- | :---: | :---: |
| **Billing Accuracy** | `test/billing-accuracy.spec.ts` | 2 | **PASSED** |
| **Hierarchy Permissions** | `test/hierarchy-permissions.spec.ts` | 2 | **PASSED** |
| **Reporting Accuracy** | `test/reporting-accuracy.spec.ts` | 2 | **PASSED** |
| **Outbound IVR Order Flow** | `test/ivr-order-flow.spec.ts` | 3 | **PASSED** |
| **Tenant Isolation** | `test/tenant-isolation.spec.ts` | 3 | **PASSED** |
| **RabbitMQ Queue & DLQ** | `test/rabbitmq-queue.spec.ts` | 3 | **PASSED** |
| **Total** | **6 Suites** | **15 Tests** | **100% PASSED** |

---

## 3. Detailed Test Categories & Verified Scenarios

### 3.1 Financial & Ledger Integrity (`billing-accuracy.spec.ts`)
- **Pulse Calculation Accuracy:** Verified 25 billable seconds rounds up to 3 pulses on a 10-second pulse plan. Accurate breakdown of selling price (`0.90`), cost price (`0.45`), gross profit (`0.45`), and reseller margin (`0.315`).
- **Zero-Duration Calls:** Verified non-connected calls (duration 0) result in 0 charges and return full unspent reserved funds.
- **Settlement Idempotency:** Verified Redis mutex `lock:settle:${callId}` eliminates duplicate ledger insertion on multiple Asterisk hangup events (`StasisEnd`, `ChannelHangupRequest`).

### 3.2 Outbound IVR & DTMF Keypad Engine (`ivr-order-flow.spec.ts`)
- **Key 1 (Order Confirmed):** State transition to `CONFIRMED`, confirmation prompt playback, and HMAC SHA-256 merchant webhook dispatch.
- **Key 2 (Cancellation Request):** State transition to `CANCELLATION_REQUESTED` (or `CANCELLED` when `autoCancelPolicy` is active).
- **Key 3 (Callback Scheduled):** State transition to `CALLBACK_SCHEDULED` and automatic creation of `IvrCallback` task in agent callback queue.

### 3.3 Multi-Tenant Boundary Security (`tenant-isolation.spec.ts`)
- **Customer Scoping:** Customer listing is strictly constrained to authenticated `userId`.
- **Reseller Downline Isolation:** Reseller listing is constrained to subtree `user.path.startsWith(...)`. Cross-reseller records are inaccessible.
- **Cross-Tenant Prevention:** Attempting to view another customer's order triggers `ForbiddenException`.

### 3.4 RabbitMQ Reliable Queuing & Background Workers (`rabbitmq-queue.spec.ts`)
- **Durable Campaign Dispatch:** Persistent message delivery mode (`deliveryMode: 2`) with priority support.
- **IVR Retry Queue:** Custom `x-delay` headers with exponential backoff.
- **Dead-Letter Exchange (DLX):** Unhandled poison messages or max-retry exhaustion routes to `*.dlq`.
- **Live Health Metrics:** Live inspection of queue depth and active consumer counts via `/api/queue/metrics`.

### 3.5 Reporting & XLSX Streaming Export (`reporting-accuracy.spec.ts`)
- **Conversion Rate Metrics:** Calculation of confirmed rate, cancellation request rate, and cost per confirmed order.
- **XLSX Streaming:** Tested `/api/reports/ivr-orders/export` producing valid `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` binary output (6.7 KB).
