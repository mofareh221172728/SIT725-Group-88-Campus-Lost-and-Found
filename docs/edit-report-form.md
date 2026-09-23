# Edit Report form — Card 29

The edit page now uses the real authenticated report flow. Open it with both
the report type and MongoDB ID in the URL:

```text
/edit-report.html?type=found&id=650000000000000000000101
```

The page:

1. verifies the current session with `GET /api/auth/me`;
2. loads the owned report with `GET /api/items/:type/:id/edit`;
3. prefills the form from the database; and
4. saves validated changes with `PUT /api/items/:type/:id`.

The protected edit-load endpoint checks authentication, ownership and Active
status before returning the editable report. It does not add `ownerId` to the
public item-detail response. The update endpoint repeats the ownership and
Active-status checks, so changing the URL or browser data cannot bypass them.

The form follows the Create Report layout. Report type, status, owner and
photos are fixed. Title, category, report date, description, campus (dropdown),
building and optional room/area can be edited. These location fields are saved
as one comma-separated location, as expected by the existing API. Older reports
with no building need a building entered before saving. Found reports can also edit handover method and the
collection location when the item was handed to a campus desk.

## Run and test

The normal application requires the development database and a signed-in mock
user:

```cmd
npm run dev
```

For the standalone UI preview (no database required):

```cmd
node test/manual/edit-report-preview.js
```

Then open
`http://127.0.0.1:3001/edit-report.html?type=found&id=650000000000000000000101`.
The preview validates the form but does not persist changes.

Run the related automated tests:

```cmd
npx mocha --no-config test/public/edit-report-form.test.js test/public/edit-report-page.test.js
npm test
```
