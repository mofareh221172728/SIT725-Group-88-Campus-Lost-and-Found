# Campus Lost and Found System

## Project overview

This is the Group 88 project for SIT725 Applied Software Engineering. The system is being developed to help Deakin students report and browse lost and found items on campus.

The current work is a Sprint 1 minimum viable product (MVP). Visitors and public users are outside the current scope.

## Current target users

The current target users are Deakin students. Support for visitors may be considered in a future version, but it is not part of the current MVP.

## Team members

| Team member | Main role |
| --- | --- |
| Max Andres Guzman Aceituno | Scrum Master and Frontend Developer (Forms) |
| Mofareh Mubarak M Almakhalas | SRS, Documentation and Backend Developer (Search and Filtering APIs) |
| Reza Tisa Adi Pratama | UI/UX Designer and Frontend Developer |
| Gulireba Maierdan | Frontend and API Integration Engineer |
| Kuan-Ting Chen | Backend and Database |
| Yuen Yi Cheng (Betty) | Test and Quality Assurance |

## Technologies currently used

- HTML5 and CSS3
- JavaScript
- Node.js
- Express
- MongoDB and Mongoose
- dotenv for environment variables
- express-session for mock login sessions
- Mocha, Chai and Supertest for testing, with nyc for coverage
- Materialize CSS on the report form page
- Git and GitHub for version control
- Trello for Sprint planning

## Sprint 1 features currently in `main`

- An Express server that serves the frontend from `public/` and connects to MongoDB.
- User, Found Item and Lost Item models, with reports saved in MongoDB across server restarts.
- Mock login using a seeded email account and an Express session cookie.
- A Create Report form connected to `POST /api/items`, with required-field and date validation.
- Found-item handover choices for email contact or campus drop-off, including a collection location.
- A browse page showing active reports, photos where stored image URLs exist, Found/Lost/All tabs, counts and pagination.
- API support for filtering by report type and sorting by date. The browse page requests newest-first results by default.
- Loading, empty-list and request-error messages on the browse page.
- Automated model, authentication/session and item API tests.

## Project structure

```text
public/             Frontend HTML, CSS and JavaScript
models/             Mongoose database models
routes/             Authentication and item API routes
services/           Authentication and item business logic
middleware/         Session authentication checks
scripts/            Development seed script
data/               Sample image URLs used by the seed script
test/               Automated tests and test helpers
docs/               Test specifications and project documentation
server.js           Express setup, sessions and MongoDB startup
preflight-check.js  Environment, database and seed-data checks
```

## Requirements

Install these programs before running the project:

- Node.js and npm
- MongoDB, or access to a working MongoDB connection
- Git, if cloning the repository from GitHub

## Installation and run instructions for Windows

1. Open Command Prompt.

2. Clone the repository and open its folder:

```cmd
git clone https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found.git
cd SIT725-Group-88-Campus-Lost-and-Found
```

3. Install the project packages:

```cmd
npm install
```

4. Create the local environment file if it does not already exist:

```cmd
if not exist .env copy .env.example .env
notepad .env
```

5. For local MongoDB without authentication, use this configuration in `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/sit725-group-88
SESSION_SECRET=replace-with-a-long-random-secret
```

Replace the session secret with your own random value. If your MongoDB setup requires authentication or uses a hosted database, replace the connection string with the correct development database URI. Save and close the file. Local `.env` and `.env.test` files are ignored by Git.

Keep MongoDB running, then add the mock account and sample reports and check the setup:

```cmd
npm run seed
npm run preflight-check
```

The seed script adds missing sample records using upserts. It seeds the development database and also the test database if `.env.test` exists. Preflight checks the connections, the mock user and at least six found and six lost reports in each configured database. Its expected final message is `Preflight check passed.`

6. Start the server:

```cmd
node server.js
```

The expected messages are:

```text
Connected to MongoDB
Server running at http://localhost:3000
```

7. Open the login page at [http://localhost:3000/index.html](http://localhost:3000/index.html).

Use the seeded email `mock.user@deakin.edu.au`. The current mock flow uses the email only; the password field is not checked. The page still displays SSO wording, but it does not connect to Deakin SSO.

After login, open **Create Report** at [http://localhost:3000/report.html](http://localhost:3000/report.html). A successful submission saves the report in MongoDB. Open or refresh [http://localhost:3000/browse.html](http://localhost:3000/browse.html) and select the matching Found/Lost/All tab to view it.

8. Press `Ctrl+C` in Command Prompt to stop the server. Reports remain in MongoDB; the current in-memory login sessions do not survive a server restart.

## Test environment setup for Windows

Complete the project setup above first and keep MongoDB running. Run these commands from the project folder.

1. Create the local test configuration:

```cmd
if not exist .env.test copy .env.test.example .env.test
notepad .env.test
```

2. For local MongoDB, use these values in `.env.test`:

```env
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/sit725-group-88-test
SESSION_SECRET=test-session-secret
```

Save and close the file. For hosted MongoDB, use a separate test database whose name includes `test`.

**The test helpers clear collections and drop the test database.** Make sure this is a different database from the development database in `.env`. Do not use a database containing data you need to keep.

3. Seed both configured databases and run the preflight check:

```cmd
npm run seed
npm run preflight-check
```

If a check fails, fix the reported issue before continuing. After running tests, the test database is cleared, so run `npm run seed` again before repeating the preflight check.

4. Run the tests:

```cmd
npm test
```

Mocha loads `.env.test` through `.mocharc.js`. The suite includes model validation, login/session handling, report creation, active-item listing, counts, type filtering, sorting and pagination. API tests use Supertest with the exported Express app and a real MongoDB test database; a separately running server is not required.

To run the suite with coverage:

```cmd
npm run test:coverage
```

This prints a coverage summary and writes an HTML report to `coverage/index.html`. Open it in Windows Command Prompt with:

```cmd
start "" "coverage\index.html"
```

See [docs/test-cases.md](docs/test-cases.md) for test-case descriptions. Use the output from your current run for pass/fail counts and coverage. Browser workflows also need manual checks; the coverage report does not measure the frontend pages.

## Implemented API endpoints

### Authentication

| Method and path | Purpose | Session required |
| --- | --- | --- |
| `POST /api/auth/login` | Log in with a seeded user email in a JSON body | No |
| `GET /api/auth/me` | Return the current user's ID and email | Yes |
| `POST /api/auth/logout` | Destroy the current session | Yes |

Mock login accepts `{ "email": "mock.user@deakin.edu.au" }` and sets a session cookie. Keep that cookie when making authenticated requests.

### Browse active reports

```http
GET /api/items
GET /api/items?type=found&sort=newest&page=1&limit=12
GET /api/items/counts
```

These GET endpoints do not require a session.

- `type`: `all` (default), `found` or `lost`.
- `sort`: `newest` or `oldest`, using the reported lost/found date. Specify it when date ordering is needed.
- Without `page`, the item endpoint returns an array of active reports.
- With `page`, it returns `{ items, total, page, totalPages }`. The default page size is 12.
- The counts endpoint returns `{ all, found, lost }` for active reports.

Reports are read from MongoDB and remain available after a server restart.

### Create a report

```http
POST /api/items
Content-Type: application/json
```

An authenticated session is required. The owner is taken from the session.

| Field | Requirement |
| --- | --- |
| `type` | `lost` or `found` |
| `title`, `category`, `description`, `location` | Required text fields |
| `date` | A valid date that is not in the future |
| `handoverMethod` | Required for found reports: `email` or `dropoff` |
| `collectionLocation` | Required when a found report uses `dropoff` |
| `photos` | Optional array of up to three image URL strings; defaults to an empty array |

A successful request returns HTTP `201` with `{ message, report }`. Missing authentication returns `401`; invalid report data returns `400`.

Use the login and Create Report pages above to try this flow. The API accepts JSON; it does not upload image files.

## Known limitations and Sprint 2 work

- Authentication is a mock email login. Real Deakin SSO and password verification are not implemented.
- The form has a photo selector, but selected files are not uploaded or included in its report submission. File upload and storage remain Sprint 2 work. Seeded reports can display existing image URLs.
- Keyword search and category, location and date-range filters are not connected. These remain Sprint 2 work; report-type tabs and API date sorting are already implemented.
- Item details, My Reports, owner editing and resolving reports still need their stored-data workflows completed in Sprint 2.
- The found-item handover choice is stored with the report. Automated email delivery is not implemented.

## Team contributions

Mofareh writes and maintains the project README, bringing together the work completed by the team. The following sections credit each member for their work, with links to public GitHub evidence.

### Requirements planning

Mofareh defined the keyword, category, location and date-range query specification in [PR #18](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/18). This was a documentation task; the corresponding search and filter implementation remains Sprint 2 work.

### Implementation and testing

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

### README maintenance

Mofareh prepared the project overview, team roles, setup instructions, API notes and limitations in [PR #19](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/19). He maintains the README as the project changes and documents each member's work in the relevant project area.

Betty added testing and coverage instructions and linked the detailed test specification in [PR #53](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/53).

Kuan proposed updated startup instructions and the `npm run dev` shortcut in [PR #55](https://github.com/mofareh221172728/SIT725-Group-88-Campus-Lost-and-Found/pull/55). That PR is open as of 13 September 2026. The installation section above uses the existing `node server.js` command.

## Project planning

The SRS requirements are unchanged. This README describes the current implementation and setup.

See the [Group 88 Trello board](https://trello.com/b/KD93aCEN/sit725-group-88-project) for Sprint tasks and the remaining work.
