# End-to-end test results

| Field | Value |
| --- | --- |
| Run date | 2026-09-29 |
| Environment | Chromium, Node.js 20.20.2, `.env.test` MongoDB |
| E2E command | `npm run test:e2e` |
| Existing suite command | `npm test` |
| E2E result | 3 passed in 5.2s |
| Existing suite result | 323 passing in 9s |

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
| E2E-08 | On Search & Filter, a keyword with the Lost type filter returns only the matching Lost report. | Keyword `e2e search` + **Lost** showed `1 result`: the Lost report, not the Found one. | Pass | None |
| E2E-09 | A From date after the To date shows an error instead of results. | The page showed "From date must be on or before to date." and no result count. | Pass | None |
| E2E-10 | **Clear all filters** returns to the default listing. | Keyword and dates were emptied, **All** was selected, the result count matched the first page load, and both test reports were listed. | Pass | None |

## Notes

- E2E-08 to E2E-10 (`test/e2e/search-filter.e2e.spec.js`) create one Found and one Lost report through the API before opening the page, because the E2E setup starts with an empty database.
- Report detail routes intentionally return 404 for resolved reports; the existing route tests verify this behavior. The E2E detail check therefore occurs before resolution.
- The run emitted existing Mongoose deprecation warnings for `new` in `findOneAndUpdate`; this card does not change application persistence code.
