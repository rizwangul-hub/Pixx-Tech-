# PHASE 7 — PixxTech Central Portal Security Audit & End-to-End SSO Verification Report

**Target Workspace:** `D:\Web development\PixxTech`  
**Audit Type:** Source Code, Configuration & Architecture Security Audit (Phases 1–7 Final)  
**Date of Audit:** October 2026  
**Auditor:** Antigravity Advanced Agentic AI Engineering  
**Operating Mode:** Complete Phase 1 to Phase 7 Verification & Automated Hardening

---

## 1. Audit Scope & Applications Inspected

This comprehensive audit evaluated the source code, authentication middleware, SSO controllers, session storage, routing, and environment configurations across the central portal and all five enterprise business applications:

| # | Application Name | Local Codebase Path | Technology Stack | Auth Mechanism | Evaluated Role in Phase 7 |
|:---:|:---|:---|:---|:---|:---|
| **0** | **PixxTech Central Portal** | `D:\Web development\PixxTech` | Express 5 / React Vite / MongoDB | Session Cookies + JWT | Central Identity Provider (IdP) |
| **1** | **Pakistan Expense Tracker** | `D:\Web development\Expense tracker for Pak and Uk\Pak Expense Tracker` | Express 5 (ESM) / Mongoose 9.10 | 7-day Bearer JWT (`tokenVersion`) | SSO Pilot Destination (**Hardened & Verified**) |
| **2** | **UK Expense Tracker** | `D:\Web development\Expense tracker for Pak and Uk\Uk Expense Tracker` | Express 5 (ESM) / Mongoose 9.11 | 7-day Bearer JWT + Company Context | SSO Expansion Destination (**Verified**) |
| **3** | **Rota System** | `D:\Web development\Rota_System` | Express 5 (CJS) / Mongoose 9.10 | 30-day Bearer JWT (`username` key) | SSO Expansion Destination (**Verified**) |
| **4** | **Bicycle Purchase System** | `D:\Web development\Pixx Bicycle CCTV` | Express 4 (CJS) / ONNX Runtime | None (Camera streaming service) | Isolated Direct Launch (`ssoEnabled: false`) |
| **5** | **Task Manager** | `D:\Web development\Task-Manager` | Express 4 (ESM) / Mongoose / Redis | Access JWT + HttpOnly Refresh Cookie | SSO Expansion Destination (**Verified**) |

---

## 2. Verified Implementation vs. Previous Completion Claims

| Previous Phase Claim | Audit Verification Status | Technical Evidence & Code Findings |
|:---|:---:|:---|
| **Phase 1: Foundation UI & Layout** | **VERIFIED** | Clean modular React 19 + Vite frontend; responsive navigation, layout components, and Express API root operational. |
| **Phase 2: Database, Cloudinary & SVG Security** | **VERIFIED & HARDENED** | Mongoose models for User, Software, ActivityLog compiled. Upload middleware hardened with `containsUnsafeSvgContent` vector graphic XSS sanitizer blocking embedded scripts and active event handlers. |
| **Phase 3: Central Authentication & RBAC** | **VERIFIED** | Central login (`/api/auth/login`), generic anti-enumeration error handling, password hashing via `bcryptjs`, session ID regeneration (`req.session.regenerate()`), and strict role hierarchy. |
| **Phase 4: 3D Interactive Dashboard & Launchers** | **VERIFIED** | Pointer-based 3D tilt, specular glare, external session isolation, placeholder URL handling, and image loading fallbacks (`imgFailed` fallback to SVG icons). |
| **Phase 5: Pakistan Expense Pilot Complete** | **VERIFIED & HARDENED** | Non-destructive `/api/auth/sso/exchange` endpoint active. **Remediated in Master Execution**: Added explicit `algorithms: ['HS256']` and atomic `redeemedTickets` replay prevention cache. |
| **Phase 6: Production Hardening & Startup Guards** | **VERIFIED** | `validateEnv.js` aborts production startup if critical secrets or `MONGODB_URI` are missing; Helmet security headers (HSTS, CSP, X-Frame-Options: DENY, noSniff) and correlation IDs (`X-Request-Id`) active. |
| **Phase 6A: UK Expense Tracker SSO Integration** | **VERIFIED** | `POST /api/auth/sso/exchange` implemented in `Uk Expense Tracker/Backend/src/controllers/ssoController.js`. Enforces `HS256`, verifies audience (`uk-company`), checks `user.isActive`, preserves `user.allowedCompanies`, and uses atomic replay cache. |
| **Phase 6A: Rota System SSO Integration** | **VERIFIED** | `POST /api/auth/sso/exchange` implemented in `Rota_System/backend/src/controllers/ssoController.js`. Enforces `HS256`, verifies audience (`rota-system`), matches email/username, enforces `user.isActive`, and logs to `AuditLog`. |
| **Phase 6A: Task Manager SSO Integration** | **VERIFIED** | `POST /api/auth/sso/exchange` implemented in `Task-Manager/backend/src/controllers/sso.controller.js`. Enforces `HS256`, verifies audience (`task-manager`), issues dual access token + `HttpOnly` refresh cookie, and leaves legacy login intact. |
| **Phase 6A: Bicycle Purchase System Untouched** | **VERIFIED** | `Pixx Bicycle CCTV` contains zero SSO code, zero modified routes, and remains `DIRECT_LAUNCH` with status `compatibility_review_required`. |
| **Phase 6A: Sarfraz Khan Isolation Enforced** | **VERIFIED** | Central portal denies SSO ticket generation and launch for Sarfraz Khan on UK Company, Task Manager, and Bicycle with HTTP 403 Forbidden. |

---

## 3. Central SSO Security Findings

### 3.1 Cryptographic Algorithm & Signature Validation
- **Central Portal (`PixxTech/backend/services/ssoService.js`)**:
  - Signs tickets with `algorithm: 'HS256'`.
  - Verifies tickets with explicit allowlist `algorithms: ['HS256']`.
  - Forged tokens with `alg: 'none'` or tampered signatures fail closed immediately (`JsonWebTokenError`).
- **All Four Destination Applications**:
  - Pakistan Expense Tracker (**Patched**), UK Expense Tracker, Rota System, and Task Manager strictly enforce `algorithms: ['HS256']`.

### 3.2 Audience Binding & Cross-Application Replay
- Every ticket is strictly bound to `aud: software.clientId`.
- Cross-application token redemption is completely blocked:
  - Attempting to redeem a UK Company ticket (`aud: 'uk-company'`) at Task Manager (`aud: 'task-manager'`) is rejected with `AUDIENCE_MISMATCH` (HTTP 403).
  - Attempting to redeem a Task Manager ticket at Rota System is rejected with `AUDIENCE_MISMATCH` (HTTP 403).

### 3.3 Ticket Expiration & Claim Integrity
- All tickets enforce a 5-minute time-to-live (`expiresIn: '5m'` = 300 seconds).
- Mandatory claims (`iss`, `aud`, `sub`, `email`, `jti`, `nonce`) are validated across all endpoints.
- Expired tickets fail closed (`TICKET_EXPIRED` / HTTP 401).

### 3.4 Ticket Replay Protection Architecture
- **Central Portal, Pak Expense, UK Expense, Rota System, Task Manager**:
  - Implement an atomic in-memory `Map` storing `jti -> expiryTimestamp` with auto-pruning.
  - Replaying a redeemed ticket fails closed (`TICKET_REPLAYED` / HTTP 401).
  - **Limitation**: Process-local in RAM. In a horizontally scaled production deployment (e.g., 2+ backend pods or replicas behind a load balancer), a ticket could theoretically be submitted once to Replica 1 and once to Replica 2 within its 5-minute window if requests hit different instances. (Requires distributed Redis `SET ... EX 300 NX` for multi-instance clusters).

### 3.5 Symmetric Secret vs. Asymmetric Signing Evaluation
- **Current Model**: Symmetric HMAC-SHA256 (`HS256`) with a shared `SSO_SECRET`.
- **Blast Radius Analysis**: If any single application server (e.g., Rota System or Task Manager) is compromised and the attacker obtains `SSO_SECRET`, that attacker can forge tickets for **all other applications**, masquerading as the Central Portal Identity Provider.
- **Strategic Recommendation**: Migrate to **Asymmetric Signing (RS256 with 2048-bit RSA or ES256 with ECDSA P-256)** in a future architectural upgrade:
  - Central Portal holds the private key (`portal_private_key.pem`) to sign tickets.
  - Destination applications hold only the public key (`portal_public_key.pem`) or pull public keys via JWKS (`/.well-known/jwks.json`).
  - If a target app is compromised, the attacker only has the public key and cannot mint tickets for other applications.

---

## 4. Five-Application Access Matrix Verification

The access control matrix was directly audited against `User.hasSoftwareAccess(software)` in `PixxTech/backend/models/User.js`:

| User Name | Assigned Role | Pak Expense | UK Expense | Rota System | Bicycle CCTV | Task Manager | Backend Enforcement Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Kamran Ijaz** | Boss (Super Admin) | **Allowed** | **Allowed** | **Allowed** | **Allowed (Policy)** | **Allowed** | **VERIFIED (HTTP 200)** |
| **Fahad Rasheed** | Manager | **Allowed** | **Allowed** | **Allowed** | **Allowed (Policy)** | **Allowed** | **VERIFIED (HTTP 200)** |
| **Khurshid Anwar** | Assistant Manager | **Allowed** | **Allowed** | **Allowed** | **Allowed (Policy)** | **Allowed** | **VERIFIED (HTTP 200)** |
| **Rizwan** | Software Developer | **Allowed** | **Allowed** | **Allowed** | **Allowed (Policy)** | **Allowed** | **VERIFIED (HTTP 200)** |
| **Sarfraz Khan** | Accountant | **Allowed** | **DENIED** | **Allowed** | **DENIED** | **DENIED** | **VERIFIED (HTTP 403)** |

### Sarfraz Khan Direct Backend Testing
- Direct call to `initiateSSO` for `uk-company`: **HTTP 403 Forbidden** (`Access denied: Role 'Accountant' is not authorized to access 'UK Company'`).
- Direct call to `initiateSSO` for `task-manager`: **HTTP 403 Forbidden** (`Access denied: Role 'Accountant' is not authorized to access 'Task Manager'`).
- Direct call to `initiateSSO` for `bicycle-purchase-system`: **HTTP 403 Forbidden** (`Access denied: Role 'Accountant' is not authorized to access 'Bicycle Purchase System'`).
- Direct call to `initiateSSO` for `pakistan-expense-tracker`: **HTTP 200 OK** (Ticket issued).
- Direct call to `initiateSSO` for `rota-system`: **HTTP 200 OK** (Ticket issued).

### Bicycle Purchase System Security Boundary Review
- **Finding**: Permission for Boss/Manager to launch the Bicycle application in Central Portal **does not mean the Bicycle service is secured**.
- **Evidence**: `Pixx Bicycle CCTV/backend/src/app.js` exposes raw camera stream and detection endpoints (`/api/camera`, `/api/detections`) without authentication.
- **Verification**: Bicycle Purchase System remains registered as `ssoEnabled: false`, `ssoProtocol: 'DIRECT_LAUNCH'`, `integrationStatus: 'compatibility_review_required'`. It must remain isolated on an internal private network.

---

## 5. Detailed Review of SSO Exchange Endpoints

### 5.1 Pakistan Expense Tracker
- **Endpoint**: `POST /api/auth/sso/exchange` in `Pak Expense Tracker/Backend/controllers/ssoController.js`.
- **Account Mapping**: Resolves local account by `User.findOne({ email: normalizedEmail })`.
- **Session Preservation**: Does not increment `tokenVersion` on SSO exchange; existing 7-day Bearer tokens remain valid.
- **Remediations Completed**: Added explicit `algorithms: ['HS256']` and atomic `redeemedTickets` replay protection cache.

### 5.2 UK Expense Tracker
- **Endpoint**: `POST /api/auth/sso/exchange` in `Uk Expense Tracker/Backend/src/controllers/ssoController.js`.
- **Account Mapping**: Resolves local operator by `User.findOne({ email: normalizedEmail })`.
- **Company Access**: Preserves `user.allowedCompanies` array; does not bypass company isolation middleware (`requireCompanyContext`).
- **Multi-User Note**: UK Expense Tracker operates on a single authorized operator setup (`src/scripts/setupUser.js`). If an authorized user in Central Portal has an email that does not match the provisioned operator in UK Expense Tracker, SSO exchange cleanly returns `HTTP 404 USER_NOT_MAPPED`. Additional operators must be provisioned locally if multi-user access is desired.

### 5.3 Rota System
- **Endpoint**: `POST /api/auth/sso/exchange` in `Rota_System/backend/src/controllers/ssoController.js`.
- **Account Mapping**: Matches on `{ email: email }`, `{ username: candidateUsername }`, or `{ username: email }`.
- **Role Preservation**: Retains existing roles (`ADMIN`, `ATTENDANCE_OPERATOR`, etc.) and returns native 30-day JWT.
- **Security Note**: Email-to-username fallback functions cleanly. However, to guarantee zero ambiguity in enterprise multi-user environments, corporate email should be populated on all Rota System user accounts.

### 5.4 Task Manager
- **Endpoint**: `POST /api/auth/sso/exchange` in `Task-Manager/backend/src/controllers/sso.controller.js`.
- **Dual-Token Flow**: Generates standard access token (15m) and sets `refresh_token` (7d) in `HttpOnly`, `SameSite`, `Secure` cookie via `setAuthCookies`.
- **Session & Revocation**: Uses standard `generateTokens(user)`. Compatible with existing `/logout` (which clears cookies) and `/refresh` routes.
- **Redis Opportunity**: Task Manager backend includes Redis client setup (`src/config/redis.js`), but currently uses an in-memory `Map` for SSO ticket replay protection. It can be easily upgraded to Redis `SET ... EX 300 NX` for distributed replay defense.

---

## 6. Configuration & Environment Audit

Environment variable audit across all six repositories (values strictly redacted):

| Project | Environment File | SSO Secret Configured | Mongo DB Key Name | CORS Config Key Name | Secret Exposure Risk |
|:---|:---|:---:|:---|:---|:---:|
| **PixxTech Central Portal** | `PixxTech/backend/.env` | Fallback active | `MONGODB_URI` | `CLIENT_URL` | None in `.env` |
| **Pak Expense Tracker** | `Pak Expense/Backend/.env` | Fallback active | `MONGO_URI` | `CORS_ORIGIN` | None in `.env` |
| **UK Expense Tracker** | `Uk Expense/Backend/.env` | Fallback active | `MONGO_URI` | `CORS_ORIGIN` | None in `.env` |
| **Rota System** | `Rota_System/backend/.env` | Fallback active | `MONGO_URI` | `CORS_ORIGINS` | None in `.env` |
| **Bicycle CCTV** | `Pixx Bicycle CCTV/backend/.env`| N/A | None (Local FS) | N/A | None in `.env` |
| **Task Manager** | `Task-Manager/backend/.env` | Fallback active | `MONGODB_URI` | `FRONTEND_URL` | None in `.env` |

---

## 7. Full Regression & Security Test Results

All test suites were executed from `D:\Web development\PixxTech` without any environment modifications:

| Test Suite File | Exact Execution Command | Total Tests | Passed | Failed | Skipped | Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **`test-phase7-audit.js`** | `node backend/test-phase7-audit.js` | 20 | 20 | 0 | 0 | **100% Passed** |
| **`test-phase6a.js`** | `node backend/test-phase6a.js` | 10 | 10 | 0 | 0 | **100% Passed** |
| **`test-phase6.js`** | `node backend/test-phase6.js` | 11 | 11 | 0 | 0 | **100% Passed** |
| **`test-phase5.js`** | `node backend/test-phase5.js` | 11 | 11 | 0 | 0 | **100% Passed** |
| **`test-phase4.js`** | `node backend/test-phase4.js` | 11 | 11 | 0 | 0 | **100% Passed** |
| **`test-phase3.js`** | `node backend/test-phase3.js` | 30 | 30 | 0 | 0 | **100% Passed** |
| **`test-phase2.js`** | `node backend/test-phase2.js` | 25 | 25 | 0 | 0 | **100% Passed** |
| **Frontend Build** | `npm run build --prefix frontend` | Vite build | Success | 0 | 0 | **Built in 451ms** |
| **Total Test Suite** | **Comprehensive Regression** | **118** | **118** | **0** | **0** | **100% Passed** |

---

## 8. Findings Classification & Resolution Status

| Finding ID | Severity | Description | Status | Resolution Detail |
|:---:|:---:|:---|:---:|:---|
| **SEC-01** | **HIGH** | Missing ticket replay protection in Pakistan Expense Tracker pilot endpoint. | **RESOLVED** | Added `redeemedTickets` Map with auto-pruning to `Pak Expense Tracker/Backend/controllers/ssoController.js`. |
| **SEC-02** | **HIGH** | Missing explicit `algorithms: ['HS256']` in Pakistan Expense Tracker ticket verification. | **RESOLVED** | Added `algorithms: ALLOWED_ALGORITHMS` (`['HS256']`) to `jwt.verify` options. |
| **SEC-03** | **HIGH** | Symmetric shared secret architecture: blast radius of single service breach. | **DOCUMENTED** | Strategic roadmap item: Transition to Asymmetric RS256/ES256 in future release. |
| **SEC-04** | **MEDIUM** | In-memory process-local replay cache does not protect across multi-replica clusters. | **DOCUMENTED** | Recommended Redis-backed replay protection when deploying multi-container clusters. |
| **SEC-05** | **MEDIUM** | Implicit default development fallback string used when `SSO_SECRET` is omitted from `.env`. | **DOCUMENTED** | Requires user injection of dedicated production `SSO_SECRET` into live hosting configs. |
| **SEC-06** | **MEDIUM** | Unauthenticated raw camera endpoints in Bicycle Purchase System. | **ISOLATED** | Confirmed Bicycle System remains `DIRECT_LAUNCH` (`compatibility_review_required`) without public SSO routes. |
| **SEC-07** | **LOW** | UK Expense Tracker single-operator model requires manual local provisioning. | **DOCUMENTED** | Documented operator provisioning requirements for multi-user setups. |
| **SEC-08** | **LOW** | Potential username collision in Rota System if emails not populated. | **DOCUMENTED** | Recommended adding email addresses to all active Rota System user records. |
| **SEC-09** | **INFO** | Inconsistent environment variable naming across microservices. | **DOCUMENTED** | Microservices operate independently; standardization recommended for operational consistency. |
| **SEC-10** | **HIGH** | Vector graphic (SVG) uploads could allow stored XSS via embedded scripts. | **RESOLVED** | Implemented `containsUnsafeSvgContent` sanitizer in `uploadMiddleware.js` and `uploadController.js`. |

---

## 9. Final Verification Verdict

> **Controlled Testing Readiness Statement:**  
> The PixxTech Central Portal and the integrated business applications are **VERIFIED AND READY FOR CONTROLLED LOCAL & STAGING TESTING**.  
> The access matrix is strictly enforced, Sarfraz Khan's access boundary is 100% active, SVG uploads are sanitized, Pakistan Expense Tracker replay protection is active, and all 118 automated regression tests pass.
