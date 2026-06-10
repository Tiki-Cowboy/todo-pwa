# Tiki To-Dos — Feature & Bug Backlog
*Generated June 10, 2026 | For handoff to Claude Code*

---

## How to Read This Document

Each item includes:
- **Type**: `BUG` or `FEAT`
- **Complexity**: `S` (small, <2hrs) · `M` (medium, half-day) · `L` (large, 1–2 days) · `XL` (multi-day / needs its own phase)
- **Dependencies**: noted where an item requires another to land first
- **Notes**: implementation guidance, caveats, open questions

Items are ordered roughly by complexity and interdependency, not by priority.

---

## Bugs

---

### BUG-01 · Daily Tasks Reset Not Working
**Complexity:** S

**Description:**
The Daily Tasks feature is supposed to reset all items to unchecked at the start of each new day. Currently, completed dailies persist across days — items crossed off yesterday remain crossed off when the app is opened the next morning.

**Acceptance Criteria:**
- On app load, compare today's date to a stored `lastResetDate` value
- If the dates differ (i.e. it's a new day), reset all daily task items to unchecked and update `lastResetDate` to today
- Additionally, set a client-side interval that fires at 12:01 AM to trigger the same reset without requiring a page reload
- `lastResetDate` should be stored per-user in Firestore (not localStorage) for consistency across devices

**Notes:**
- A Firebase Cloud Function with a scheduled trigger is a more robust alternative for server-authoritative resets, but client-side is sufficient for a single-user app
- Ensure the reset only affects tasks flagged as "daily" — it must not touch regular tasks

---

### BUG-02 · Daily Tasks Not Grouped by Project
**Complexity:** S

**Description:**
The Daily Tasks list on the Today tab renders all daily items in a single undifferentiated list regardless of which project they belong to. Items should be visually grouped by project.

**Acceptance Criteria:**
- Daily tasks on the Today tab are grouped by their assigned project
- Each group is preceded by a small, muted project sub-header: uppercase DM Sans, ~11px, medium-grey, with a thin rule beneath it
- The visual treatment should be low-weight — this is a soft separator, not a full section header
- Tasks with no assigned project are grouped under a catch-all label (e.g. "Uncategorized")
- Within each group, items are sorted consistently (e.g. by creation order or manually set order)

**Notes:**
- This sub-header style should feel consistent with how project headers are used elsewhere in the app (Projects tab)
- No changes to the data model are required — `projectId` already exists on tasks

---

### BUG-03 · Hide Claude Chat FAB
**Complexity:** S

**Description:**
The Claude AI chat FAB (floating action button) is currently visible in the UI. It should be hidden without removing the underlying functionality, so it can be re-enabled in the future.

**Acceptance Criteria:**
- The FAB is not rendered or visible anywhere in the UI
- All back-end scaffolding for the Claude integration (Cloud Function, API wiring) remains fully intact and untouched
- The hide is controlled by a clearly named boolean constant or environment variable (e.g. `SHOW_CLAUDE_FAB = false` in a config or `.env` file), so re-enabling it in the future requires only a one-line change

---

### BUG-04 · "View All" Completed Tasks — Replace Card Stack with Scrollable Table
**Complexity:** M

**Description:**
The "View All" option on the Reporting tab currently renders completed tasks as a vertical stack of cards, one per day. This is a poor UX for large datasets. It should be replaced with a scrollable table with sticky headers and floating date sub-headers.

**Acceptance Criteria:**
- Completed tasks render in a scrollable table with four columns: **Title**, **Project**, **Priority**, **Completed Date/Time**
- Column headers are sticky (frozen at the top of the scroll container)
- Tasks are grouped by day; each day group has a **sticky sub-header row** (e.g. "Tuesday, June 10") that sits just below the column headers
- As the user scrolls into a new day's group, the previous day's sub-header is "pushed out" and replaced by the next — the classic section-header scroll pattern (similar to a contacts list or transaction history)
- Sub-header rows are visually distinct from data rows (e.g. slightly tinted background, medium-weight DM Sans label)
- Within each day, tasks are sorted by completed time descending (most recent first)
- The table is responsive and readable on mobile

**Notes:**
- Achievable with CSS `position: sticky` on both the `thead` row and the day sub-header rows inside a fixed-height scrollable container
- No new data fetching required — just a UI re-render of the existing completed tasks query

---

## Features

---

### FEAT-01 · Due & Overdue List — Sort by Priority + Project Tags
**Complexity:** S

**Description:**
The Due & Overdue list on the Today tab currently has no sort control and no project context on each item. Both should be added.

**Acceptance Criteria:**
- A small sort control (subtle dropdown or toggle) appears above the Due & Overdue list
- Available sort options: **Due Date (ascending)** (default), **Priority (Critical → High → Medium → Low)**, **Project**
- Each list item displays a small project pill/badge showing the project name
- Project badges use the project's assigned accent color as the badge background or border, consistent with the design system's color token approach
- Sort preference persists for the session (does not need to persist across sessions)

---

### FEAT-02 · Completion Celebration (Confetti)
**Complexity:** S

**Description:**
When the last unchecked item on either the Due & Overdue list or the Daily Tasks list is checked off, trigger a brief celebratory animation with a congratulatory message.

**Acceptance Criteria:**
- Checking off the final item on *either* list independently triggers the celebration (per-list, not requiring both to be complete)
- A confetti/fireworks burst animation plays, overlaid on the screen, for approximately 2–3 seconds
- A small text banner appears alongside the animation with copy along the lines of: *"Congrats! You've completed the sisyphean challenge of accomplishing all of today's tasks."* (exact copy TBD / open to iteration)
- The animation and banner are non-blocking — the user can continue interacting with the app
- Use `canvas-confetti` (lightweight, no significant bundle impact) for the animation

**Notes:**
- The celebration should not re-trigger if the user unchecks and re-checks the final item repeatedly — add a simple cooldown (e.g. once per list per day)

---

### FEAT-03 · Reporting — Add "Today" Filter + Custom Date Range
**Complexity:** S

**Description:**
The Reporting tab's time filter currently offers: Past 7 Days, Past 30 Days, All Time. "Today" and a custom date range should be added.

**Acceptance Criteria:**
- "Today" is added as the first/default option in the time period filter
- A "Custom Range" option is added which reveals a start date and end date picker
- Date pickers use either native `<input type="date">` elements styled to the design system, or a lightweight headless date picker component
- All existing charts and data views respond correctly to the new filter options
- Custom range is inclusive of both the start and end dates selected

---

### FEAT-04 · Navbar Restructure — Bottom Nav + Collapse Configure into Projects
**Complexity:** M

**Description:**
The current top navigation is cramped and doesn't feel like a native mobile app. The Configure tab should be folded into the Projects tab, and navigation should move to a bottom bar.

**Acceptance Criteria:**
- Navigation moves to a **bottom nav bar** with three tabs: **Today**, **Projects**, **Reporting**
- Each tab uses **icon + label** (e.g. a sun icon for Today, a folder icon for Projects, a chart icon for Reporting)
- The top bar is retained but simplified: wordmark ("Tiki To-Dos") on the left, Sign Out button on the right — nothing else
- The Configure tab is removed as a standalone tab
- Category management (previously in Configure) is accessible via a clearly labeled button **anchored to the bottom of the Projects tab** (e.g. a "Manage Categories" button or a gear icon in the Projects tab header area)
- All existing Configure functionality (add/edit/delete categories) is preserved — it just lives in a new location
- Bottom nav respects safe area insets on mobile (no content hidden behind home indicator on iOS/Android)

**Notes:**
- Bottom nav should use the existing Bearing-aligned design tokens: navy background, gold active state, DM Sans labels

---

### FEAT-05 · Push Notifications — 11 PM Daily Reminder
**Complexity:** M  
**Platform:** Android only (sole user is on Android)

**Description:**
Send a push notification at approximately 11:00 PM each night reminding the user to review and check off remaining tasks before end of day.

**Acceptance Criteria:**
- App requests Web Push notification permission from the user on first use (with a clear, friendly prompt explaining why)
- User's push subscription is stored in Firestore against their user record
- A Firebase Cloud Function runs on a scheduled trigger (Firebase Scheduler, nightly at ~11:00 PM) and sends a push notification via the Web Push API
- Notification copy is something like: *"🌴 Hey — did you close out today? A few tasks might still be waiting on you."*
- Notification tapping opens the app directly to the Today tab
- If all tasks for the day are already completed at send time, the notification is skipped (no need to remind if there's nothing to do)

**Notes:**
- Web Push for PWAs requires a service worker, which is already in place via `vite-plugin-pwa`
- Android Chrome supports Web Push for installed PWAs without issue
- VAPID keys will need to be generated and stored as Firebase environment config

---

### FEAT-06 · Calendar Integration — Phase 1: Read Access
**Complexity:** L  
**Note:** Required dependency for FEAT-07

**Description:**
Connect the app to the user's Google Calendar to read events. This is the foundational layer for all calendar-related features.

**Acceptance Criteria:**
- User can connect their Google Calendar account via OAuth from within the app (a "Connect Calendar" button in the Projects or Configure area)
- OAuth credentials/tokens are stored securely in Firestore against the user record
- The app can read the user's calendar events for a given day
- Calendar connection state is visible to the user (connected/disconnected indicator)
- User can disconnect their calendar at any time, which clears stored credentials

**Notes:**
- Use Google Calendar API via OAuth 2.0
- Token refresh handling is required — store refresh tokens and handle expiry gracefully
- Read-only scope is sufficient for Phase 1: `https://www.googleapis.com/auth/calendar.readonly`

---

### FEAT-07 · Calendar Integration — Phase 2: End-of-Day Smart Prompt Modal
**Complexity:** L  
**Depends on:** FEAT-06

**Description:**
At approximately 5:30 PM each day, surface a modal that reviews the user's calendar events for the day and intelligently prompts them to log completed tasks or add forgotten ones, based on event-to-project matching.

**Acceptance Criteria:**
- A modal appears automatically at ~5:30 PM (client-side scheduled trigger) if the app is open, or on next app open after 5:30 PM that day
- The modal shows a curated list of today's calendar events that match one or more projects, with prompts like:
  - *"Looks like you had a sync with Raj — should we mark any Germania tasks as complete?"*
  - *"You had a workout block at 12:00 — want to check that off?"*
- Matching logic uses **two layers**:
  1. Fuzzy string match between event title and project names (above a confidence threshold — avoid surfacing low-confidence matches)
  2. If title match is weak, check attendee email domains against project names (e.g. `raj@germania.com` → matches "Germania" project)
- Only events with a match confidence above a defined threshold are surfaced — no brain-dumping the full calendar
- Each prompted item has two actions: **Mark Complete** and **Dismiss**
- The modal appears at most once per day — it does not re-surface if dismissed
- If no confident matches are found for the day, the modal does not appear

**Notes:**
- The email domain matching handles cases where calendar invite titles don't directly reference the client/project (e.g. "Jack & Raj <> Quick Sync" is Germania-related because Raj's email domain is `germania.com`)
- A caveat exists for large enterprise clients whose email domains don't match their common name (e.g. subsidiaries) — this is acceptable for now given the single-user context
- Consider a fuzzy matching library (e.g. `fuse.js`) for title matching

---

### FEAT-08 · Calendar Integration — Phase 3: Write Access / Calendar Blocking
**Complexity:** XL  
**Depends on:** FEAT-06  
**Status:** Future / Needs Further Scoping

**Description:**
Allow the app to write events to the user's Google Calendar — either as reminders tied to tasks or as time-blocking events to preserve focus time.

**Notes:**
- This feature needs more design thought before it can be ticketed in detail
- Open questions: What triggers a calendar write? Is it manual (user clicks "Block time for this task") or suggested by the app? What event format/duration?
- Marking as `[future]` — do not implement until scoped further
- Will require upgrading OAuth scope to include write access: `https://www.googleapis.com/auth/calendar.events`

---

### FEAT-09 · Achievements & Badges System
**Complexity:** XL

**Description:**
A milestone-based achievement system that tracks and celebrates user accomplishments over time, adding a layer of gamification to daily task completion.

**Acceptance Criteria:**

*Display:*
- A "Badges" shelf lives within the Reporting tab, above or below the existing charts
- Badges render as a horizontally scrollable row of circular or hexagonal badge icons
- Locked badges are greyed out / desaturated; unlocked badges display in full color with a gold border treatment
- Tapping/clicking an unlocked badge shows a tooltip or small modal with the badge name, description, and the date it was earned

*Badge Categories & Milestones:*

| Category | Badge Name (suggestion) | Trigger |
|---|---|---|
| Volume | The Opener | 50 tasks completed |
| Volume | The Closer | 100 tasks completed |
| Volume | Machine Mode | 500 tasks completed |
| Volume | Unstoppable | 1,000 tasks completed |
| Consistency | On a Roll | Complete all dailies 3 days in a row |
| Consistency | Week Warrior | Complete all dailies 7 days in a row |
| Consistency | The Monk | Complete all dailies 30 days in a row |
| Consistency | Legendary | Complete all dailies 100 days in a row |
| Daily Sweep | Clean Slate | Complete every Due & Overdue item in a single day |
| Daily Sweep | Perfect Week | Achieve Clean Slate 5 days in the same week |
| Speed | Lightning Round | Complete a task within 1 hour of it becoming due |
| Dedication | Showing Up | Log in and complete ≥1 task every day for 7 days |

*(Badge names and set are suggestions — open to iteration)*

*Data Model:*
- New Firestore collection or sub-collection: `achievements` per user
- Stores: which badges are unlocked, timestamps for when each was earned
- Aggregate counters stored on the user document (or a stats sub-document): `totalTasksCompleted`, `currentDailyStreak`, `longestDailyStreak`
- Counters are incremented on task completion events; streak is evaluated on daily reset

**Notes:**
- Badge unlock checks should happen on the client side after relevant events (task completion, daily reset) — no need for a Cloud Function for this
- Streak tracking requires the daily reset logic (BUG-01) to be working correctly — BUG-01 is a soft dependency
- Badge artwork/iconography TBD — can use emoji + styled containers as a first pass, with proper illustrations as a future polish pass

---

## Dependency Map

```
BUG-01 (Daily Reset) ──────────────────────────────► FEAT-09 (Achievements) [soft dep, streak tracking]
FEAT-06 (Calendar Read) ───────────────────────────► FEAT-07 (Smart Prompt Modal)
                        ───────────────────────────► FEAT-08 (Calendar Write) [future]
```

All other items are independent and can be implemented in any order.

---

## Suggested Implementation Order

| Wave | Items | Rationale |
|---|---|---|
| Wave 1 (Quick wins) | BUG-01, BUG-02, BUG-03, BUG-04 | All small/medium bugs, no dependencies |
| Wave 2 (UI polish) | FEAT-01, FEAT-02, FEAT-03, FEAT-04 | Meaningful UX improvements, self-contained |
| Wave 3 (Notifications) | FEAT-05 | Requires service worker config, moderate lift |
| Wave 4 (Calendar) | FEAT-06 → FEAT-07 | Must be sequential; largest new surface area |
| Wave 5 (Gamification) | FEAT-09 | Meaningful data model work, best after app is stable |
| Future | FEAT-08 | Needs scoping before it can be waved in |