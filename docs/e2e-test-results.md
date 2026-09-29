# End-to-end test results

| Field | Value |
| --- | --- |
| Run date | 2026-09-27 |
| Environment | Chromium, Node.js 25.9.0, `.env.test` MongoDB |
| E2E command | `npm run test:e2e` |
| Existing suite command | `npm test` |
| E2E result | 2 passed in 3.8s |
| Existing suite result | 267 passing in 3s |

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

## Notes

- Report detail routes intentionally return 404 for resolved reports; the existing route tests verify this behavior. The E2E detail check therefore occurs before resolution.
- The run emitted existing Mongoose deprecation warnings for `new` in `findOneAndUpdate`; this card does not change application persistence code.
