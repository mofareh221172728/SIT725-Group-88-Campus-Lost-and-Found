# System Test Report

**Card:** #38 Test complete application  
**Date:** 30/09/2026  
**Code tested:** `main`, after PR #104 (E2E report flows) and PR #110 (admin tests) were merged  
**Environment:** Microsoft Edge on Windows, app running locally (`npm run seed`, `npm run start`)

Test accounts:

- Student: `mock.user@deakin.edu.au`
- Admin: `admin.mock@deakin.edu.au`

Result: **Pass** / **Fail**.

## 1. Automated tests

| Test suite                  | Command      | Expected      | Actual             | Result |
|---------------------------------|------------------|-------------------|------------------------|------------|
| Unit, API and integration tests | `npm test`         | All tests passing | 392 passing, 0 failing | Pass       |
| End-to-end tests (Playwright)   | `npm run test:e2e` | All tests passing | 6 passed, 0 failed     | Pass       |

The re-run includes the tests added since the first run: admin stale-count, bulk-action and access-control tests (#110), search and filter edge cases, session-gated report actions, photo upload validation, Favourites API, service and UI tests, and four new E2E tests for sign-out, create-and-view, edit-and-resolve, and search filters (#104).

## 2. Manual tests

### 2.1 Login and sign out

| ID | Test                      | Steps                                                       | Expected                                                 | Actual                                                   | Result |
|--------|-------------------------------|-----------------------------------------------------------------|--------------------------------------------------------------|--------------------------------------------------------------|------------|
| ST-01  | Login as student              | Open `/index.html`, enter `mock.user@deakin.edu.au`, click Continue | Goes to Browse page                                          | Goes to Browse page                                          | Pass       |
| ST-02  | Login with unregistered email | Enter `nobody@deakin.edu.au`, click Continue                      | Error message shown, stays on Login                          | Error message shown, stays on Login                          | Pass       |
| ST-03  | Login with empty email        | Leave email empty, click Continue                               | Error or required-field message, no login                    | Error or required-field message, no login                    | Pass       |
| ST-04  | Protected page without login  | Sign out (or use a private window), open `/my-reports.html`       | Asked to log in, no reports shown                            | Asked to log in, no reports shown                            | Pass       |
| ST-05  | Sign out                      | Log in, click Sign out                                          | Back to Login; opening `/my-reports.html` asks to log in again | Back to Login; opening `/my-reports.html` asks to log in again | Pass       |

### 2.2 Browse

| ID | Test             | Steps                             | Expected                                  | Actual                                    | Result |
|--------|----------------------|---------------------------------------|-----------------------------------------------|-----------------------------------------------|------------|
| ST-06  | Tabs                 | Open Browse, click Found, Lost, All   | List and counts change for each tab           | List and counts change for each tab           | Pass       |
| ST-07  | Keyword search       | Search for a word from a report title | Only matching reports shown                   | Only matching reports shown                   | Pass       |
| ST-08  | Search with no match | Search “Random Text”                  | "No active reports match your search" message | "No active reports match your search" message | Pass       |
| ST-09  | Pagination           | On All, go to page 2                  | Next 12 reports shown, "Showing 13-24 of …"   | Next 12 reports shown, "Showing 13-24 of …"   | Pass       |
| ST-10  | Open a report        | Click a report card                   | Item detail page opens for that report        | Item detail page opens for that report        | Pass       |

### 2.3 Search & Filter

| ID | Test           | Steps                            | Expected                              | Actual                                | Result |
|--------|--------------------|--------------------------------------|-------------------------------------------|-------------------------------------------|------------|
| ST-11  | Filter by category | Choose a category, Apply filters     | Only reports in that category             | Only reports in that category             | Pass       |
| ST-12  | Filter by campus   | Choose a campus, Apply filters       | Only reports from that campus             | Only reports from that campus             | Pass       |
| ST-13  | Date range         | Set From and To dates, Apply filters | Only reports within the dates             | Only reports within the dates             | Pass       |
| ST-14  | Wrong date range   | Set From after To, Apply filters     | "From date must be on or before to date." | "From date must be on or before to date." | Pass       |
| ST-15  | Clear filters      | Click Clear all filters              | All reports shown again                   | All reports shown again                   | Pass       |

### 2.4 Item detail

| ID | Test            | Steps                                | Expected                                                                                   | Actual                                                                                     | Result |
|--------|---------------------|------------------------------------------|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|------------|
| ST-16  | Report details      | Open a Found report                      | Title, category, date, campus, photos and contact or collection info shown                     | Title, category, date, campus, photos and contact or collection info shown                     | Pass       |
| ST-17  | Potential matches   | Scroll to potential matches              | Opposite-type reports (Lost↔Found) from the same campus, or "No potential matches" message | Opposite-type reports (Lost↔Found) from the same campus, or "No potential matches" message | Pass       |
| ST-18  | Invalid report link | Open `/item-detail.html?id=123&type=found` | "This report could not be found." (no crash)                                                   | "This report could not be found." (no crash)                                                   | Pass       |

### 2.5 Create report

| ID | Test                         | Steps                                                                     | Expected                                                                       | Actual                                                                         | Result |
|--------|----------------------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|------------|
| ST-19  | Create a Lost report             | Choose I Lost Something, fill all fields, Submit                              | Success; report appears in Browse and My Reports                                   | Success; report appears in Browse and My Reports                                   | Pass       |
| ST-20  | Create a Found report (drop-off) | Choose I Found Something, handover drop-off, fill collection location, Submit | Success; detail page shows collection location                                     | Success; detail page shows collection location                                     | Pass       |
| ST-21  | Empty form                       | Click Submit with nothing filled                                              | Error under each required field, nothing saved                                     | Error under each required field, nothing saved                                     | Pass       |
| ST-22  | Short title / description        | Title ab, description short                                                   | "Title must be at least … characters", "Description must be at least … characters" | "Title must be at least … characters", "Description must be at least … characters" | Pass       |
| ST-23  | Future date                      | Pick tomorrow's date                                                          | "Date cannot be in the future."                                                    | "Date cannot be in the future."                                                    | Pass       |
| ST-24  | Drop-off without location        | Found, drop-off, leave collection location empty                              | "Collection location is required for items that were dropped off."                 | "Collection location is required for items that were dropped off."                 | Pass       |
| ST-25  | Photos                           | Upload 3 photos, then try a 4th                                               | 3 accepted; 4th rejected                                                           | 3 accepted; 4th rejected                                                           | Pass       |

### 2.6 My Reports (edit and resolve)

| ID | Test               | Steps                          | Expected                                           | Actual                                             | Result |
|--------|------------------------|------------------------------------|--------------------------------------------------------|--------------------------------------------------------|------------|
| ST-26  | Own reports only       | Open My Reports as student         | Only this student's Found and Lost reports             | Only this student's Found and Lost reports             | Pass       |
| ST-27  | Edit a report          | Click Edit, change the title, Save | New title shown in My Reports and Browse               | New title shown in My Reports and Browse               | Pass       |
| ST-28  | Edit with invalid data | Clear the title, Save              | Error message, not saved                               | Error message, not saved                               | Pass       |
| ST-29  | Resolve a report       | Click Resolve, confirm             | Status changes to Resolved; report no longer in Browse | Status changes to Resolved; report no longer in Browse | Pass       |

### 2.7 Admin

| ID | Test                  | Steps                                          | Expected                                      | Actual                                        | Result |
|--------|---------------------------|----------------------------------------------------|---------------------------------------------------|---------------------------------------------------|------------|
| ST-30  | Student cannot open Admin | Log in as student, open `/admin.html`                | "You are not authorized to view this page."       | "You are not authorized to view this page."       | Pass       |
| ST-31  | Stale report list         | Log in as admin, open Admin                        | Reports older than 90 days listed with count      | Reports older than 90 days listed with count      | Pass       |
| ST-32  | Bulk resolve              | Untick one report, click Resolve selected, confirm | Only the ticked reports resolved; count goes down | Only the ticked reports resolved; count goes down | Pass       |

### 2.8 Help

| ID | Test            | Steps                                  | Expected                                          | Actual                                            | Result |
|--------|---------------------|--------------------------------------------|-------------------------------------------------------|-------------------------------------------------------|------------|
| ST-33  | FAQ search          | Type photo in FAQ search, click a category | Only matching FAQs shown                              | Only matching FAQs shown                              | Pass       |
| ST-34  | Ask a question      | Fill title, category and question, Submit  | Question appears in My questions as Open              | Question appears in My questions as Open              | Pass       |
| ST-35  | Question validation | Submit with a 2-letter title               | Error message, not saved                              | Error message, not saved                              | Pass       |
| ST-36  | Edit and delete     | Edit own question, then delete it          | Changes saved; deleted question disappears            | Changes saved; deleted question disappears            | Pass       |
| ST-37  | Admin reply         | Log in as admin, open All questions, reply | Reply shown; question marked Answered for the student | Reply shown; question marked Answered for the student | Pass       |

### 2.9 Errors and 404

| ID | Test          | Steps                                              | Expected                                         | Actual                                           | Result |
|--------|-------------------|--------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|------------|
| ST-38  | Unknown page      | Open `/abc`                                              | 404 page with Browse and Help links                  | 404 page with Browse and Help links                  | Pass       |
| ST-39  | Unknown API route | Open `/api/abc`                                          | JSON message "API route was not found."              | JSON message "API route was not found."              | Pass       |
| ST-40  | Server stopped    | Open Browse, stop the server (Ctrl+C), reload the list | Friendly error message with Try again, no blank page | Friendly error message with Try again, no blank page | Pass       |

### 2.10 Favourites

| ID | Test | Steps | Expected | Actual | Result |
|--------|------|-------|----------|--------|------------|
| ST-41  | Add a favourite    | Log in, open a report, click the favourite toggle | Toggle shows the item as a favourite | Toggle shows the item as a favourite | Pass |
| ST-42  | Favourite filter   | Open the dashboard and choose the Favourite filter | Only favourited reports are listed | Only favourited reports are listed | Pass |
| ST-43  | Remove a favourite | Click the toggle again, then reload the page | Item is no longer a favourite after reload | Item is no longer a favourite after reload | Pass |

## 3. Summary

| Item         | Count |
|------------------|-----------|
| Manual tests run | 43        |
| Passed           | 43        |
| Failed           | 0         |
| Defects found    | 0         |