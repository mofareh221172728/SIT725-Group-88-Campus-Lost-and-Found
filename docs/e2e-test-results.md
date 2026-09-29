# End-to-end test results

| Field | Value |
| --- | --- |
| Run date | 2026-09-29 |
| Environment | Chromium, Node.js 20.20.2, `.env.test` MongoDB |
| E2E command | `npm run test:e2e` |
| Existing suite command | `npm test` |
| E2E result | 4 passed in 8.1s |
| Existing suite result | 300 passing in 7s |

## Flow results

| ID | Expected result | Actual result | Status | Issues found |
| --- | --- | --- | --- | --- |
| E2E-01 | Mock user can log in and receives a browser session. | `mock.user@deakin.edu.au` was redirected to Browse; `/api/auth/me` returned the user session. | Pass | None |
| E2E-02 | A signed-in user can submit a valid Found report. | The report was created with HTTP 201 and displayed the success message. | Pass | None |
| E2E-03 | The new Active report appears in Browse with its summary data. | Browse showed the report title, Electronics category and Burwood location. | Pass | Browse renders the stored status as lowercase `active`, unlike the title-cased status used elsewhere. |
| E2E-04 | Search and type/category filters return the new report only. | The Found + Electronics + title search returned `1 result`. | Pass | None |
| E2E-05 | The report detail page displays the selected report's information. | Title, description, category, location and active status matched the submitted report. | Pass | None |
| E2E-06 | An owner can edit an Active report and changes persist. | The title update returned HTTP 200, showed a success message, and persisted after reload. | Pass | None |
| E2E-07 | An owner can resolve an Active report, removing Active-only actions and search visibility. | Resolving returned HTTP 200; My Reports displayed Resolved without Edit/Resolve actions, and Active search returned `0 results`. | Pass | None |
| E2E-11 | A signed-in user can submit a valid Lost report through the form. | "I Lost Something" set the type to Lost and the date label to Date Lost; the report was created with HTTP 201 and showed the success message. | Pass | None |
| E2E-12 | The new Lost report appears in the Browse Lost tab. | The Lost tab showed the title, Clothing category, `Burwood, Library` and Active status. | Pass | None |
| E2E-13 | The Lost report detail page shows its information. | Type Lost, title, description, category, "Date lost", location and Active status matched; the Found-only contact panel was hidden. | Pass | None |
| E2E-14 | Invalid edits are rejected on the edit page and not saved. | An empty title and a 2099 date showed "Item title is required." and "Date cannot be in the future."; after reload the original title and date were unchanged. | Pass | None |
| E2E-15 | Another user cannot edit the owner's report. | A second user opening the edit link saw "You can only edit your own reports."; Save and Mark as Resolved were disabled. | Pass | None |
| E2E-16 | Resolving from My Reports can be cancelled, then confirmed. | Cancelling the confirm dialog kept the report Active (checked through the API); confirming changed it to Resolved and removed Edit. | Pass | None |

## Notes

- Report detail routes intentionally return 404 for resolved reports; the existing route tests verify this behavior. The E2E detail check therefore occurs before resolution.
- The run emitted existing Mongoose deprecation warnings for `new` in `findOneAndUpdate`; this card does not change application persistence code.
