# Search and Filter Query Specification

Card: #64 - Search and filter technical logic and query specification

## Purpose

The search and filter API will use the existing `GET /api/items` endpoint. It will return active lost and found reports that match the supplied query parameters.

This document defines the rules only. The search interface and API implementation are separate Sprint 2 cards.

## Query parameters

All parameters are optional.

| Parameter | Format | Matching rule |
| --- | --- | --- |
| `keyword` | Text | Trim spaces and perform a case-insensitive partial match against the report title and description. |
| `category` | Text | Trim spaces and perform a case-insensitive exact match against the report category. |
| `location` | Text | Trim spaces and perform a case-insensitive partial match against the campus location text. |
| `fromDate` | `YYYY-MM-DD` | Include reports whose relevant incident date is on or after this date. |
| `toDate` | `YYYY-MM-DD` | Include reports whose relevant incident date is on or before this date. |

The public item response currently uses `date` and `location`. When database models use names such as `foundAt` and `campusLocation`, the API should map them to the existing public fields.

## Filtering rules

1. Start with active reports only.
2. Treat an existing sample report with no `status` field as active. This keeps the query compatible with the current browse page.
3. Ignore a parameter when it is missing, empty, or contains only spaces.
4. Apply supplied parameters together using AND logic. A report must match every supplied filter.
5. Apply `fromDate` and `toDate` as an inclusive range.
6. Return the full active-report list when no search parameter is supplied. This is also the clear/reset behaviour.
7. Return an empty JSON array when no report matches. No matches are not an API error.

## Validation

- Accept dates only in `YYYY-MM-DD` format and check that they are real calendar dates.
- Return HTTP `400` when a date is invalid.
- Return HTTP `400` when `fromDate` is later than `toDate`.
- Return a short JSON error message that identifies the invalid input.
- Do not change stored report data while processing a search request.

Example error responses:

```json
{
  "message": "Invalid date. Use YYYY-MM-DD."
}
```

```json
{
  "message": "fromDate must be before or equal to toDate."
}
```

## Example requests

Keyword search:

```text
GET /api/items?keyword=wallet
```

Combined category and location filters:

```text
GET /api/items?category=Electronics&location=Burwood
```

Inclusive date range:

```text
GET /api/items?fromDate=2026-09-01&toDate=2026-09-06
```

Combined search and filters:

```text
GET /api/items?keyword=blue&category=Other&location=Burwood&fromDate=2026-09-01&toDate=2026-09-06
```

Clear/reset:

```text
GET /api/items
```

## Expected responses

| Situation | HTTP status | Response |
| --- | --- | --- |
| Matches found | `200` | JSON array containing the matching active reports. |
| No matches | `200` | Empty JSON array: `[]`. |
| Invalid date or date range | `400` | JSON object containing a clear validation message. |
| Unexpected server error | `500` | JSON object containing a general error message. |

## Performance check

The search and filter response should be returned within two seconds for up to 20 concurrent test users, as stated in the card. The Sprint 2 implementation should be checked with fixed test data and the response times should be recorded.

## Scope boundary

- Building the search and filter interface is Card #26.
- Implementing these rules in the backend API is Card #27.
- Lost, Found, All and reported-date sorting controls are Card #57.
- This card does not change the current UI or API code.
