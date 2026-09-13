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
- Mocha, Chai and Supertest for testing
- Materialize CSS on the report form page
- Git and GitHub for version control
- Trello for Sprint planning

## Sprint 1 features currently in `main`

- Static pages for login, browsing, creating a report, item details, search and filters, and My Reports.
- A Node.js and Express server that serves the files in `public/`.
- MongoDB connection setup using Mongoose and a local `.env` file.
- Basic User and Found Item database models.
- `GET /api/items` for retrieving the current item list.
- `POST /api/items` for adding a basic lost or found item to temporary memory storage.
- A browse page that loads active reports from the item API.
- Report cards that show the title, report type, category, location, date and status.
- Clear messages when there are no active reports or when the GET request fails.
- A Lost/Found report form interface.

## Project structure

```text
public/       Frontend HTML, CSS and JavaScript
models/       Mongoose database models
controllers/  Controller files
routes/       Route files
services/     Service files
scripts/      Development scripts
test/         Test files
server.js     Express server and current item API
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

4. Create the local environment file:

```cmd
copy .env.example .env
notepad .env
```

5. In `.env`, keep port `3000` and replace the example MongoDB value with a valid connection string for your MongoDB setup:

```text
PORT=3000
MONGODB_URI=your-valid-mongodb-connection-string
```

Save and close the file.

6. Start the server:

```cmd
npm run start
```

`npm run start` is equivalent to `node server.js`.

To run the preflight check before starting the server, use:

```cmd
npm run dev
```

This runs `node preflight-check.js` first, then starts the server with `node server.js` only when the checks pass.

The expected messages are:

```text
Connected to MongoDB
Server running at http://localhost:3000
```

7. Open the browse page:

```text
http://localhost:3000/browse.html
```

8. Press `Ctrl+C` in Command Prompt to stop the server.

## Test environment setup for Windows

Complete the project setup above first and keep MongoDB running. Run these commands from the project folder.

1. Install the current packages and create the local test configuration:

```cmd
npm install
if not exist .env.test copy .env.test.example .env.test
notepad .env.test
```

2. For local MongoDB, use these values in `.env.test`:

```env
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/sit725-group-88-test
```

Save the file and close Notepad. If you use a hosted MongoDB database, use a connection string for a separate test database.

Use a different database from the one in `.env`. The cleanup functions in `test/helpers/db.js` can delete test data and drop the test database. Do not point them at a development or production database. The `.env.test` file is ignored by Git.

3. Check the development and test configurations and database connections:

```cmd
npm run preflight-check
```

The expected final message is `Preflight check passed.` If a check fails, fix the reported issue before running tests.

4. Run the tests:

```cmd
npm test
```

Mocha loads `.env.test` through `.mocharc.js` and runs the full suite — model unit tests plus API/session tests against the test database.

To run the same suite with a coverage report:

```cmd
npm run test:coverage
```

This writes an HTML report to `coverage/index.html` and prints an overall Statements/Branches/Functions/Lines summary in the terminal.
To access the interactive coverage report, run the following command.
```cmd
open coverage/index.html
```

For the full test-case specification — taxonomy, individual test cases and expected results, and the current coverage breakdown per file, see more details on test cases in [`docs/test-cases.md`](docs/test-cases.md).

## Implemented API endpoints

### Get all current items

```http
GET /api/items
```

The endpoint currently returns a JSON array. The array is empty after each server restart until test items are added again.

### Create a basic item report

```http
POST /api/items
Content-Type: application/json
```

Required JSON fields:

- `type`
- `title`
- `category`
- `date`
- `location`
- `description`

Windows test example:

```cmd
curl.exe -X POST "http://localhost:3000/api/items" -H "Content-Type: application/json" -d "{\"type\":\"found\",\"title\":\"Test Phone\",\"category\":\"Electronics\",\"date\":\"2026-09-05\",\"location\":\"Burwood Library\",\"description\":\"Sprint 1 test item\"}"
```

After a successful request, refresh `http://localhost:3000/browse.html` to view the report.

## Known limitations

- Deakin SSO is not implemented. Login is a mock interface only.
- The current GET and POST item endpoints use temporary memory storage. Reports are deleted when the server stops.
- The Mongoose models are not yet connected to the item endpoints.
- The current Create Report page does not yet send its form data to the POST endpoint.
- Photo upload and storage are not yet implemented.
- Search and filter controls are currently interface placeholders. The search and filter API is planned for Sprint 2.
- Item details, editing, resolving reports and My Reports are not yet fully connected to stored data.

## Current verification status

The dependency installation and JavaScript syntax checks have been completed. The Windows startup instructions were also tested successfully with a valid MongoDB connection. The browse page loaded correctly, and the GET and POST item endpoints displayed the test item as expected.

On Windows, `npm run preflight-check` connected to and pinged both the development and test databases successfully. `npm test` loaded `.env.test` and reported `0 passing`.
