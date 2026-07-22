# HANDOFF — Tiki Cowboy To-Dos Backlog Additions

> For Claude Code: merge these into the master backlog. Where an item overlaps with an existing entry (noted below), merge/replace rather than duplicate.

---

## FEAT-A · Project Pill Navigation (Today → Project Tab)

**Overlaps with:** existing "Navigation feature: linking project pills in Today view to their corresponding project tab."

**Priority:** Medium

**Description:** In Today view, clicking a task's project pill navigates to that project in the Projects tab.

**Acceptance Criteria:**
- Clicking/tapping a project pill navigates to the Projects tab, with the corresponding project scrolled into view / expanded (or, once FEAT-B ships, opens directly into that project's dedicated view)
- No navigation for tasks with no project (General/null projectId) — pill either doesn't render or is non-interactive

**Dependencies:** Soft dependency on FEAT-B — if that ships first, route directly into the dedicated view instead.

---

## FEAT-B · Dedicated Individual Project View

**Overlaps with:** existing "Individual Project view" — this entry supersedes it.

**Priority:** Medium | **Complexity:** L

**Description:** Replace the single all-projects card view with a dedicated per-project screen, mirroring Bearing's sub-page architecture. Clicking a project navigates to a dedicated view with a back arrow (top left) to return.

**Acceptance Criteria:**
- Dedicated per-project view, deep-linkable
- Back arrow (top left) returns to the main Projects tab
- Header shows: project title, bio/description, status, category, % completed
- Open tasks listed below header
- Below that, a "Completed" section specific to this project, broken down by day — mirroring the existing Reporting tab pattern

**Notes:** Reuse Reporting tab's day-grouping logic rather than building new grouping logic.

---

## FEAT-C · Recurring Tasks ("Frequents")

**Overlaps with:** existing "Recurring tasks feature" — this entry supersedes it with a revised design.

**Priority:** Medium | **Complexity:** L

**Description:** Support non-daily recurring tasks (weekly, monthly, custom interval — e.g. Friday weigh-in, weekend plant watering, monthly stove-grate cleaning). These live in a dedicated "Frequents" project, structurally parallel to Dailies, rather than inside their originating project. Each task carries its own frequency. Rather than spawning a new linked task (FU chain model), a Frequent task simply toggles visibility: it reappears in Today view when due and hides again once completed until the next cycle.

**Acceptance Criteria:**
- New system grouping "Frequents" (parallel to Dailies, not a user-managed category)
- Each task has a `frequency`: weekly (day(s) of week), monthly (day of month), or custom interval (every N days from last completion)
- Dedicated "Frequents" section in Today view, populated only with currently-due tasks; not-yet-due tasks are fully hidden
- On completion, task hides and its next due date is calculated per its frequency
- **Missed-task handling:** a due-but-incomplete Frequent task stays visible (as overdue) indefinitely — no grace period, no silent disappearance. It only leaves Today view once marked complete.
- Recurrence config is editable after creation

**Data Model Notes:**
- Tasks need a `recurrence` field, e.g. `{ type: "fixed" | "interval", dayOfWeek/dayOfMonth, intervalDays, lastCompletedDate, nextDueDate }`
- Reuse/extend the existing Daily Tasks reset-check logic (client-side, checked on Today view load) rather than building a new evaluation engine
- Diverges from the earlier FU-chain-based approach — Frequents should NOT spawn new task documents per cycle; same document, toggled visibility/due state

**Notes:** This is a pivot from earlier recurring-tasks discussions (recurring tasks living inside their parent project, reusing FU chain spawn logic). The Frequents model above is now authoritative.

---

## FEAT-D · Achievements & Badges — Additional Badge Ideas

**Overlaps with:** existing FEAT-020 (Achievements & Badges System) — append to the existing badge catalog rather than treat as a new feature.

**Priority:** Medium

**New Badge Categories:**

| Category | Concept | Notes |
|---|---|---|
| Record-breaking | Most tasks completed in a 24-hour period | Auto-adjusts each time the record is broken (dynamic threshold) |
| Best day-of-week | "Most productive Wednesday ever" | Tracked independently per day-of-week (7 rolling records) |
| Hot streaks | Most tasks completed in a single hour/day/week | Volume-in-a-window, distinct from existing consecutive-day streak badges |
| Day streaks | X consecutive days with ≥1 task completed | Lower bar than existing "all dailies" streak badges |
| Weekly pattern badges | e.g. "dishes every day this week," "everything on time this week" | Requires per-task-name or per-category pattern matching within a week window |
| Milestones | 50/100/250/500/1,000/2,500/5,000 tasks completed | Extends existing volume tiers (50/100/500/1,000) with 250/2,500/5,000 |
| Annual awards | Most productive year to date | Rolling year-over-year comparison |
| Year in review | "Wrapped"-style annual recap — totals, category breakdowns, notable stats | Likely its own dedicated view, surfaced around year-end |

**Acceptance Criteria:**
- All new badges/records apply retroactively against historical completion data
- Dynamic-record badges recalculate their "record to beat" each time broken, not pinned to a static number
- Year-in-review is a distinct dedicated presentation, not just another badge in the shelf

**Notes:** Merge into existing FEAT-020 badge table. Reconcile overlapping concepts (e.g. existing "Consistency" streak badges vs. new "Day streaks") during implementation — keep both, clarify naming.

---

## FEAT-E · Today View: Organization & Visual Hierarchy

**Overlaps with:** existing "Today view redesign" item and the separate "better organization" bug — consolidated into one item per the person's direction.

**Priority:** Medium | **Complexity:** M

**Description:** Today view currently reads as a wall of text — tasks grouped only by category, with no further structure. Add sub-grouping within categories (e.g., by project) and stronger visual hierarchy.

**Acceptance Criteria:**
- Within each category, tasks can be sub-grouped by project (in addition to flat display)
- Visual hierarchy strengthened so categories/sub-groups are clearly distinguishable at a glance (ties into FEAT-G)
- Scoped as a first iterative pass — urgency banding / progressive disclosure remain candidate follow-ups if sub-grouping alone doesn't resolve the "wall of text" feeling

**Notes:** Revisit with the person after shipping to assess whether further restructuring is needed.

---

## FEAT-F · Scrollable Project Sections + In-Section Sorting

**Priority:** Medium | **Complexity:** S/M

**Description:** Project card sections on the Projects tab currently expand to full content height. Convert each section to a scrollable container with a max height, and add sorting within each section.

**Acceptance Criteria:**
- Each category section has a max height with internal scroll
- Per-section sort control, at minimum: alphabetical, due date
- Sort preference settable independently per section
- Scroll position/sort choice reasonably stable across navigation

---

## FEAT-G · Sticky Category Headers on Projects Tab

**Priority:** Medium | **Complexity:** S

**Description:** Category delineation (Work/Personal/Dailies/etc.) on the Projects tab is currently too soft. Add a frozen-header behavior: the current category's header sticks to the top of the viewport while scrolling its contents, then is replaced by the next category's header.

**Acceptance Criteria:**
- Category header pins to top of viewport while scrolling through that category's contents
- Clean transition to the next category's header
- Sufficient visual weight/contrast to serve as a clear section delineator — may warrant a small design pass beyond pure scroll behavior

**Notes:** Consider alongside FEAT-F — if sections become independently scrollable, confirm whether sticky headers apply per-section or at the page level.

---

## Removed / Not Included

- ~~Delete confirmation modal~~ — explicitly withdrawn; two-click delete UX is being kept as-is.