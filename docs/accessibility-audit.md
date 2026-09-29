# Accessibility Audit (WCAG 2.1 AA)

**Date:** 29 September 2026
**Standard:** WCAG 2.1 Level A and AA
**Environment:** Microsoft Edge on Windows, app running locally (`npm run seed`, `npm run start`)

---

## 1. Method

| Tool | How it was used |
|------|-----------------|
| axe DevTools | Edge extension, axe-core 4.13.0, "Scan ALL of my page", WCAG 2.1 AA rules, Best Practices off, device mode iPhone 16 |
| Lighthouse | Edge DevTools → Lighthouse (Navigation mode); reports saved as PDF |

Each page was scanned on `main` and again on this branch after a hard refresh (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>).

| Page | URL | Signed in as |
|------|-----|--------------|
| Login | `/index.html` | Logged out |
| Browse | `/browse.html` | Student |
| Search & Filter | `/search-filter.html` | Student |
| Item detail | `/item-detail.html?id=…&type=found` | Student |
| Create report | `/report.html` | Student |
| My Reports | `/my-reports.html` | Student |
| Admin | `/admin.html` | Admin |
| Help | `/help.html` | Student |

---

## 2. Results

### 2.1 axe DevTools

| Page | Before (`main`) | After (branch) |
|------|-----------------|----------------|
| Login | 2 × colour contrast | ✅ 0 |
| Browse | 2 × colour contrast | ✅ 0 |
| Search & Filter | 1 × colour contrast | ✅ 0 |
| Item detail | 1 × colour contrast | ✅ 0 |
| Create report | 2 × form elements must have labels (critical), 1 × nested interactive controls | ✅ 0 |
| My Reports | 2 × colour contrast | ✅ 0 |
| Admin | 5 × colour contrast | ✅ 0 |
| Help | ✅ 0 | ✅ 0 |

### 2.2 Lighthouse Accessibility score

| Page | Before (`main`) | After (branch) |
|------|-----------------|----------------|
| Login | 94 | 98 |
| Browse | 95 | 99 |
| Search & Filter | 95 | 98 |
| Item detail | 95 | **100** |
| Create report | 91 | 97 |
| My Reports | 94 | 98 |
| Admin | 95 | 98 |
| Help | **100** | **100** |

Lighthouse items still reported on the branch (best practice, not WCAG 2.1 AA failures in axe):

| Lighthouse message | Pages |
|--------------------|-------|
| Document does not have a main landmark | Login, Browse, Search & Filter, My Reports, Admin |
| Heading elements are not in a sequentially-descending order | Create report |
| Identical links have the same purpose | My Reports |

---

## 3. Findings

| ID | Severity | WCAG | Page(s) | Finding | Found with | Status |
|----|----------|------|---------|---------|------------|--------|
| A11Y-01 | Serious | 1.4.3 Contrast (AA) | Login, Browse, Search & Filter, Item detail, My Reports, Admin | Section labels (`.kicker`), inactive Browse tabs and the Login footer note used `#8a8f98` on white (3.24:1, minimum is 4.5:1). | axe, Lighthouse | ✅ Fixed |
| A11Y-02 | Serious | 1.4.3 Contrast (AA) | Admin | Meta text under each stale report ("Found · Other · Burwood · Submitted …") used `#9a9a95`. axe reports one issue per report row. | axe | ✅ Fixed |
| A11Y-03 | Critical | 1.3.1, 4.1.2 (A) | Create report | The Category and Campus dropdowns are Materialize selects; the generated `input.select-dropdown` has no label. | axe, Lighthouse | ✅ Fixed |
| A11Y-04 | Serious | 4.1.2 (A) | Create report | The photo drop zone (`role="button"`) contains the focusable file input (nested interactive controls). | axe | ✅ Fixed |
| A11Y-05 | Minor | Best practice | Login, Browse, Search & Filter, My Reports, Admin | No `<main>` landmark. | Lighthouse | ⏳ Recommended for the team |
| A11Y-06 | Minor | Best practice | Create report | Heading levels are skipped. | Lighthouse | ⏳ Recommended for the team |
| A11Y-07 | Minor | Best practice | My Reports | Several "Edit" links have the same text but open different reports. | Lighthouse | ⏳ Recommended for the team |

---

## 4. Changes made in this card

| File | Change | Finding |
|------|--------|---------|
| `public/css/style.css` | `.kicker` and `.tab-btn` text colour changed from `--wf-line` (`#8a8f98`) to `--wf-text-muted` (`#6a6e76`) | A11Y-01 |
| `public/index.html` | Login footer note colour changed to `var(--wf-text-muted)` | A11Y-01 |
| `public/js/admin.js` | Stale report meta text colour changed from `#9a9a95` to `var(--wf-text-muted)` | A11Y-02 |
| `public/js/select-labels.js` | New: copies each `<label>` text onto Materialize's generated select input as `aria-label` | A11Y-03 |
| `public/report.html` | Loads `select-labels.js` and runs it after `M.AutoInit()`; file input moved beside the drop zone with `tabindex="-1"` | A11Y-03, A11Y-04 |
| `public/edit-report.html`, `public/js/edit-report-form.js` | Same dropdown label fix for Edit report, which uses the same Materialize selects | A11Y-03 |
| `test/public/select-labels.test.js` | New unit tests A11Y-SEL-01..03 | A11Y-03 |
| `docs/accessibility-audit.md` | This report | — |

`npm test`: 303 passing.

