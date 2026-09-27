# Accessibility Audit (WCAG 2.1 AA) & Keyboard Navigation Test

**Card:** #76 — Accessibility (WCAG 2.1 AA) Audit & Keyboard Navigation Test
**Date:** 27 September 2026
**Standard:** WCAG 2.1 Level A and AA

---

## 1. Method

| Check | How it was done |
|-------|-----------------|
| Automated WCAG scan | [axe-core](https://github.com/dequelabs/axe-core) run in Chromium on every page, rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` |
| Keyboard navigation | Pressed <kbd>Tab</kbd> through each page from the top and recorded the focus order and whether focus was visible |
| Mobile menu | At 390 px width: focused the menu button, pressed <kbd>Enter</kbd> to open and <kbd>Esc</kbd> to close |
| Small screens | Checked for horizontal scrolling at 390 px width |
| Page structure | Checked `lang`, page `<title>`, `<h1>` and `<main>` landmark |

Pages were tested with sample reports and Help questions, as a logged-in student and, for Admin and Help, as an admin.

| Page | URL | Signed in as |
|------|-----|--------------|
| Login | `/index.html` | Logged out |
| Browse | `/browse.html` | Student |
| Search & Filter | `/search-filter.html` | Student |
| Item detail | `/item-detail.html?id=…&type=found` | Student |
| Create report | `/report.html` | Student |
| Edit report | `/edit-report.html?type=found&id=…` | Student |
| My Reports | `/my-reports.html` | Student |
| Admin | `/admin.html` | Admin |
| Help | `/help.html` | Student and admin |
| 404 | any unknown URL | Student |

Help and 404 were tested with the Help connect PR and card #77 applied.

---

## 2. Results

### 2.1 Automated scan (axe-core)

| Page | Before fixes | After fixes (this card) |
|------|--------------|-------------------------|
| Login | 2 × colour contrast | ✅ No violations |
| Browse | 2 × colour contrast (inactive tabs) | ✅ No violations |
| Search & Filter | 1 × colour contrast | ✅ No violations |
| Item detail | 1 × colour contrast | ✅ No violations |
| Create report | 1 × nested interactive controls | ⚠️ 1 × nested interactive controls (see A11Y-02) |
| Edit report | ✅ No violations | ✅ No violations |
| My Reports | 2 × colour contrast | ✅ No violations |
| Admin | 1 × colour contrast | ✅ No violations |
| Help (student / admin) | 4 / 3 × colour contrast | ✅ No violations |
| 404 | ✅ No violations | ✅ No violations |

### 2.2 Keyboard navigation

| Check | Result |
|-------|--------|
| Every link, button, field, FAQ item and question can be reached with <kbd>Tab</kbd> | ✅ Pass on all pages |
| Focus order follows the visual order (top navigation → page links → content → actions) | ✅ Pass on all pages |
| Focus is visible on buttons, links and fields | ✅ Pass (outline from the design system `:focus-visible` rules) |
| FAQ items and Help questions open and close with <kbd>Enter</kbd> (native `<details>`) | ✅ Pass |
| Mobile menu opens with <kbd>Enter</kbd> and closes with <kbd>Esc</kbd>, `aria-expanded` updates | ✅ Pass on all pages |
| No keyboard trap (focus returns to the top after the last element) | ✅ Pass on all pages |
| No horizontal scrolling at 390 px | ✅ Pass on all pages |

---

## 3. Findings

| ID | Severity | WCAG | Page(s) | Finding | Status / owner |
|----|----------|------|---------|---------|----------------|
| A11Y-01 | Serious | 1.4.3 Contrast (AA) | All pages | Section labels (`.kicker`), inactive Browse tabs and the Login footer note used `#8a8f98` on white — **3.2:1**, below the 4.5:1 minimum. | ✅ **Fixed in this card.** `.kicker` and `.tab-btn` now use `--wf-text-muted` (`#6a6e76`, **5.1:1**) in `style.css`; the Login note uses the same token. |
| A11Y-02 | Serious | 4.1.2 Name, Role, Value (A) | Create report | The photo drop zone (`#photo-drop-zone`, `role="button"`, `tabindex="0"`) contains the file input, which is also focusable. Keyboard users land on two controls for the same action. | ⏳ Recommended fix: add `tabindex="-1"` to `#item-photos` so only the drop zone is focusable (it already opens the file picker). Owner: Create report / drop zone (card #93). |
| A11Y-03 | Moderate | 2.4.1 Bypass Blocks (A) | All pages | There is no "Skip to main content" link; keyboard users tab through 7–10 navigation links on every page. The `<nav>` landmark lets screen-reader users skip, so axe does not fail it, but keyboard-only users cannot. | ⏳ Recommended: add a skip link as the first element of each page. Suggested markup below. |
| A11Y-04 | Minor | Best practice (1.3.1) | Login, Browse, Search & Filter, Create report, My Reports, Admin | No `<h1>` and no `<main>` landmark. The page title sits in an `<h2>` inside a `<div>`. Item detail, Edit report, Help and 404 already use `<h1>` + `<main>`. | ⏳ Recommended: change the page title to `<h1>` and wrap the page body in `<main>`, as on Item detail. |

**Suggested skip link (A11Y-03):**

```html
<!-- first element inside <body> -->
<a class="skip-link" href="#main-content">Skip to main content</a>
...
<main id="main-content" class="screen-wrap">
```

```css
.skip-link {
  position: absolute;
  left: -999px;
  top: 0;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  z-index: 100;
  background: var(--wf-white);
  padding: .5rem .75rem;
  border: 2px solid var(--wf-link);
}
```

---

## 4. Manual checks still to do

Automated tools find roughly a third of accessibility issues. Before the final demo, run these by hand and record the result:

| # | Check | How | Result |
|---|-------|-----|--------|
| M-01 | Screen reader reads page titles, form labels and error messages | Windows **Narrator** (<kbd>Ctrl</kbd>+<kbd>Win</kbd>+<kbd>Enter</kbd>) on Login, Create report and Help | |
| M-02 | Error messages are announced | Submit an empty Create report form and an empty Help question with Narrator on | |
| M-03 | Page still works at 200% zoom | <kbd>Ctrl</kbd>+<kbd>+</kbd> to 200% on Browse, Create report and Help | |
| M-04 | Information is not shown by colour alone | Check status badges (Active/Resolved, Open/Answered) also have text | |

---

## 5. Changes made in this card

| File | Change |
|------|--------|
| `public/css/style.css` | `.kicker` and `.tab-btn` text colour changed from `--wf-line` to `--wf-text-muted` (A11Y-01) |
| `public/index.html` | Login footer note colour changed from `#8a8f98` to `var(--wf-text-muted)` (A11Y-01) |
| `docs/accessibility-audit.md` | This report |

A11Y-02 to A11Y-04 change pages owned by other team members, so they are recorded here for the team to schedule rather than changed in this card.
