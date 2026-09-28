# Test Case Specification

> **Taxonomy Standard:** Validation Testing Categories (`REQUIRED`, `BOUNDARY`, `TYPE`, `TEMPORAL`, `CONDITIONAL`, `LENGTH/FORMAT`, `AUTHENTICATION`, `SESSION`)
>
> **Structure:** Sections are ordered by test level — Model Unit → API → Integration/UI — matching how a change is verified from the inside out.

---

<a id="taxonomy-legend"></a>
## Taxonomy Legend

| Tag | Description |
|-----|-------------|
| `POSITIVE` | Valid input — expected to pass validation |
| `REQUIRED` | Missing mandatory field — expected to fail |
| `TEMPORAL` | Date/time field correctness |
| `BOUNDARY` | Edge values (min/max limits) |
| `TYPE` / `TYPE & ENUM` | Invalid type or disallowed enum value |
| `CONDITIONAL` | Business logic that depends on another field's value |
| `LENGTH/FORMAT` | String sanitization, trimming, normalization |
| `AUTHENTICATION` | Login / credential verification behaviour |
| `SESSION` | Session creation, persistence, or teardown |
| `SECURITY` | Access control on protected routes/actions |
| `INTEGRATION` | End-to-end flow across UI and backend |
| `UI` | Frontend rendering / interaction behaviour |

---

## Table of Contents

- [Taxonomy Legend](#taxonomy-legend)
- [1. Model Unit Test Cases](#model-unit-test-cases)
  - [1.1. FoundItem Model](#founditem-model)
  - [1.2. LostItem Model](#lostitem-model)
  - [1.3. User Model](#user-model)
  - [1.4. Help Models](#help-models)
- [2. API Test Cases](#api-test-cases)
  - [2.1. Login Flow (Auth API & Session)](#login-flow-api)
  - [2.2. Create Report](#api-create-report)
  - [2.3. Browse / Get Reports](#api-get-reports)
  - [2.4. Admin Authorization](#admin-authorization)
  - [2.5. Help Page API](#help-api)
- [3. Integration & UI Test Cases](#integration-ui-test-cases)
  - [3.1. Help Page CRUD Flows](#help-integration)
- [4. Summary](#summary)
- [5. Running the Tests](#running-the-tests)

---

<a id="model-unit-test-cases"></a>
## 1. Model Unit Test Cases

**Test Framework:** Mocha + Chai
**Coverage Tool:** nyc (Istanbul)
**Scope:** Mongoose model schema validation (no database connection required)
**Total Tests:** 41
**Coverage:** 100% (Statements, Branches, Functions, Lines) on all model files

<a id="founditem-model"></a>
### 1.1. FoundItem Model

**Test File:** `test/models/foundItem.model.test.js`
**Model File:** `models/foundItem.model.js`

**Base Valid Fixture:**

| Field | Value |
|-------|-------|
| `ownerId` | `new mongoose.Types.ObjectId()` |
| `title` | `'Blue Water Bottle'` |
| `category` | `'Bottles & Containers'` |
| `description` | `'Stainless steel bottle found near Library Level 2'` |
| `foundAt` | `new Date('2026-09-01')` |
| `campusLocation` | `'Burwood Campus, Library Level 2'` |
| `contactMethod` | `'email'` |
| `status` | `'active'` |

<a id="fi-positive"></a>
**[POSITIVE] Valid Document Creation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| FI-01 | All valid required fields with `contactMethod: email` | ✅ Passes validation |
| FI-02 | `contactMethod: collection` with `collectionLocation` provided | ✅ Passes validation |
| FI-03 | `status` field omitted (default behaviour) | ✅ Defaults to `'active'` |
| FI-04 | `status: 'resolved'` explicitly set | ✅ Passes validation |

<a id="fi-required"></a>
**[REQUIRED] Mandatory Field Validation**

| # | Field Removed | Expected Error |
|---|--------------|----------------|
| FI-05 | `ownerId` | `err.errors.ownerId` exists |
| FI-06 | `title` | `err.errors.title` exists |
| FI-07 | `category` | `err.errors.category` exists |
| FI-08 | `description` | `err.errors.description` exists |
| FI-09 | `campusLocation` | `err.errors.campusLocation` exists |
| FI-10 | `contactMethod` | `err.errors.contactMethod` exists |

<a id="fi-temporal"></a>
**[TEMPORAL] Date Field Validation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| FI-11 | Valid `foundAt` date provided (`2026-08-15T08:00:00Z`) | ✅ Passes validation |
| FI-12 | `foundAt` field omitted | `err.errors.foundAt` exists |

<a id="fi-boundary"></a>
**[BOUNDARY] Photo Array Constraints (0–3 photos)**

| # | Photos Count | Expected Result |
|---|-------------|-----------------|
| FI-13 | 0 photos (empty array) | ✅ Passes validation |
| FI-14 | 3 photos (maximum allowed) | ✅ Passes validation |
| FI-15 | 4 photos (exceeds limit) | `err.errors.photos` — `'A found item report can contain up to three photos.'` |

<a id="fi-type-enum"></a>
**[TYPE & ENUM] Enumeration and Allowed Values**

| # | Field | Invalid Value | Expected Error |
|---|-------|--------------|----------------|
| FI-16 | `contactMethod` | `'phone'` | `err.errors.contactMethod` exists |
| FI-17 | `status` | `'archived'` | `err.errors.status` exists |

<a id="fi-conditional"></a>
**[CONDITIONAL] Business Logic Validation**

| # | Condition | Expected Result |
|---|-----------|-----------------|
| FI-18 | `contactMethod: 'collection'` without `collectionLocation` | `err.errors.collectionLocation` exists |
| FI-19 | `contactMethod: 'email'` without `collectionLocation` | ✅ Passes validation (location not required) |

<a id="fi-length-format"></a>
**[LENGTH / FORMAT] String Sanitization & Trimming**

| # | Fields with Padding | Expected Result |
|---|--------------------|-----------------|
| FI-20 | `title`, `category`, `description`, `campusLocation` with leading/trailing spaces | ✅ Trimmed values stored |

<a id="lostitem-model"></a>
### 1.2. LostItem Model

**Test File:** `test/models/lostItem.model.test.js`
**Model File:** `models/lostItem.model.js`

**Base Valid Fixture:**

| Field | Value |
|-------|-------|
| `ownerId` | `new mongoose.Types.ObjectId()` |
| `title` | `'Black Leather Wallet'` |
| `category` | `'Wallets & Purses'` |
| `description` | `'Black leather bi-fold wallet lost near building LA cafeteria'` |
| `lostAt` | `new Date('2026-09-02')` |
| `campusLocation` | `'Burwood Campus, Building LA'` |
| `status` | `'active'` |

<a id="li-positive"></a>
**[POSITIVE] Valid Document Creation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| LI-01 | All valid required fields | ✅ Passes validation |
| LI-02 | `status` field omitted (default behaviour) | ✅ Defaults to `'active'` |
| LI-03 | `status: 'resolved'` explicitly set | ✅ Passes validation |

<a id="li-required"></a>
**[REQUIRED] Mandatory Field Validation**

| # | Field Removed | Expected Error |
|---|--------------|----------------|
| LI-04 | `ownerId` | `err.errors.ownerId` exists |
| LI-05 | `title` | `err.errors.title` exists |
| LI-06 | `category` | `err.errors.category` exists |
| LI-07 | `description` | `err.errors.description` exists |
| LI-08 | `campusLocation` | `err.errors.campusLocation` exists |

<a id="li-temporal"></a>
**[TEMPORAL] Date Field Validation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| LI-09 | Valid `lostAt` date provided (`2026-08-20T12:00:00Z`) | ✅ Passes validation |
| LI-10 | `lostAt` field omitted | `err.errors.lostAt` exists |

<a id="li-boundary"></a>
**[BOUNDARY] Photo Array Constraints (0–3 photos)**

| # | Photos Count | Expected Result |
|---|-------------|-----------------|
| LI-11 | 0 photos (empty array) | ✅ Passes validation |
| LI-12 | 3 photos (maximum allowed) | ✅ Passes validation |
| LI-13 | 4 photos (exceeds limit) | `err.errors.photos` — `'A lost item report can contain up to three photos.'` |

<a id="li-type-enum"></a>
**[TYPE & ENUM] Enumeration and Allowed Values**

| # | Field | Invalid Value | Expected Error |
|---|-------|--------------|----------------|
| LI-14 | `status` | `'closed'` | `err.errors.status` exists |

<a id="li-length-format"></a>
**[LENGTH / FORMAT] String Sanitization & Trimming**

| # | Fields with Padding | Expected Result |
|---|--------------------|-----------------|
| LI-15 | `title`, `category`, `description`, `campusLocation` with leading/trailing spaces | ✅ Trimmed values stored |

<a id="user-model"></a>
### 1.3. User Model

**Test File:** `test/models/user.model.test.js`
**Model File:** `models/user.model.js`

**Note:** User model uses mocked DeakinSSO: `email` and `role` are the only fields with schema-level validation.

<a id="u-positive"></a>
**[POSITIVE] Valid Document Creation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| U-01 | Valid Deakin email `student@deakin.edu.au` | ✅ Passes validation |
| U-04 | `role` field omitted (default behaviour) | ✅ Defaults to `'user'` |
| U-05 | `role: 'admin'` explicitly set | ✅ Passes validation |

<a id="u-required"></a>
**[REQUIRED] Mandatory Field Validation**

| # | Field Removed | Expected Error |
|---|--------------|----------------|
| U-02 | `email` | `err.errors.email` exists |

<a id="u-length-format"></a>
**[LENGTH / FORMAT] Normalization & Sanitization**

| # | Input | Expected Stored Value |
|---|-------|-----------------------|
| U-03 | `'   TestUser@DEAKIN.EDU.AU   '` | `'testuser@deakin.edu.au'` (lowercased + trimmed) |

<a id="u-type-enum"></a>
**[TYPE & ENUM] Enumeration and Allowed Values**

| # | Field | Invalid Value | Expected Error |
|---|-------|--------------|----------------|
| U-06 | `role` | `'superadmin'` | `err.errors.role` exists |

---

<a id="help-models"></a>
### 1.4. Help Models

**Test Files:** `test/models/helpQuestion.model.test.js`, `test/models/helpReply.model.test.js`
**Model Files:** `models/helpQuestion.model.js`, `models/helpReply.model.js`

| Model | IDs | What is checked |
|-------|-----|-----------------|
| HelpQuestion | HQ-01 – HQ-13 | Valid question; defaults (`status: open`, `category: other`); required `ownerId`, `title`, `body`; trimming and lowercase category; title 5–150 and body 10–2000 characters; category and status enums; `ownerId` must be an ObjectId; timestamps |
| HelpReply | HR-01 – HR-09 | Valid reply; required `questionId`, `authorId`, `body`; trimming; body 2–1000 characters; ObjectId references; index on `{ questionId, createdAt }`; timestamps |

---

<a id="api-test-cases"></a>
## 2. API Test Cases

<a id="login-flow-api"></a>
### 2.1. Login Flow (Auth API & Session)

> **Component:** Mock Login, Authentication & Session Handling
> **Note:** `User` schema validation itself is covered in [§1.3 User Model](#user-model) (`U-01`–`U-03`); the cases below are the auth *route/session* behaviour built on top of it.

**Automated Test File:** `test/routes/auth.routes.test.js` (`TC-AUTH-04`–`TC-AUTH-12`)
**Route File:** `routes/auth.routes.js`
**Frontend:** `public/index.html` — login form (`#login-form`) wired to `POST /api/auth/login` via `public/js/login.js`; redirects to `browse.html` on success, displays error in `#login-message` on failure.

| ID | Test Name | SIT725 Category | Objective | Preconditions | Steps | Expected Results | Actual Results | Pass/Fail |
|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **TC-AUTH-04** | Login Flow - Valid Test Credentials | `AUTHENTICATION` | Verify user can log in with a mock test account via the wired login form. | 1. Server running at `http://localhost:3000`.<br>2. User navigates to `index.html`. | 1. Enter a registered test email in `#email`.<br>2. Click "Continue with Deakin SSO".<br>3. `login.js` POSTs `{ email }` to `POST /api/auth/login`. | 1. API returns 200 and sets a session cookie.<br>2. Browser redirects to `browse.html`. | Pass | Pass |
| **TC-AUTH-05** | Login Flow - Invalid Credentials | `AUTHENTICATION` | Verify appropriate error feedback when an unregistered or empty email is submitted. | 1. Server running at `http://localhost:3000`.<br>2. User navigates to `index.html`. | 1. Enter an unrecognized or empty email in `#email`.<br>2. Click "Continue with Deakin SSO". | 1. API returns 401/400.<br>2. Error message is shown in `#login-message`.<br>3. User remains on `index.html` (no session created). | Pass | Pass |
| **TC-AUTH-06** | Session Persistence - Current User Identity | `SESSION` | Verify that active session preserves user identity across page refreshes. | 1. User is logged in. | 1. Refresh page or navigate between `/browse.html` and `/report.html`. | 1. Header displays current user identity / avatar.<br>2. User is not asked to re-login. | Pass | Pass |
| **TC-AUTH-07** | Protected Routes - Unauthenticated Redirect | `SECURITY` | Verify that restricted actions/pages require active login session. | 1. User is NOT logged in. | 1. Attempt to access authenticated action (e.g. submit report or `/my-reports.html`). | 1. User is prompted to log in or redirected to login view. | Pass | Pass |
| **TC-AUTH-08** | Sign-out - Session Clearing | `SESSION` | Verify that signing out completely clears the user session. | 1. User is currently logged in. | 1. Click "Sign Out". | 1. Active session is destroyed.<br>2. Header updates to unauthenticated state. | Pass | Pass |

**[SESSION] Stale Session Handling**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-AUTH-09 | Session user is deleted from the database mid-session, then `GET /api/auth/me` is called | 401, `"User was not found."`; a follow-up request returns 401, `"Authentication is required."` |

**[ERROR HANDLING] Database & Session Store Failures**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-AUTH-10 | `User.findOne` throws during login | 500, `"Unable to log in."` |
| TC-AUTH-11 | `User.findById` throws while fetching the current user | 500, `"Unable to get the current user."` |
| TC-AUTH-12 | Session store fails to destroy on logout | 500, `"Unable to log out."` |

---

<a id="api-create-report"></a>
### 2.2. Create Report

**Test File:** `test/routes/items.routes.test.js`
**Route File:** `routes/items.routes.js`
**Scope:** `POST /api/items` — Mongo-backed; requires an authenticated session (`requireAuth` middleware).
**Auth pattern:** `request.agent(app)` → `POST /api/auth/login` → carry session cookie on subsequent requests.

**⚠️ Known gaps:**
- Photo upload is JSON-only (URL strings). No multipart/file-upload support until a dedicated upload endpoint lands (Trello #66/#74).

**[POSITIVE] Valid Report Creation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-CREATE-01 | Valid `found` report (`handoverMethod: email`) — authenticated | ✅ 201, `res.body.report._id` exists, `contactMethod: "email"`, `status: "active"` |
| TC-API-CREATE-02 | Valid `lost` report — authenticated | ✅ 201, `res.body.report._id` exists, `status: "active"` |

**[REQUIRED] Mandatory Field Validation**

| # | Field Missing | Expected Result |
|---|--------------|-----------------|
| TC-API-CREATE-03-type | `type` | 400, `"All required fields must be provided."` |
| TC-API-CREATE-03-title | `title` | 400, same message |
| TC-API-CREATE-03-category | `category` | 400, same message |
| TC-API-CREATE-03-date | `date` | 400, same message |
| TC-API-CREATE-03-location | `location` | 400, same message |
| TC-API-CREATE-03-description | `description` | 400, same message |
| TC-API-CREATE-04 | All fields (empty body `{}`) | 400, same message |

**[TYPE & ENUM] Report Type Validation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-CREATE-03-type | `type: "misplaced"` (invalid enum) | 400, `'Type must be either "lost" or "found".'` |

**[TEMPORAL] Date Validation**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-CREATE-05 | `date: "2099-01-01"` (future) | 400, `"Report date cannot be in the future."` |
| TC-API-CREATE-06 | `date: "not-a-date"` (invalid format) | 400, `"A valid date must be provided."` |

**[CONDITIONAL] Found-Item Handover Logic**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-CREATE-07 | `found` report — `handoverMethod` omitted | 400, `'Found items must provide handoverMethod as "email" or "dropoff".'` |
| TC-API-CREATE-08 | `found` report — `handoverMethod: "phone"` (invalid) | 400, same message |
| TC-API-CREATE-09 | `found` + `handoverMethod: "dropoff"` — `collectionLocation` omitted | 400, `"collectionLocation is required when handoverMethod is dropoff."` |
| TC-API-CREATE-08b | `found` + `handoverMethod: "dropoff"` + valid `collectionLocation` | ✅ 201, `contactMethod: "collection"`, `collectionLocation` stored |

**[AUTHENTICATION] Auth-Gated Access**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-CREATE-10 | `POST /api/items` with no session cookie | 401, `"Authentication is required."` |

**[BOUNDARY] Photo Array Constraints**

| # | Photos | Expected Result |
|---|--------|-----------------|
| TC-API-CREATE-11 | 3 photos (maximum allowed) | ✅ 201, `res.body.report.photos` has length 3 |
| TC-API-CREATE-12 | 4 photos (exceeds limit) | 400 (Mongoose `ValidationError`) |

---

<a id="api-get-reports"></a>
### 2.3. Browse / Get Reports

**Test File:** `test/routes/items.routes.test.js`
**Route File:** `routes/items.routes.js`
**Scope:** `GET /api/items` and `GET /api/items/counts` — Mongo-backed (card #22), no authentication required.

**[POSITIVE] Active Report Listing**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-01 | `type=all` | ✅ 200, combined found+lost active reports, each item has `id`, `type`, `title`, `category`, `location`, `date`, `photos`, `status` |
| TC-API-GET-02 | No `type` query param | ✅ 200, defaults to `all` (same as above) |
| TC-API-GET-03 | `type=found` | ✅ 200, only `found` reports |
| TC-API-GET-04 | `type=lost` | ✅ 200, only `lost` reports |

**[TYPE & ENUM] Unrecognised Type Query**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-05 | `type=misplaced` (not `all`/`found`/`lost`) | 200, `[]` — neither the found nor lost query branch runs |

**[CONDITIONAL] Active-Status Filtering**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-06 | Report inserted directly with no `status` field | ✅ Treated as `status: "active"` and included |
| TC-API-GET-07 | Report with `status: "resolved"` | Excluded from results |

**[POSITIVE] Sorting**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-08 | `sort=newest` | ✅ Items ordered by date, most recent first |
| TC-API-GET-09 | `sort=oldest` | ✅ Items ordered by date, oldest first |

**[BOUNDARY] Pagination**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-10 | `page=1&limit=2` (3 active items total) | ✅ `{ total: 3, page: 1, totalPages: 2 }`, `items` length 2 |
| TC-API-GET-11 | `page=2&limit=2` | ✅ `items` length 1 (remainder) |
| TC-API-GET-12 | `page=5&limit=2` (beyond last page) | ✅ `items: []`, `total`/`totalPages` still correct |
| TC-API-GET-13 | `page=abc&limit=xyz` (non-numeric) | ✅ Falls back to `page: 1`, `limit: 12` |

**[ERROR HANDLING] Database Failures**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-GET-14 | `FoundItem.find` throws | 500, `"Unable to get items."` |

**[POSITIVE] Report Counts**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-COUNTS-01 | `GET /api/items/counts` | ✅ 200, `{ all, found, lost }` counts active reports only, excludes `resolved` |

**[ERROR HANDLING] Database Failures — Counts**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-API-COUNTS-02 | `FoundItem.countDocuments` throws | 500, `"Unable to get item counts."` |

---

<a id="admin-authorization"></a>
### 2.4. Admin Authorization

**Test File:** `test/middleware/requireAdmin.middleware.test.js`
**Middleware File:** `middleware/requireAdmin.middleware.js`
**Scope:** Unit tests for the `requireAdmin` middleware, using hand-built mock `req`/`res`/`next` (no Supertest) with a real seeded `User` document for the role lookup.

**[SECURITY] Session & Role Authorization**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| TC-SEC-01 | Session user is the seeded `mock.user` (default role) | 403, `"Admin access is required."` |
| TC-SEC-02 | Session has expired (no `req.session.userId`); in the app `requireAuth` returns 401 first | 403, `"Admin access is required."` |
| TC-SEC-03 | Session user exists, `role: "admin"` | Calls `next()` with no arguments, `res` untouched |

---

<a id="help-api"></a>
### 2.5. Help Page API

**Test Files:** `test/routes/help.routes.test.js`, `test/routes/help-auth.routes.test.js`
**Route / Service Files:** `routes/help.routes.js`, `services/help.service.js`
**Scope:** Supertest against `/api/help` with seeded users (`alice` and `bob` are students, `admin.test` is an admin). Requires a local MongoDB.

**[AUTHENTICATION] & [POSITIVE] CRUD — `help.routes.test.js`**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| HELP-01 | Every Help endpoint without a session | 401 on all six endpoints, nothing saved |
| HELP-02 | `POST /questions` with valid data | 201, owner taken from the session, `status: open` |
| HELP-03 | `POST /questions` without `category` | ✅ Defaults to `other` |
| HELP-04 | Missing/short/invalid fields, non-text title, `status` or `ownerId` in the body | 400, nothing saved |
| HELP-05 | `GET /questions` | ✅ Only the current user's questions, newest first |
| HELP-06 | `GET /questions` with no questions | ✅ `questions: []` |
| HELP-07 | `GET /questions/:id` | ✅ Question with replies, oldest first |
| HELP-08 | Invalid ID / missing question | 400 / 404 |
| HELP-09 | `PUT /questions/:id` title, body, category | ✅ 200, trimmed values saved |
| HELP-10 | Empty body, short title, `status` or `ownerId` in the update | 400, question unchanged |
| HELP-11 | `PUT` a missing question | 404 |
| HELP-12 | `DELETE /questions/:id` | ✅ Question and its replies removed |
| HELP-13 | `DELETE` a missing question | 404 |
| HELP-14 | `POST /questions/:id/replies` | ✅ 201, author taken from the session, body trimmed |
| HELP-15 | Empty/short reply, `authorId` in the body, missing question | 400 / 404, nothing saved |

**[SECURITY] & [SESSION] Owner and admin rules — `help-auth.routes.test.js`**

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| HELP-AUTH-01 | Session whose user was deleted | 401 |
| HELP-AUTH-02 | Another student views, edits, deletes or replies to a question | 403, question and replies unchanged |
| HELP-AUTH-03 | Another student requests a missing question | 404 (existence checked before access) |
| HELP-AUTH-04 | Admin views a student's question | ✅ 200 |
| HELP-AUTH-05 | Admin edits a student's question | 403, wording unchanged |
| HELP-AUTH-06 | Admin deletes a student's question | ✅ Question and replies removed |
| HELP-AUTH-07 | Admin replies | ✅ Question becomes `answered` |
| HELP-AUTH-08 | Owner replies after an admin reply | ✅ Question goes back to `open` |
| HELP-AUTH-09 | Admin `GET /questions?scope=all` | ✅ Every student's questions; admin's own list is empty |
| HELP-AUTH-10 | Student uses `scope=all`; unknown scope | 403; 400 |

---

<a id="integration-ui-test-cases"></a>
## 3. Integration & UI Test Cases

> **Component:** Report Submission & Browse — end-to-end browser flows.
> **Status:** Manual only — no browser-automation file exists yet (no Cypress/E2E runner in this project).

| ID | Test Name | SIT725 Category | Objective | Preconditions | Steps | Expected Results | Actual Results | Pass/Fail |
|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **TC-CV-12** | Create Report UI - Form Submission | `INTEGRATION` | Verify user can fill and submit a new report from the web interface. | 1. Server running at `http://localhost:3000`.<br>2. User on `/report.html`. | 1. Fill title, category, date, location, description.<br>2. Click "Submit Report". | 1. Success confirmation is displayed.<br>2. New item is posted to backend. | Pass | Pass |
| **TC-CV-13** | View Reports UI - Browse Active Items | `UI` | Verify that browse page renders all active reported items with tags and photos. | 1. Server running.<br>2. User on `/browse.html`. | 1. Open `/browse.html`.<br>2. Check displayed cards. | 1. Active items list is displayed.<br>2. Cards show title, category, location, date, and thumbnail photo. | Pass | Pass |
| **TC-CV-14** | View Reports UI - Filter & Search | `UI` | Verify that search keywords and category filters correctly filter the items list. | 1. `/browse.html` open with sample items loaded. | 1. Enter keyword in search input.<br>2. Select category dropdown filter. | 1. Item list updates instantly to only match the keyword and category. | Pass | Pass |


<a id="help-integration"></a>
### 3.1. Help Page CRUD Flows

**Automated — `test/integration/help-crud.integration.test.js`** (card #120, requires a local MongoDB)

| # | Test Description | Expected Result |
|---|-----------------|-----------------|
| HELP-INT-01 | A student creates a question, updates it, the admin sees it in `scope=all` and replies, the student follows up, then deletes it | ✅ Status goes `open` → `answered` → `open`; replies listed oldest first with the right authors; after delete the question and replies are gone for both users |
| HELP-INT-02 | Log out and log back in after an admin reply | ✅ 401 while logged out; after login the question is still `answered` with its reply |
| HELP-INT-03 | Another student tries every action on the question; the admin then deletes it | 403 for every action by the other student; after the admin delete the owner gets 404 and an empty list |

**Manual — Help page UI** (`/help.html`, run with `npm run seed` and `npm run start`)

| ID | Test Name | SIT725 Category | Objective | Preconditions | Steps | Expected Results | Actual Results | Pass/Fail |
|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **TC-HELP-UI-01** | FAQ search and filter | `UI` | Verify the FAQ can be searched and filtered. | Open `/help.html`. | 1. Type "photo".<br>2. Click the "Managing" chip.<br>3. Type "zzz". | 1. Only matching FAQs show.<br>2. Only Managing FAQs show.<br>3. "No questions match your search" is shown. | | |
| **TC-HELP-UI-02** | Logged-out state | `SECURITY` | Verify logged-out users cannot ask questions. | Not logged in. | Open `/help.html`. | Form is disabled, a log-in prompt is shown, "Log in to see your questions." | | |
| **TC-HELP-UI-03** | Create question | `INTEGRATION` | Verify a student can ask a question. | Logged in as `mock.user@deakin.edu.au`. | 1. Submit title "Help".<br>2. Submit a valid title, question and category. | 1. "Title must be at least 5 characters."<br>2. Success message; question appears in My questions as **Open** with date and time. | | |
| **TC-HELP-UI-04** | Update question | `INTEGRATION` | Verify the owner can edit a question. | TC-HELP-UI-03 done. | 1. Open the question, click **Edit**.<br>2. Change title and category, click **Save changes**.<br>3. Refresh the page. | Updated title and category are shown and still there after refresh. | | |
| **TC-HELP-UI-05** | Admin reads and replies | `INTEGRATION` | Verify an admin can see and answer student questions. | Logged in as `admin.mock@deakin.edu.au`. | 1. Open `/help.html`.<br>2. Open the student's question and send a reply. | 1. Heading is "All questions", the Ask form is hidden, the sender's email is shown, no Edit button.<br>2. Reply appears as **You**; status becomes **Answered**. | | |
| **TC-HELP-UI-06** | Student follow-up | `INTEGRATION` | Verify the student sees the reply and can follow up. | TC-HELP-UI-05 done; log in as the student. | 1. Open the question.<br>2. Send a follow-up. | 1. Admin reply is labelled **Admin**; status **Answered**.<br>2. Follow-up labelled **You**; status back to **Open**. | | |
| **TC-HELP-UI-07** | Delete question | `INTEGRATION` | Verify owner and admin can delete. | A question exists. | 1. As the student, click **Delete** and cancel.<br>2. Click **Delete** and confirm. | 1. Nothing changes.<br>2. Question disappears; list shows "You have not asked any questions yet." The admin no longer sees it. | | |
| **TC-HELP-UI-08** | Access between students | `SECURITY` | Verify students only see their own questions. | Questions from two different students. | Log in as each student and open `/help.html`. | Each student sees only their own questions. | | |

> TC-HELP-UI-02 to 08 need the Help page to be connected to the API (Help connect PR). Fill in **Actual Results** and **Pass/Fail** when running them.

---

<a id="summary"></a>
## 4. Summary

| Model | Tests | POSITIVE | REQUIRED | TEMPORAL | BOUNDARY | TYPE & ENUM | CONDITIONAL | LENGTH/FORMAT |
|-------|-------|----------|----------|----------|----------|-------------|-------------|---------------|
| FoundItem | 20 | 4 | 6 | 2 | 3 | 2 | 2 | 1 |
| LostItem | 15 | 3 | 5 | 2 | 3 | 1 | — | 1 |
| User | 6 | 3 | 1 | — | — | 1 | — | 1 |
| **Total** | **41** | **10** | **12** | **4** | **6** | **4** | **2** | **3** |

> **Note:** In addition to the 41 model unit tests above ([§1](#model-unit-test-cases)):
> - `test/routes/auth.routes.test.js` adds 10 automated API/session tests (`TC-AUTH-04`–`TC-AUTH-12`, see [§2.1](#login-flow-api), requires a local MongoDB).
> - `test/routes/items.routes.test.js` adds 14 automated API tests (`TC-API-GET-01`–`14`, `TC-API-COUNTS-01`–`02`, see [§2.3](#api-get-reports), requires a local MongoDB) for the Mongo-backed `GET /api/items`/`GET /api/items/counts` endpoints (card #22). The `TC-API-CREATE-01`–`12` tests (see [§2.2](#api-create-report)) for `POST /api/items` are on the still-open card #49 branch and are not yet part of this count.
> - `test/middleware/requireAdmin.middleware.test.js` adds 3 automated unit tests (`TC-SEC-01`–`03`, see [§2.4](#admin-authorization), requires a local MongoDB) for the `requireAdmin` middleware (card #109).
> - `TC-CV-12`–`14` ([§3](#integration-ui-test-cases)) are manual/browser-only and have no automated count.
> - Help page (cards #117–#120): 22 model tests (`HQ`, `HR`, [§1.4](#help-models)), 25 API tests (`HELP`, `HELP-AUTH`, [§2.5](#help-api)) and 3 integration tests (`HELP-INT`, [§3.1](#help-integration)). `TC-HELP-UI-01`–`08` are manual.
>
> Total: 120 automated tests when every suite under `test/` runs together (`npm test`): models 41, routes 57, integration 13, middleware 3, public 6. There is currently no CI workflow running `npm test` — see [§5 Running the Tests](#running-the-tests) for local setup.

---

<a id="running-the-tests"></a>
## 5. Running the Tests

**Model unit tests** (`test/models/`) have no external dependencies and always run.

**API/session tests** (`test/routes/`) connect to a real MongoDB instance and require one-time setup:

```bash
# 1. Copy the test env template and fill in a dedicated test database
cp .env.test.example .env.test

# 2. Start a local MongoDB (must be listening on the MONGODB_URI in .env.test)
```

Without a reachable MongoDB, `npm test` fails immediately with `ECONNREFUSED 127.0.0.1:27017`.
`server.js` also requires `SESSION_SECRET` at import time and `test/helpers/db.js` connects before any test runs, so this affects the whole suite, not just the API tests.

```bash
# Run all tests (model unit + API/session)
npm test

# Run with code coverage report
npm run test:coverage
```

Coverage is configured via `.nycrc.json` to report on `models/`, `controllers/`, `routes/`, `services/`, and `server.js`. Only `models/` is currently at 100% coverage as `routes/auth.routes.js` and `server.js` include error-handling branches and the app-bootstrap block that aren't exercised by the current suite.
