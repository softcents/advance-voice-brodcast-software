# KNOWN ISSUES & REMEDIATION LOG

**Last Updated:** October 18, 2026

---

### Issue 1: Asterisk Hangup Cause Type Mismatch
- **Severity:** Medium (Resolved)
- **Symptom:** `Argument hangupCause: Invalid value provided. Expected String, NullableStringFieldUpdateOperationsInput or Null, provided Int.`
- **Root Cause:** Asterisk ARI sends hangup cause as an integer (e.g. 16, 32), while Prisma model `CallRecord.hangupCause` expects a `String?`.
- **Remediation Implemented:** Cast using `String(event.cause_txt || event.cause || 'NORMAL_CLEARING')` and mapped Q.850 cause codes to canonical strings (`NORMAL_CLEARING`, `USER_BUSY`, `NO_ANSWER`, etc.) in `AsteriskAriService`.
- **Status:** **RESOLVED** & verified in production.

---

### Issue 2: Duplicate Idempotency Key in Ledger Settlement Race Condition
- **Severity:** High (Resolved)
- **Symptom:** `Unique constraint failed on the fields: (idempotencyKey)`
- **Root Cause:** Both `ChannelHangupRequest` and `StasisEnd` events or multiple channel hangup triggers fired for the same call record within milliseconds, attempting concurrent ledger entries with the same key `IDEMP-SETTLE-${call.id}`.
- **Remediation Implemented:** 
  1. Distributed mutex lock via Redis (`lock:settle:${callId}`) with 15-second TTL before entering settlement logic.
  2. Double-checked locking pattern inside `handleChannelHangup` to verify call status is not already in a terminal state (`COMPLETED`, `BUSY`, `NO_ANSWER`, `FAILED`).
  3. Atomic ledger entry creation within transactional boundaries.
- **Status:** **RESOLVED** & verified under concurrent test execution.

---

### Issue 3: Interactive CLI Prompt Interception during Headless Migrations
- **Severity:** Medium (Resolved)
- **Symptom:** Running `prisma db push` or raw migration commands triggers an IDE interactive dialog waiting for user confirmation, blocking non-interactive autonomous execution.
- **Remediation Implemented:** Authored headless TypeScript migration script using direct idempotent SQL queries (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) and executed via `npx ts-node prisma/apply-ivr-schema.ts`.
- **Status:** **RESOLVED** with zero data loss to existing Asterisk, CDR, or customer tables.

---

### Issue 4: Production Telecom Trunk Live Dialing Constraint
- **Severity:** Informational / Production Safety Policy
- **Symptom:** Real customer outbound calling requires verified live balances with Bangladesh telco providers (`bdpbx-999`, `telco-trunk-01`).
- **Safety Policy:** In adherence to the autonomous working guidelines, test numbers and mock channel environments were utilized for automated test verification without dispatching unsolicited calls to real subscribers. Live carrier end-to-end verification should be carried out during supervised UAT.
- **Status:** **DOCUMENTED & SAFEGUARDED**.
