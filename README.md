# Campus Lost and Found System

## Project Overview

The **Campus Lost and Found System** is a web application developed for Deakin University students and staff to report, track, search, and recover lost property across campus.

This project was built for **SIT725 Applied Software Engineering** by **Group 88**. Full requirements, user stories, use cases, and system specifications are documented in the SRS file.

- **Trello Board**: [Public Trello Board](https://trello.com/b/KD93aCEN/sit725-group-88-project)


## Team Members

| Team member | Main role |
| --- | --- |
| Max Andres Guzman Aceituno | Scrum Master and Frontend Developer (Forms) |
| Mofareh Mubarak M Almakhalas | SRS, Documentation and Backend Developer (Search and Filtering APIs) |
| Reza Tisa Adi Pratama | UI/UX Designer and Frontend Developer |
| Gulireba Maierdan | Frontend and API Integration Engineer |
| Kuan-Ting Chen | Backend and Database |
| Yuen Yi Cheng (Betty) | Test and Quality Assurance |

## Technologies Used

- HTML5 and CSS3
- JavaScript
- Node.js
- Express
- MongoDB and Mongoose
- dotenv for environment variables
- express-session for mock login sessions
- Mocha, Chai and Supertest for testing, with nyc for coverage
- Playwright for end-to-end browser testing
- Git and GitHub for version control
- Trello for Sprint planning

## Sprint 1 Features

- Express server connecting to MongoDB and serving static frontend files from `public/`.
- User, Found Item, and Lost Item models with MongoDB persistence across server restarts.
- Mock email login using Express session cookies.
- Create Report form with required-field, date, and input validation.
- Found-item handover choices for direct email contact or campus drop-off location.
- Browse page with active report cards, image rendering, Found/Lost/All tabs, counts, and pagination.
- API endpoints supporting report type filtering and newest-first date sorting.
- Automated model validation, session authentication, and item API tests.

## Sprint 2 Features

- Multi-criteria search and filter interface and API supporting keyword text queries, category, campus location, date range (`fromDate` to `toDate`), and pagination.
- Dedicated Item Detail page (`item-detail.html`) showing complete descriptions, campus/building/room locations, contact disclosure, and a photo lightbox viewer.
- My Reports dashboard (`my-reports.html`) displaying the authenticated user's active and resolved reports.
- Owner-verified report editing (`edit-report.html`) with prefilled forms and input validation.
- Report resolution workflow allowing the owner of an active report to mark it as resolved via `PUT /api/items/:type/:id/status`.
- Proactive duplicate report warning with real-time debouncing on the report creation form.
- Potential matches widget on the item detail page suggesting opposite-type active reports with matching category and campus.
- Role-based administration (`requireAdmin` middleware) with an Admin panel (`admin.html`) tracking stale reports older than 90 days and enabling bulk resolution.
- Role-gated navigation (`nav-admin.js`) revealing the Admin link only to verified administrator sessions.
- Interactive Help Desk (`help.html`) with expandable FAQ accordion, authenticated student question CRUD, and administrator reply threads.
- Help link on every page, in the top navigation and the mobile menu.
- Internal binary photo storage service and retrieval API (`/api/photos/:id`).
- Centralized UI state component (`ui-state.js` and `ui-state.css`) providing standardized loading spinners, empty states, and error alerts.
- Custom 404 page (`404.html`) and structured JSON error responses for unknown API endpoints.
- WCAG 2.1 AA accessibility audit with axe DevTools, Lighthouse and keyboard testing, with fixes for colour contrast, form labels, focus order and visible keyboard focus ([docs/accessibility-audit.md](docs/accessibility-audit.md)).
- Playwright end-to-end browser automation suite covering mock login and the complete active-to-resolved report lifecycle.
- Expansion of automated test suite to 293 unit and integration tests with >91% statement coverage.

## Project Structure

```text
public/             Frontend HTML, CSS and JavaScript
models/             Mongoose database models
routes/             Authentication, item, photo, admin and help API routes
services/           Authentication, items, admin, help and photo business logic
middleware/         Session authentication and admin authorization checks
scripts/            Development seed scripts
data/               Sample image URLs and assets used by the seed script
test/               Automated unit, integration, and E2E Playwright tests
docs/               Test specifications and project documentation
server.js           Express setup, sessions and MongoDB startup
preflight-check.js  Environment, database and seed-data checks
playwright.config.js Playwright E2E configuration
```

## System Architecture

The application implements a classic **three-tier architecture** with separation of concerns across the presentation, application, and persistence layers:

1. **Presentation Layer (`public/`)**: Built with responsive semantic HTML5, custom vanilla CSS design tokens, and modular vanilla JavaScript. Pages communicate with backend APIs via a unified fetch client (`api.js`) that automatically transmits HTTP-only session cookies and parses JSON payloads and errors.
2. **Application Layer (`routes/`, `services/`, `middleware/`)**: Built on Node.js and Express. HTTP request handling and route definitions are decoupled from domain business logic through dedicated service modules. Access is secured using role-based session middleware (`requireAuth` and `requireAdmin`).
3. **Persistence Layer (`models/`)**: Structured MongoDB document storage using Mongoose schemas. Distinct schemas for `FoundItem` and `LostItem` provide strict validation for report-type specific rules (such as drop-off collection locations vs. direct email contact) while exposing uniform data models to the frontend.

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

- Validation: title 5–150 characters, question 10–2000 characters, reply 2–1000 characters.
- Categories: `getting-started`, `reporting`, `finding`, `managing`, `other` (default).
- An admin reply sets the status to `answered`; a follow-up reply from the owner sets it back to `open`.

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

## Complete Feature List

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
- **Accessibility (WCAG 2.1 AA)**: Audited with axe DevTools, Lighthouse and keyboard-only testing. Fixed low colour contrast, unlabeled report form dropdowns, a double keyboard stop on the photo upload, and missing focus outlines on buttons. axe reports 0 issues on every page, and Lighthouse accessibility scores are 97–100. See [docs/accessibility-audit.md](docs/accessibility-audit.md).
- **Keyboard Navigation**: Every link, button and field can be reached with Tab and shows a visible focus outline; the mobile menu opens with Enter and closes with Esc.
- **Centralized UI States**: Reusable state handler (`ui-state.js`) for uniform loading spinners, empty-state illustrations, and error alerts.
- **Custom 404 Routing**: Styled `404.html` page for missing pages and structured JSON error responses for invalid API routes.
- **Secure Photo Storage**: Dedicated binary photo storage endpoint (`/api/photos/:id`) with MIME validation and nosniff protection.