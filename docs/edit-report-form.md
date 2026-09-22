# Edit Report form — Card 29

The form is in `public/edit-report.html`. It reuses the validators in
`report-validation.js` and the messages in `form-feedback.js`.

It supports prefilled Lost/Found details, owner checks in the UI, validation,
reset, saving/error states and existing photo display. Type and status are
read-only. Editing details is allowed only for Active reports.
Deletion, status changes and photo upload are outside this form.

## Local preview (no database required)

From the project folder in CMD:

```cmd
node test/manual/edit-report-preview.js
```

Open http://127.0.0.1:3001/edit-report.html. The banner links switch between a
Found report, a Lost report and a non-owner. Try empty fields, a short title,
a future date, changing the handover method and Reset changes. Save checks
the form but does **not** save anything in this preview. Stop with Ctrl+C.

Run the form tests:

```cmd
npx mocha --no-config test/public/edit-report-form.test.js
```

## Connection for Card 31

The current backend has no report update endpoint. Card 30 adds the endpoint;
Card 31 loads the authenticated user/full report and connects saving.
The normal page stays disabled until that code supplies a report. It does not
take ownership or report data from URL parameters or browser storage.

Call `window.editReportForm.mount({ report, currentUserId, onSave })` after the
page scripts load. The report needs `id` or `_id`, `ownerId`, `type`, title,
category, description, `date` or `foundAt`/`lostAt`, and `location` or
`campusLocation`. Found reports also accept `contactMethod` (email/collection)
or `handoverMethod` (email/dropoff), plus `collectionLocation`.

The stored location is edited as one field to avoid losing free-text building
and room details. The same required-campus validator is reused.

`onSave` receives `{ id, type, changes }`. Changes contain only title, category,
date, description, location, handoverMethod and collectionLocation. Adapt them
to the agreed update API. Leave existing photos, ownership, type and status
unchanged. The server must enforce the authenticated owner check independently.

Return `{ saved: true, message }` **only after** the update API confirms success.
Throw an error to show failure without losing the edits. If no save handler is
provided, Save stays disabled. `setLoading()` and `setError(message)` clear
the current report and lock the form while loading or after an access failure.
