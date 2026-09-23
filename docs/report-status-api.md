# Resolve a report

Card: [#32](https://trello.com/c/yjtNVvzb)

## Request

`PUT /api/items/:type/:id/status`

Use `found` or `lost` for `:type` and the report's MongoDB ID for `:id`.
Send the logged-in user's session cookie and this JSON body:

```json
{ "status": "resolved" }
```

Only the report owner can resolve it. Admin users cannot resolve another
user's report through this endpoint. The owner is taken from the session.
The endpoint accepts no other fields and cannot reopen a resolved report.
Existing reports without a stored status are treated as active, as in Browse.

Ownership and active status are checked in one database update, so two
simultaneous requests cannot both change the same report.

## Response

Success returns HTTP 200 with:

```json
{
  "message": "Report marked as resolved.",
  "report": { "id": "<report-id>", "type": "found", "status": "resolved" }
}
```

| HTTP status | Meaning |
| --- | --- |
| 400 | Invalid type, ID or body. Only `status: "resolved"` is accepted. |
| 401 | Missing session or the session user no longer exists. |
| 403 | The current user does not own the report. |
| 404 | No report with that ID exists in the selected type. |
| 409 | The owner's report is no longer active. |
| 500 | An unexpected database/server error occurred. |

## Frontend connection

The existing API client can call this endpoint:

```js
const result = await api.put(
  `/api/items/${report.type}/${report.id}/status`,
  { status: "resolved" },
);
```

After success, update the displayed status and refresh any active lists or
counts. Resolved reports remain in MongoDB, but Browse and active counts
exclude them. Only show the action for an active report owned by the user.

Card #99 connects the Item Detail button; Card #36 connects My Reports.
This card implements the API and does not add a page or button.

## Verification

Run `npm test`. The resolve-route tests use real MongoDB test collections
and cover both report types, permissions, persistence, legacy reports,
invalid input, repeated/concurrent requests and database errors.
