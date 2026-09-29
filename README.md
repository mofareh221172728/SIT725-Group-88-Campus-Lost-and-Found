# Campus Lost and Found System

## Project Overview

The **Campus Lost and Found System** is a web application developed for Deakin University students and staff to report, track, search, and recover lost property across campus.

This project was built for **SIT725 Applied Software Engineering** by **Group 88**. Full requirements, user stories, use cases, and system specifications are documented in the Software Requirements Specification (SRS) document.

- **Trello Board**: [Public Trello Board](https://trello.com/b/KD93aCEN/sit725-group-88-project)

## Team Members and Roles

| Team Member | Primary Roles | Sprint 2 Focus Areas |
| :--- | :--- | :--- |
| **Max Andres Guzman Aceituno** | Scrum Master & Frontend Developer (Forms) | Sprint coordination, date sorting & pagination (PR #72), photo dropzone (PR #73), photo lightbox viewer (PR #74), duplicate report warnings (PR #86), mark item as resolved toggle (PR #84), final README documentation (Card #39) |
| **Mofareh Mubarak M Almakhalas** | SRS, Documentation & Backend Developer | Search & filter API (PR #58) & UI (PR #61, PR #70), edit item form preview (PR #62), owner resolve API (PR #63), My Reports dashboard (PR #69) |
| **Reza Tisa Adi Pratama** | UI/UX Designer & Frontend Developer | Help UI & FAQ (PR #75, PR #81), Help database schema (PR #76), Help CRUD API & authorization (PR #79, PR #80), reusable UI fallback states & 404 page (PR #82), Help CRUD integration tests (PR #83) |
| **Gulireba Maierdan** | Frontend & API Integration Engineer | Report update API (PR #67), frontend API client methods, report creation and active listing integration, input validation checks |
| **Kuan-Ting Chen** | Backend & Database Engineer | Item details page & API (PR #64), owner-authorized report updates (PR #67), photo storage service & binary routes (PR #71), Playwright E2E automated test suite (PR #90) |
| **Yuen Yi Cheng (Betty)** | Test & Quality Assurance Engineer | User model role field & seed updates (PR #59), `requireAdmin` middleware & unit tests (PR #60, PR #66), admin panel layout (PR #65), admin stale-count and bulk-action endpoints & tests (PR #68), role-based navigation guards (PR #88), admin endpoint documentation (PR #89) |

## System Architecture

The application implements a classic **three-tier architecture** with separation of concerns across the presentation, application, and persistence layers:

1. **Presentation Layer (`public/`)**: Built with responsive semantic HTML5, custom vanilla CSS design tokens, and modular vanilla JavaScript. Pages communicate with backend APIs via a unified fetch client (`api.js`) that automatically transmits HTTP-only session cookies and parses JSON payloads and errors.
2. **Application Layer (`routes/`, `services/`, `middleware/`)**: Built on Node.js and Express. HTTP request handling and route definitions are decoupled from domain business logic through dedicated service modules. Access is secured using role-based session middleware (`requireAuth` and `requireAdmin`).
3. **Persistence Layer (`models/`)**: Structured MongoDB document storage using Mongoose schemas. Distinct schemas for `FoundItem` and `LostItem` provide strict validation for report-type specific rules (such as drop-off collection locations vs. direct email contact) while exposing uniform data models to the frontend.

## Project Structure

```text
├── public/                     # Frontend client pages, scripts, and styles
│   ├── 404.html                # Friendly custom 404 not found page
│   ├── admin.html              # Administrator stale reports & bulk resolution panel
│   ├── browse.html             # Main report browsing grid with tabs and sorting
│   ├── edit-report.html        # Owner report editing and resolution interface
│   ├── help.html               # Help desk, FAQ, and question/reply threads
│   ├── index.html              # Mock login landing page
│   ├── item-detail.html        # Detailed report view with photo lightbox & matches
│   ├── my-reports.html         # User dashboard displaying owned reports
│   ├── report.html             # Report submission form with duplicate warning
│   ├── search-filter.html      # Multi-criteria search and filter interface
│   ├── css/                    # Modular stylesheets (style, report, help, ui-state, etc.)
│   └── js/                     # Client scripts (api, browse, report-form, help, ui-state, etc.)
├── models/                     # Mongoose database models
│   ├── foundItem.model.js      # Schema for found property reports
│   ├── helpQuestion.model.js   # Schema for help desk questions
│   ├── helpReply.model.js      # Schema for question replies
│   ├── lostItem.model.js       # Schema for lost property reports
│   ├── photo.model.js          # Schema for binary photo data and mime types
│   └── user.model.js           # Schema for user accounts and roles
├── routes/                     # Express REST API routes
│   ├── admin.routes.js         # Stale count, stale listing, and bulk-resolve endpoints
│   ├── auth.routes.js          # Login, current session user, and logout endpoints
│   ├── help.routes.js          # Help question and reply CRUD endpoints
│   ├── items.routes.js         # Item reporting, filtering, pagination, edit, and status
│   └── photos.routes.js        # Binary image retrieval endpoint
├── services/                   # Business and domain logic layer
│   ├── admin.service.js        # Stale report calculations and bulk resolution
│   ├── auth.service.js         # Authentication helpers
│   ├── help.service.js         # Help question and reply access rules and actions
│   ├── items.service.js        # Item queries, search filters, pagination, and updates
│   ├── photos.service.js       # Photo storage, retrieval, and deletion
│   └── report-status.service.js# Owner-only report resolution logic
├── middleware/                 # Express middleware
│   ├── auth.middleware.js      # Requires an active user session (HTTP 401)
│   └── requireAdmin.middleware.js # Requires an admin role (HTTP 403)
├── scripts/                    # Automation and seed scripts
│   ├── seed.js                 # Database seed script for development and testing
│   └── seed-sample-items.js    # Fixture generator for sample reports
├── data/                       # Static assets and sample image lists
├── test/                       # Comprehensive automated test suite
│   ├── e2e/                    # Playwright end-to-end browser tests
│   ├── helpers/                # Test database connection and cleanup utilities
│   ├── integration/            # Supertest API and database integration tests
│   ├── middleware/             # Unit tests for middleware
│   ├── models/                 # Unit tests for Mongoose schema validation
│   ├── public/                 # Headless unit tests for client-side JavaScript
│   ├── routes/                 # Supertest route behavior and failure tests
│   └── services/               # Unit tests for business logic services
├── docs/                       # Project specifications and QA documentation
│   ├── test-cases.md           # Formal test case catalog
│   ├── e2e-test-results.md     # Recorded Playwright E2E execution log
│   └── sprint2-features-vs-sprint1.md # Slide-ready comparison against Sprint 1
├── server.js                   # Main application entry point and Express configuration
├── preflight-check.js          # Environment, database, and seed integrity validator
├── playwright.config.js        # Playwright E2E test runner configuration
└── package.json                # Project dependencies, scripts, and engine metadata
```

## Environment Variables

The project uses `dotenv` to manage configurations. Two distinct configuration files are required: `.env` for development and `.env.test` for automated testing.

### Development Environment (`.env`)

Create `.env` in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/sit725-group-88
SESSION_SECRET=replace-with-a-long-random-secret
```

### Test Environment (`.env.test`)

Create `.env.test` in the project root. **Note: Tests will drop the test database between runs.**

```env
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/sit725-group-88-test
SESSION_SECRET=test-session-secret
```

### Variable Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` (dev) / `3001` (test) | The HTTP port the Express server listens on. |
| `MONGODB_URI` | Yes | — | MongoDB connection string. Must point to a separate database containing `test` for `.env.test`. |
| `SESSION_SECRET`| Yes | — | Cryptographic secret used by `express-session` to sign session cookies. |
| `NODE_ENV` | In test | `development` | Set to `test` during test runs to enable test assertions and database guards. |

> **Safety Guard**: The test suite includes a safety check that rejects any `MONGODB_URI` that does not contain the word `test`. This guarantees that unit and integration tests never clear or drop your development database.

## Mock Test Accounts

The current release uses mock Deakin accounts to simulate authentication without requiring live external SSO infrastructure. Passwords are not verified during mock login, only the registered Deakin email address is checked.

| Email Address | Role | Privileges & Test Purpose |
| :--- | :--- | :--- |
| `mock.user@deakin.edu.au` | `student` (default) | Standard student account. Can submit lost/found reports, view and edit their own reports in My Reports, resolve their own reports, and post questions on the Help page. Cannot access `/admin.html` or administrative endpoints. |
| `admin.mock@deakin.edu.au`| `admin` | Administrator account. Has all student privileges plus access to `/admin.html`, the stale report count, bulk resolution of reports older than 90 days, and full moderation/reply capabilities on the Help desk. |

## Implemented REST API Endpoints

All application routes exchange data formatted as JSON over HTTP/HTTPS.

### 1. Authentication (`/api/auth`)

| Method & Path | Auth Required | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | No | `{ "email": "mock.user@deakin.edu.au" }` | Authenticates a seeded email, creates a session, and sets a session cookie. |
| `GET /api/auth/me` | Yes (`requireAuth`) | None | Returns the authenticated user's `{ id, email, role }`. |
| `POST /api/auth/logout` | Yes (`requireAuth`) | None | Destroys the current server session and clears the session cookie. |

### 2. Item & Report Management (`/api/items`)

| Method & Path | Auth Required | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/items` | No | Query: `type`, `sort`, `page`, `limit`, `keyword`, `category`, `location`, `fromDate`, `toDate` | Retrieves active reports matching filter criteria. Returns paginated object `{ items, total, page, totalPages }` when `page` is provided, or an array of items. |
| `GET /api/items/counts` | No | None | Returns `{ all, found, lost }` count of active items in the system. |
| `GET /api/items/:id` | No | Query: `type=found\|lost` | Retrieves full details for an active report. Populates contact email or collection location for found items. Returns 404 for resolved items. |
| `POST /api/items` | Yes (`requireAuth`) | JSON: `{ type, title, category, description, date, location, handoverMethod?, collectionLocation?, photos? }` | Creates a new lost or found report bound to the authenticated user ID. |
| `GET /api/items/mine` | Yes (`requireAuth`) | None | Retrieves all reports (both active and resolved) owned by the current user, organized as `{ found: [...], lost: [...] }`. |
| `GET /api/items/:type/:id/edit` | Yes (`requireAuth`) | Route params: `type`, `id` | Fetches active report details specifically formatted for the prefilled edit form. Enforces owner verification (403 for non-owners). |
| `PUT /api/items/:type/:id` | Yes (`requireAuth`) | JSON with editable fields: `title`, `category`, `description`, `date`, `location`, `handoverMethod`, `collectionLocation` | Updates report fields with server-side validation. Restricted strictly to the active report owner. |
| `PUT /api/items/:type/:id/status` | Yes (`requireAuth`) | JSON: `{ "status": "resolved" }` | Marks an active report as resolved. Restricted strictly to the report owner. |

### 3. Binary Photos (`/api/photos`)

| Method & Path | Auth Required | Description |
| :--- | :--- | :--- |
| `GET /api/photos/:id` | No | Streams the binary JPEG/PNG image data stored in MongoDB with correct `Content-Type` and `X-Content-Type-Options: nosniff`. |

### 4. Administrator Governance (`/api/admin`)

*All `/api/admin` routes are protected by both `requireAuth` and `requireAdmin` middleware. Non-admin sessions receive HTTP 403 Forbidden.*

| Method & Path | Role Required | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/admin/reports/stale-count` | `admin` | None | Returns `{ count }` of active reports submitted more than 90 days ago based on `createdAt`. |
| `GET /api/admin/reports/stale` | `admin` | None | Returns `{ reports: [...] }` list of all stale reports, sorted oldest first. |
| `POST /api/admin/reports/bulk-actions` | `admin` | `{ "action": "resolve-stale" }` | Bulk resolves all active reports older than 90 days and returns `{ count }` of updated documents. |

### 5. Help Desk & FAQ (`/api/help`)

*All Help routes require an active authenticated session.*

| Method & Path | Role / Owner Rule | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/help/questions` | Any student / Admin | Query: `?scope=all` (admin only) | Returns user's own questions. If called by an admin with `?scope=all`, returns all user questions. |
| `POST /api/help/questions` | Authenticated user | `{ "title", "body", "category" }` | Submits a new Help question. |
| `GET /api/help/questions/:id` | Owner or Admin | None | Retrieves question details and conversation thread replies. Non-owners receive 403. |
| `PUT /api/help/questions/:id` | Owner only | `{ "title", "body", "category" }` | Edits an existing question before or after resolution. |
| `DELETE /api/help/questions/:id` | Owner or Admin | None | Deletes a question and cascades removal of associated replies. Admins use this for moderation. |
| `POST /api/help/questions/:id/replies` | Owner or Admin | `{ "body" }` | Adds a reply to the question thread. When an admin replies, question status updates to `answered`. |

## How to Run the Application

### Prerequisites

Ensure you have installed:
- **Node.js**: v24.x or newer
- **MongoDB**: Community Server running locally at `localhost:27017`, or a remote MongoDB connection
- **Git**: For version control

### Step-by-Step Installation

#### 1. Clone the repository
```bash
git clone https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found.git
cd SIT725-Group-88-Campus-Lost-and-Found
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment files
Create `.env` for development and `.env.test` for tests:

**Windows (Command Prompt):**
```cmd
if not exist .env copy .env.example .env
if not exist .env.test copy .env.test.example .env.test
```

**macOS / Linux:**
```bash
cp -n .env.example .env
cp -n .env.test.example .env.test
```

Open `.env` and verify `MONGODB_URI` points to your development database (e.g., `mongodb://127.0.0.1:27017/sit725-group-88`).

#### 4. Seed the database & run preflight check
With MongoDB running, seed the mock users, sample reports, and stale data:
```bash
npm run seed
npm run preflight-check
```

The preflight check verifies database connectivity, user models, and minimum record counts. The expected output concludes with:
```text
✅ Preflight check passed.
```

#### 5. Start the application

**Development Mode (Recommended):**
```bash
npm run dev
```
*Runs the preflight check first and launches the server upon success.*

**Standard Start Mode:**
```bash
npm start
```
*Equivalent to `node server.js`.*

Expected console output:
```text
Connected to MongoDB
Server running at http://localhost:3000
```

### Application Access Points

Once running, access the application views in your browser:

- **Mock Login Page**: [http://localhost:3000/index.html](http://localhost:3000/index.html)  
  *Log in with `mock.user@deakin.edu.au` (student) or `admin.mock@deakin.edu.au` (admin).*
- **Browse Active Reports**: [http://localhost:3000/browse.html](http://localhost:3000/browse.html)  
  *Filter by Found/Lost/All, sort by date, and paginate through reports.*
- **Search & Filter**: [http://localhost:3000/search-filter.html](http://localhost:3000/search-filter.html)  
  *Search by keyword, category, campus location, and incident date range.*
- **Create Report**: [http://localhost:3000/report.html](http://localhost:3000/report.html)  
  *Submit lost or found reports with debounced duplicate warnings.*
- **My Reports Dashboard**: [http://localhost:3000/my-reports.html](http://localhost:3000/my-reports.html)  
  *View your active and resolved reports; quick access to edit and resolve.*
- **Admin Panel**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)  
  *View stale counts and preview/trigger bulk resolution of reports > 90 days (admin only).*
- **Help Desk & Q&A**: [http://localhost:3000/help.html](http://localhost:3000/help.html)  
  *Search FAQs, submit inquiries, edit questions, and manage threads.*

## How to Execute the Test Suite

The test suite provides three tiers of automated verification: unit tests for models and middleware, integration tests for API routes and database transactions, and end-to-end (E2E) browser tests using Playwright.

### 1. Run Unit & Integration Tests (Mocha + Chai + Supertest)
```bash
npm test
```
*Executes all unit, route, and integration tests against the isolated `.env.test` database.*

### 2. Run Test Coverage (nyc)
```bash
npm run test:coverage
```
*Outputs a terminal coverage table and generates an HTML report in `coverage/index.html`.*

To view the coverage report in your browser:
- **macOS**: `open coverage/index.html`
- **Windows**: `start "" "coverage\index.html"`
- **Linux**: `xdg-open coverage/index.html`

### 3. Run End-to-End Tests (Playwright)
Install the Chromium browser binary (one-time setup):
```bash
npx playwright install chromium
```

Run headless E2E tests:
```bash
npm run test:e2e
```

**Additional E2E options:**
- Watch test execution in a live browser window:
  ```bash
  npm run test:e2e:headed
  ```
- View the interactive HTML test report:
  ```bash
  npm run test:e2e:report
  ```

### 4. Run the Full Test Pipeline
Run both the Mocha suite and Playwright E2E suite consecutively:
```bash
npm run test:full
```

For detailed test case breakdowns and taxonomies, see [`docs/test-cases.md`](docs/test-cases.md). For the latest logged E2E execution results, see [`docs/e2e-test-results.md`](docs/e2e-test-results.md).

## Feature List

The system delivers a comprehensive lost and found management platform tailored for campus environments:

### 1. User Authentication & Sessions
- **Mock Campus Login**: Email-based authentication modeled after Deakin student credentials (`@deakin.edu.au`), removing external SSO dependencies while supporting role assignment.
- **Session Management**: Cookie-based sessions with `httpOnly` and `sameSite` security attributes.
- **Role Hierarchy**: Distinct permissions separating standard `student` accounts from elevated `admin` accounts.

### 2. Item Reporting
- **Dual Report Pathways**: Dedicated reporting interfaces for lost and found property.
- **Rich Incident Metadata**: Fields for title, category, incident date, campus, building, room/area, and detailed description.
- **Safe Handover Options**: Found reports allow the reporter to specify either a secure on-campus drop-off point (e.g., Campus Security, Student Central) or direct contact via Deakin email.
- **Multi-Photo Upload Dropzone**: Drag-and-drop file uploader supporting up to three JPEG or PNG images per report.
- **Duplicate Report Warning**: Real-time debounced checks that proactively warn users if similar active items already exist before they submit a report.

### 3. Browse, Search & Filtering
- **Live Active Feed**: Publicly viewable catalog of active lost and found items.
- **Type Filtering Tabs**: Quick toggling between `Found`, `Lost`, and `All` items with dynamic count badges.
- **Multi-Criteria Search**: Combined querying across title/description keywords, campus location, category, and incident date ranges (`fromDate` to `toDate`).
- **Date Ordering & Pagination**: Server-side sorting by newest or oldest report date with customizable page limits.
- **One-Click Reset**: Instant clearing of search and filter criteria to return to the default catalog.

### 4. Item Detail & Matching
- **Dedicated Detail View (`item-detail.html`)**: Complete incident records displaying full descriptions, campus locations, timestamps, and status badges.
- **Contact & Handover Disclosure**: Context-aware display of either campus security drop-off locations or the reporter's verified email.
- **Photo Lightbox Modal**: High-resolution image viewer for inspecting attached photos.
- **Potential Matches Engine**: Automatically queries and displays up to three active reports of the opposite type that share the same category and campus.

### 5. Personal Dashboard & Report Lifecycle (My Reports)
- **My Reports Dashboard (`my-reports.html`)**: Dedicated portal displaying all reports submitted by the logged-in user, clearly divided into active and resolved states.
- **Owner-Verified Editing (`edit-report.html`)**: Prefilled form enabling report owners to update details with strict ownership verification.
- **One-Click Resolution**: Report owners can mark active items as `Resolved` once returned, immediately archiving them from the public active feed.

### 6. Campus Administration & Bulk Actions
- **Role-Gated Access**: Strict `requireAdmin` middleware protecting administrative routes and actions.
- **Adaptive Navigation**: The Admin navigation link is hidden by default and only displayed for authenticated administrator sessions.
- **Stale Report Tracker**: Automatic detection of active reports created more than 90 days ago.
- **Bulk Resolution**: Administrative ability to preview and bulk-resolve eligible stale reports in a single confirmed operation with in-flight UI locking.

### 7. Interactive Help Desk & FAQs
- **Categorized FAQ Accordion**: Expandable answers to common lost property questions and campus procedures.
- **Two-Way Q&A Threads**: Authenticated students can create, view, edit, and delete their own inquiry questions.
- **Administrative Moderation**: Admins can view all inquiries (`?scope=all`), reply directly to questions (automatically updating their status to `answered`), and delete inappropriate posts.
- **Relative Timestamps**: Humanized time indicators (`just now`, `5m ago`, `2d ago`) for recent questions and replies.

### 8. User Experience, Resilience & Accessibility
- **Accessible Design System**: Semantic HTML5 and vanilla CSS design tokens compliant with WCAG 2.1 AA standards for keyboard navigation and contrast.
- **Centralized UI States**: Reusable state handler (`ui-state.js`) for uniform loading spinners, empty-state illustrations, and error alerts.
- **Custom 404 Routing**: Styled `404.html` page for missing pages and structured JSON error responses for invalid API routes.
- **Secure Photo Storage**: Dedicated binary photo storage endpoint (`/api/photos/:id`) with MIME validation and nosniff protection.
