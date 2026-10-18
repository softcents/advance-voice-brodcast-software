# SECURITY & ISOLATION POLICIES — Voice SMS & Outbound IVR SaaS

---

## 1. Multi-Tenant Isolation
- **Hierarchical Scoping:** Users are assigned roles (`SUPER_ADMIN`, `SERVICE_PROVIDER`, `MASTER_RESELLER`, `SUB_RESELLER`, `CUSTOMER`) and a lineage `path`.
- **Query Filtering:** All queries for campaigns, calls, contacts, audio, orders, wallets, and reports must include tenant scoping filters (`userId` or `user.path.startsWith(...)`).
- **Authorization Guards:** JWT strategy validates tenant validity and blocks any cross-tenant ID spoofing.

---

## 2. Telephony & Infrastructure Security
- **Asterisk ARI Access:** Localized to `127.0.0.1:8088`. Protected by HTTP Basic Authentication.
- **SIP Signalling:** PJSIP endpoints bound with strict ACL and authentication.
- **RTP Traffic:** Dedicated port range (10000-20000 UDP) with symmetric RTP and strict media timeouts.
- **Private Data Protection:** Database (5432), Redis (6379), and RabbitMQ (5672) are never exposed on public interfaces.

---

## 3. Financial Integrity & Fraud Prevention
- **Atomic Balance Reservation:** Balances are locked and reserved in PostgreSQL prior to dispatch.
- **Distributed Locking:** Redis mutex locks (`lock:settle:${callId}`) prevent double settlement.
- **Immutable Ledger:** All ledger balance changes require a cryptographically unique `idempotencyKey`.
- **Negative Balance Safeguard:** Only accounts with `allowNegativeBalance: true` and verified `creditLimit` may exceed current prepaid balance.

---

## 4. Webhook & API Security
- **HMAC Signatures:** Order confirmation webhooks sent to e-commerce merchants are signed using SHA-256 HMAC tokens.
- **Rate Limiting:** Prevents denial-of-service on call dispatch and authentication endpoints.
- **Sanitization:** All caller IDs, phone numbers, and DTMF parameters are sanitized against injection attacks.
