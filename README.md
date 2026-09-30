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
- Multer for multipart/form-data photo uploads
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
- Dedicated Item Detail page (`item-detail.html`) showing complete descriptions, campus/building/room locations, contact disclosure, a photo lightbox viewer, and favourite toggle action.
- Item Favourites feature: authenticated users can bookmark items on the Item Detail page (`item-detail.html`) and filter saved favourites on the Browse catalog (`browse.html`), backed by `/api/favourites` endpoints and MongoDB persistence.
- My Reports dashboard (`my-reports.html`) displaying the authenticated user's active and resolved reports.
- Owner-verified report editing (`edit-report.html`) with prefilled forms and input validation.
- Report resolution workflow allowing the owner of an active report to mark it as resolved via `PUT /api/items/:type/:id/status`.
- Proactive duplicate report warning with real-time debouncing on the report creation form.
- Potential matches widget on the item detail page suggesting opposite-type active reports with matching category and campus.
- Role-based administration (`requireAdmin` middleware) with an Admin panel (`admin.html`) tracking stale reports older than 90 days and enabling bulk resolution of selected stale reports (or resolving all eligible stale reports if none are specified).
- Role-gated navigation and session controls (`nav-auth.js`) revealing the Admin link only to verified administrator sessions and providing sign-out functionality across pages.
- Interactive Help Desk (`help.html`) with expandable FAQ accordion, authenticated student question CRUD, and administrator reply threads.
- Help link on every page, in the top navigation and the mobile menu.
- Binary photo uploads and storage: multipart photo uploads (`multipart/form-data` with `photos` field) supporting up to 3 JPEG, PNG, or WebP images with a 5MB limit per image, stored in MongoDB with binary retrieval via `/api/photos/:id`.
- Centralized UI state component (`ui-state.js` and `ui-state.css`) providing standardized loading spinners, empty states, and error alerts.
- Custom 404 page (`404.html`) and structured JSON error responses for unknown API endpoints.
- WCAG 2.1 AA accessibility audit with axe DevTools, Lighthouse and keyboard testing, with fixes for colour contrast, form labels, focus order and visible keyboard focus ([docs/accessibility-audit.md](docs/accessibility-audit.md)).
- Playwright end-to-end browser automation suite covering mock login, search & filter, report create/view, edit/resolve, and the complete active-to-resolved report lifecycle (6 E2E suites).
- Expansion of automated test suite to 392 unit and integration tests with >91% statement coverage.

## Project Structure

```text
public/             Frontend HTML, CSS and JavaScript
models/             Mongoose database models (User, LostItem, FoundItem, Favourite, Photo, HelpQuestion, HelpReply)
routes/             Authentication, item, favourite, photo, admin and help API routes
services/           Authentication, items, favourites, admin, help and photo business logic
middleware/         Session authentication, admin authorization, and photo upload checks
scripts/            Development seed scripts
data/               Sample image URLs and assets used by the seed script
test/               Automated unit, integration, and E2E Playwright tests
docs/               Test specifications, audit reports, and project documentation
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
| `POST /api/items` | Yes (`requireAuth`) | `multipart/form-data` with text fields (`type`, `title`, `category`, `description`, `date`, `location`, `handoverMethod?`, `collectionLocation?`) and file field `photos` (up to 3 files; JPEG, PNG, or WebP; max 5MB per image); OR JSON: `{ type, title, category, description, date, location, handoverMethod?, collectionLocation?, photos?: [...] }` | Creates a new lost or found report bound to the authenticated user ID. Uploaded images in the `photos` field are validated (JPEG/PNG/WebP, ≤ 5MB each) and saved to binary storage, with URLs automatically attached to the created report. |
| `GET /api/items/mine` | Yes (`requireAuth`) | None | Retrieves all reports (both active and resolved) owned by the current user, organized as `{ found: [...], lost: [...] }`. |
| `GET /api/items/:type/:id/edit` | Yes (`requireAuth`) | Route params: `type`, `id` | Fetches active report details specifically formatted for the prefilled edit form. Enforces owner verification (403 for non-owners). |
| `PUT /api/items/:type/:id` | Yes (`requireAuth`) | JSON with editable fields: `title`, `category`, `description`, `date`, `location`, `handoverMethod`, `collectionLocation` | Updates report fields with server-side validation. Restricted strictly to the active report owner. |
| `PUT /api/items/:type/:id/status` | Yes (`requireAuth`) | JSON: `{ "status": "resolved" }` | Marks an active report as resolved. Restricted strictly to the report owner. |

### 3. Binary Photos (`/api/photos`)

| Method & Path | Auth Required | Description |
| :--- | :--- | :--- |
| `GET /api/photos/:id` | No | Streams binary JPEG, PNG, or WebP image data stored in MongoDB with correct `Content-Type` header and `X-Content-Type-Options: nosniff`. Returns HTTP 404 if the photo ID is not found. |

> **Photo Upload Specifications**:
> - **Upload Endpoint**: `POST /api/items`
> - **Content-Type**: `multipart/form-data`
> - **Field Name**: `photos` (supports multiple files, up to 3 images per report)
> - **Supported Formats**: JPEG (`image/jpeg`), PNG (`image/png`), and WebP (`image/webp`)
> - **File Size Limit**: Maximum 5MB (5,242,880 bytes) per image file
> - **Validation**: Invalid MIME types or files exceeding 5MB are rejected with HTTP 400. Successfully uploaded photos are stored in MongoDB with binary chunks and served at `/api/photos/:id`.

### 4. Favourites (`/api/favourites`)

*All `/api/favourites` routes require an active authenticated session (`requireAuth`). Unauthenticated requests receive HTTP 401 Unauthorized.*

| Method & Path | Auth Required | Request Body / Params | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/favourites` | Yes (`requireAuth`) | None | Retrieves all favourites for the authenticated user, returning `{ favourites: [...] }` populated with report details (`itemId`, `itemType`, `title`, `category`, `location`, `date`, `photos`, `status`). |
| `POST /api/favourites` | Yes (`requireAuth`) | JSON: `{ "itemId": "<ObjectId>", "itemType": "found" \| "lost" }` | Adds an active report to the user's favourites. Returns 201 `{ message: "Item added to favourites.", favourite }`. Returns 409 Conflict if already favourited, or 404 if report is not found. |
| `DELETE /api/favourites/:itemType/:itemId` | Yes (`requireAuth`) | Route params: `itemType` (`found`\|`lost`), `itemId` (`ObjectId`) | Removes an item from the authenticated user's favourites. Returns 200 `{ message: "Item removed from favourites." }`. Returns 404 if the favourite does not exist. |

### 5. Administrator Governance (`/api/admin`)

*All `/api/admin` routes are protected by both `requireAuth` and `requireAdmin` middleware. Non-admin sessions receive HTTP 403 Forbidden.*

| Method & Path | Role Required | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/admin/reports/stale-count` | `admin` | None | Returns `{ count }` of active reports submitted more than 90 days ago based on `createdAt`. |
| `GET /api/admin/reports/stale` | `admin` | None | Returns `{ reports: [...] }` list of all stale reports, sorted oldest first. |
| `POST /api/admin/reports/bulk-actions` | `admin` | JSON: `{ "action": "resolve-stale", "reports": [...] }` (selected) OR `{ "action": "resolve-stale" }` (all) | Resolves stale reports older than 90 days. If the `reports` list is provided, resolves only the selected reports; without it, the request resolves all eligible stale reports. Returns `{ count }` of updated documents. |

> **Admin Bulk Action Payloads**:
>
> - **Resolve selected stale reports**:
>   ```json
>   {
>     "action": "resolve-stale",
>     "reports": [
>       { "type": "lost", "id": "60d5ec49f1b2c8b1f8e4e1a1" },
>       { "type": "found", "id": "60d5ec49f1b2c8b1f8e4e1a2" }
>     ]
>   }
>   ```
> - **Resolve all eligible stale reports**:
>   ```json
>   {
>     "action": "resolve-stale"
>   }
>   ```
>   *(Without the `reports` list, the request resolves all eligible stale reports.)*

### 6. Help Desk & FAQ (`/api/help`)

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
  *Filter by Found/Lost/All, view saved Favourites, sort by date, and paginate through reports.*
- **Search & Filter**: [http://localhost:3000/search-filter.html](http://localhost:3000/search-filter.html)  
  *Search by keyword, category, campus location, and incident date range.*
- **Create Report**: [http://localhost:3000/report.html](http://localhost:3000/report.html)  
  *Submit lost or found reports with debounced duplicate warnings and multi-photo dropzone.*
- **Item Detail Page**: [http://localhost:3000/item-detail.html](http://localhost:3000/item-detail.html)  
  *View complete report descriptions, contact disclosure, photo lightbox viewer, and toggle favourites.*
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
*Executes all 392 unit, route, and integration tests against the isolated `.env.test` database.*

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
*Executes 6 Playwright E2E suites covering login, create-and-view, edit-and-resolve, search & filter, and report lifecycle.*

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
- **Sign-Out Control**: Global navigation sign-out button (`nav-auth.js`) clearing server sessions and resetting UI authentication state across pages.

### 2. Item Reporting
- **Dual Report Pathways**: Dedicated reporting interfaces for lost and found property.
- **Rich Incident Metadata**: Fields for title, category, incident date, campus, building, room/area, and detailed description.
- **Safe Handover Options**: Found reports allow the reporter to specify either a secure on-campus drop-off point (e.g., Campus Security, Student Central) or direct contact via Deakin email.
- **Multi-Photo Upload Dropzone**: Drag-and-drop file uploader supporting up to three JPEG, PNG, or WebP images per report (max 5MB limit per image) via `multipart/form-data` using the `photos` field.
- **Duplicate Report Warning**: Real-time debounced checks that proactively warn users if similar active items already exist before they submit a report.

### 3. Browse, Search & Filtering
- **Live Active Feed**: Publicly viewable catalog of active lost and found items.
- **Type Filtering Tabs**: Quick toggling between `Found`, `Lost`, and `All` items with dynamic count badges.
- **Favourites Catalog Filter**: Dedicated `Favourites` filter tab allowing authenticated users to quickly review and access their bookmarked items.
- **Multi-Criteria Search**: Combined querying across title/description keywords, campus location, category, and incident date ranges (`fromDate` to `toDate`).
- **Date Ordering & Pagination**: Server-side sorting by newest or oldest report date with customizable page limits.
- **One-Click Reset**: Instant clearing of search and filter criteria to return to the default catalog.

### 4. Item Detail & Matching
- **Dedicated Detail View (`item-detail.html`)**: Complete incident records displaying full descriptions, campus locations, timestamps, and status badges.
- **Contact & Handover Disclosure**: Context-aware display of either campus security drop-off locations or the reporter's verified email.
- **Photo Lightbox Modal**: High-resolution image viewer for inspecting attached photos.
- **Favourite Bookmark Toggle**: Interactive "Save to favourites" / "Remove from favourites" toggle button linked to user account.
- **Potential Matches Engine**: Automatically queries and displays up to three active reports of the opposite type that share the same category and campus.

### 5. Personal Dashboard & Report Lifecycle (My Reports)
- **My Reports Dashboard (`my-reports.html`)**: Dedicated portal displaying all reports submitted by the logged-in user, clearly divided into active and resolved states.
- **Owner-Verified Editing (`edit-report.html`)**: Prefilled form enabling report owners to update details with strict ownership verification.
- **One-Click Resolution**: Report owners can mark active items as `Resolved` once returned, immediately archiving them from the public active feed.

### 6. Item Favourites & Bookmarks
- **Detail Page Toggle**: Authenticated users can bookmark items using the interactive "Save to favourites" / "Remove from favourites" toggle button on the item detail page (`item-detail.html`).
- **Browse Filter Tab**: The Browse page (`browse.html`) features a dedicated `Favourites` filter tab to view bookmarked items with count badges and empty/error states.
- **Protected REST Endpoints**: Backed by `/api/favourites` (`GET`, `POST`, `DELETE`) with session authentication, payload validation, and user isolation.
- **Compound Unique Index**: MongoDB persistence enforces atomic bookmarking with a compound unique index on `{ userId, itemId, itemType }` preventing duplicate entries.

### 7. Campus Administration & Bulk Actions
- **Role-Gated Access**: Strict `requireAdmin` middleware protecting administrative routes and actions.
- **Adaptive Navigation**: The Admin navigation link is hidden by default and only displayed for authenticated administrator sessions.
- **Stale Report Tracker**: Automatic detection of active reports created more than 90 days ago.
- **Selected or Mass Bulk Resolution**: Administrative ability to preview stale reports older than 90 days and bulk-resolve either selected reports (via the `reports` list) or all eligible stale reports (when omitted) in a single operation with in-flight UI locking.

### 8. Interactive Help Desk & FAQs
- **Categorized FAQ Accordion**: Expandable answers to common lost property questions and campus procedures.
- **Two-Way Q&A Threads**: Authenticated students can create, view, edit, and delete their own inquiry questions.
- **Administrative Moderation**: Admins can view all inquiries (`?scope=all`), reply directly to questions (automatically updating their status to `answered`), and delete inappropriate posts.
- **Relative Timestamps**: Humanized time indicators (`just now`, `5m ago`, `2d ago`) for recent questions and replies.

### 9. User Experience, Resilience & Accessibility
- **Accessibility (WCAG 2.1 AA)**: Audited with axe DevTools, Lighthouse and keyboard-only testing. Fixed low colour contrast, unlabeled report form dropdowns, a double keyboard stop on the photo upload, and missing focus outlines on buttons. axe reports 0 issues on every page, and Lighthouse accessibility scores are 97–100. See [docs/accessibility-audit.md](docs/accessibility-audit.md).
- **Keyboard Navigation**: Every link, button and field can be reached with Tab and shows a visible focus outline; the mobile menu opens with Enter and closes with Esc.
- **Centralized UI States**: Reusable state handler (`ui-state.js`) for uniform loading spinners, empty-state illustrations, and error alerts.
- **Custom 404 Routing**: Styled `404.html` page for missing pages and structured JSON error responses for invalid API routes.
- **Secure Photo Storage**: Dedicated binary photo storage endpoint (`/api/photos/:id`) with MIME validation (JPEG, PNG, WebP), 5MB per-image size limit, and nosniff protection.

## Team contributions

Mofareh and Max write and maintain the project README, bringing together the work completed by the team. The following sections credit each member for their work, with links to public GitHub evidence.

### Requirements planning

Mofareh defined the keyword, category, location and date-range query specification in [PR #18](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/18). This was a documentation task; the corresponding search and filter implementation remains Sprint 2 work.

### Sprint 1 Implementation and testing

The linked pull requests below are merged Sprint 1 contributions. Where several members worked on the same area, their specific changes are listed together.

| Project area | Contributions | Evidence |
| --- | --- | --- |
| Server setup and project structure | Gulireba prepared the initial Node.js and Express setup, which Kuan separated into a setup PR. Kuan organised the project folders and later moved authentication and item business logic into services. | [PR #5](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/5), [PR #7](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/7), [PR #54](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/54) |
| Database models and connection | Kuan set up the MongoDB connection and created the User, FoundItem and LostItem models. | [PR #9](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/9), [PR #11](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/11), [PR #14](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/14), [PR #20](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/20) |
| Sample data and setup checks | Kuan added the preflight script, mock user and sample lost/found reports, and checks for the required seed data. | [PR #16](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/16), [PR #22](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/22), [PR #28](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/28) |
| Page design and mobile navigation | Reza improved the mock login page, organised the shared CSS, updated the Browse layout and added responsive mobile navigation. | [PR #30](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/30), [PR #39](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/39), [PR #41](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/41), [PR #42](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/42) |
| Mock login and sessions | Kuan implemented the mock login and session authentication. Betty connected the login form to the authentication API and added login error feedback. Gulireba later connected these requests to the shared API client. | [PR #22](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/22), [PR #43](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/43), [PR #47](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/47) |
| Report form and validation | Max built the Lost/Found form, input validation, field feedback and collection-location input. Gulireba extended validation and connected validated form data to report submission. | [PR #12](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/12), [PR #13](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/13), [PR #26](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/26), [PR #45](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/45), [PR #48](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/48) |
| Report creation and retrieval APIs | Gulireba connected authenticated report creation to MongoDB and implemented active-item retrieval and counts, including type filtering, date sorting and pagination. | [PR #37](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/37), [PR #50](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/50) |
| Browse behaviour | Mofareh added active report cards, empty/error messages, dynamic counts and Found/Lost/All filtering. Max added date-sorting and pagination logic. Reza updated the page layout, and Gulireba connected the listing and counts to stored reports. | [PR #8](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/8), [PR #32](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/32), [PR #36](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/36), [PR #42](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/42), [PR #50](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/50) |
| Shared frontend API client | Gulireba added the shared request wrapper, session-cookie support and response/error handling for login, browsing and report submission, with API client tests. | [PR #47](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/47) |
| Test environment and coverage | Betty set up Mocha, Chai, Supertest, the test environment and database helpers, and nyc coverage reporting. | [PR #17](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/17), [PR #21](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/21) |
| Automated feature tests | Betty added model, authentication/session and item-route tests, including validation and failure cases. Gulireba added report creation/retrieval integration tests and frontend API client tests. | [PR #27](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/27), [PR #33](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/33), [PR #40](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/40), [PR #52](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/52), [PR #49](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/49), [PR #47](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/47) |
| Windows and Browse checks | Mofareh recorded Windows installation, startup and API checks, and manual checks of the Browse counts, type tabs and empty results. | [PR #19](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/19), [PR #32](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/32) |

### Sprint 2 Implementation and testing

The linked pull requests below represent merged Sprint 2 contributions across features, integration, and quality assurance:

| Project area | Member(s) | Contributions | Evidence |
| --- | --- | --- | --- |
| Search & filtering and system testing | Mofareh | Built multi-criteria search and filter queries, integrated potential matches, and authored complete system test report. | [PR #61](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/61), [PR #93](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/93), [PR #111](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/111) |
| Form dropzone, duplicate warnings, matches & report resolution | Max | Created multi-photo drag-and-drop dropzone, image lightbox viewer modal, debounced duplicate warning alert, report resolution workflow, and potential matches queries. | [PR #72](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/72), [PR #73](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/73), [PR #74](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/74), [PR #84](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/84), [PR #85](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/85), [PR #86](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/86) |
| Help Desk, navigation & accessibility | Reza | Built interactive Help Desk UI with FAQ accordion and Q&A threads, global Help navigation link, shared fallback states, and WCAG 2.1 AA accessibility audit fixes. | [PR #77](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/77), [PR #87](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/87), [PR #94](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/94), [PR #102](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/102) |
| Edit report form & photo upload integration | Gulireba | Connected prefilled edit report form, integrated multipart photo upload with frontend forms, and wired Item Detail view. | [PR #87](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/87), [PR #91](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/91), [PR #109](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/109) |
| Binary photo storage, favourites model & API | Kuan | Built binary photo storage and Multer upload middleware, Favourite Mongoose data model, service logic, and REST routes. | [PR #95](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/95), [PR #98](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/98), [PR #100](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/100), [PR #101](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/101), [PR #105](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/105), [PR #108](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/108) |
| Admin roles, bulk actions & automated testing | Betty | Implemented role-based administration (role field in User model, `requireAdmin` middleware, and role-gated navigation), built the Admin panel interface and bulk resolution workflow for stale reports, and authored automated unit, integration, and E2E Playwright test suites. | [PR #59](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/59), [PR #60](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/60), [PR #65](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/65), [PR #66](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/66), [PR #68](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/68), [PR #78](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/78), [PR #88](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/88), [PR #89](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/89), [PR #96](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/96), [PR #99](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/99), [PR #103](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/103), [PR #104](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/104), [PR #106](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/106), [PR #107](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/107), [PR #110](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/110) |

### README maintenance

Mofareh prepared the project overview, team roles, setup instructions, API notes and limitations in [PR #19](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/19). He maintains the README as the project changes and documents each member's work in the relevant project area. Max also contributes to the maintenance of the README as the project changes and documents each member's work in the relevant project area.

Betty added testing and coverage instructions and linked the detailed test specification in [PR #53](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/53).

Kuan updated the startup instructions and added the `npm run dev` shortcut in [PR #55](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/55).

Max and Mofareh maintained and expanded the documentation for Sprint 2 ([PR #97](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/97)).

## Project planning

The SRS has changed since Task 9.2P. Appendix A includes the updated requirements, with the original core flows retained: reporting, browsing, searching, item details, My Reports, editing and resolving reports. Real Deakin SSO, item claims and report deletion remain outside the MVP.

Sprint 2 adds administrator bulk actions, Help questions and replies, duplicate warnings, potential matches and favourites. The table below summarises these changes.

| Change since Task 9.2P | Scope and implementation status |
| --- | --- |
| Administrator bulk actions | US-13 and Cards #101–114 add administrator roles and bulk resolution of Active reports older than 90 days by submission date. The SRS now includes this explicit exception to owner-only status changes. The application screenshot shows the admin bulk-action interface with six selected reports older than 90 days. It demonstrates listing and selection; execution success is not shown. |
| Help questions and replies | Cards #115–120 are Done. PRs #75–77 and #79–81 provide the Help page, models, CRUD API and access rules. Automated flow tests are merged in PR #83. |
| Duplicate warnings and potential matches | Cards #121–122 add non-blocking same-type duplicate warnings and up to three opposite-type potential matches. The screenshots show the duplicate warning and potential matches in the running application. The implementation is merged in PRs #86 and #93. |
| Favourites | Cards #123–128 are Done. Favourite storage, authenticated APIs, the UI toggle, dashboard filter and tests are merged in PRs #100, #101, #103, #105, #106 and #107. The screenshot shows one saved Television in the Favourites tab. Figure B13 documents the saved-item view. |
| Photos and cancelled scope | The three-photo requirement remains. Storage, dropzone and lightbox changes are merged; the application evidence also shows a selected photo, successful report creation and the saved photo on the item-detail page. Card #74 was cancelled because photo upload and validation were completed under Cards #66, #87 and #88. Cancelling that task does not cancel US-01. Report deletion and claims remain excluded. |

See the [Group 88 Trello board](https://trello.com/b/KD93aCEN/sit725-group-88-project) for Sprint tasks and the remaining work.