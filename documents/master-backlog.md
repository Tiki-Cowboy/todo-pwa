# Tiki Cowboy To-Dos — Master Backlog

**Reference doc:** `documents/Branding-and-schema-updates.md` — covers Projects layer, Due Dates, Nav restructure, Bearing design system, and Completion Progress. Tickets below map to its parts where noted.

---

## ✅ Completed

| ID | Title | Notes |
|----|-------|-------|
| DONE-001 | Scaffolding & Auth | React 18 + Vite + Tailwind CSS v3, Firebase v9 modular SDK, Google Auth, sign-in/sign-up screen with Framer Motion |
| DONE-002 | Core Task Functionality | Firestore tasks collection, `useTasks` hook, TaskList with category grouping + collapse, TaskItem with priority borders + two-step delete + completion animation, TaskInput, HomeTab |
| DONE-003 | Task Edit Modal | Headless UI Dialog, slide-up animation, edit text/priority/category/due date, blurred backdrop |
| DONE-004 | Reporting Tab | Date range filter (7d/30d/all), summary stat strip, 5 Recharts charts (category, priority, trend, weekday, time-of-day), CompletedByDay log grouped by day → category → task |
| DONE-005 | Polish | Framer Motion animations throughout, Toast notification system, skeleton loader, UpdateBanner (PWA update prompt), categories moved to Firestore for cross-device sync, localStorage migration, ConfigureTab with color picker and two-step delete |
| DONE-006 | Claude Assistant | Firebase Cloud Function (HTTPS Callable, `claudeChat`), Anthropic SDK server-side, agentic tool-use loop (create/update/complete/delete tasks), Secret Manager for API key, AssistantPanel slide-in with typing indicator |
| DONE-007 | PWA Icons Fix | Moved icon assets into `public/icons/` so Vite copies them to `dist/` on build; resolved standalone install mode not working on mobile |
| DONE-008 | Firebase Hosting Deploy | App live at https://my-to-do-app-5b0e1.web.app; Cloud Function deployed to us-central1 |
| BUG-001 | Mobile Layout Fixed | Root cause: NavBar content overflowing mobile viewport. Fixed with scrollable nav, responsive padding, smaller text on mobile, and global overflow-x:hidden. |
| FEAT-001 | Bearing Design System | Full visual overhaul: navy/gold palette, DM Sans typography, CSS custom properties, Tailwind token namespace, updated all cards/pills/buttons/nav throughout the app. |
| FEAT-004 | Projects — Data Model & Hook | `users/{uid}/projects` Firestore collection, `projectId` on tasks, `useProjects` hook with full CRUD. Batch delete cascades to tasks. |
| FEAT-005 | Projects Tab UI | Collapsible project cards grouped by category, 2-column grid on md+, colored accent bars, inline quick-add (with priority + due date), always-visible Add Task strip, project description line, pencil/trash icons in card header. Add Project moved here as inline panel. |
| FEAT-006 | Configure Tab — Projects Section | Edit/archive/delete projects from Configure. Add Project removed from Configure (moved to Projects tab). Archived + Completed projects in collapsible section. |
| FEAT-007 | Due Dates — Storage, Display & Overdue Flagging | ISO date strings, relative formatting (Overdue·Jun 3 / Today / Tomorrow / day name / date), red overdue treatment throughout, overdue-first sort, on-time rate in Reporting. |
| FEAT-008 | Today Tab (partial) | Renamed Home → Today. Filters to overdue + due-today only. Empty state: "All clear. Nothing due today." Daily Checklist section added. (pinnedToday and Completed Today panel not yet built.) |
| FEAT-010 | Projects — 4 Statuses + Hero Card + Filter | Added Completed as 4th project status (blue). Projects hero card: Active/On Hold/Archived/Completed counts + % Done. Filter toggle: All/Active/On Hold/Archived/Completed. |
| FEAT-011 | Daily Recurring Tasks | Project type flag (standard/daily). Daily tasks use `lastCompletedDate` instead of `completedAt` — check off resets each day automatically, no backend cron needed. Daily Checklist section on Today tab. ↻ Daily badge on project cards. Toggle (Standard/Daily) in project creation and edit modal. |
| BUG-002 | Daily Tasks Reset Not Working | `useDailyReset` hook: compares today vs Firestore `lastResetDate` on user doc, resets all daily task `lastCompletedDate` fields in a batch write, schedules a midnight client-side re-check. Timezone bug fixed — all date comparisons use local date via date-fns `format()`. |
| BUG-003 | Daily Tasks Not Grouped by Project | `groupedDailyTasks` memo in HomeTab groups by `projectId`, sorts groups by project name, renders a muted project sub-header + divider before each group. |
| BUG-004 | Hide Claude Chat FAB | `src/config.js` exports `SHOW_CLAUDE_FAB = false`; FAB wrapped in `{SHOW_CLAUDE_FAB && (...)}` in AppShell. One-line re-enable. |
| BUG-005 | Scrollable Completed-Tasks Table | CompletedByDay rewritten as CSS-grid table (4 cols: Title/Project/Priority/Completed). Column header sticky at `top:0`, day sub-headers sticky at `top:36px`. Max-height 600px scrollable container. Border + box-shadow distinguishes table from page background. |
| BUG-006 | Subtasks Disappear on Save | `addSubtask` in `useTasks.js` was not forwarding `projectId` to Firestore, so child tasks got `projectId: null` and were excluded from `projectTaskMap`. Fixed by passing `projectId: parent?.projectId ?? null`. |
| BUG-007 | Daily Task Rows Missing Action Buttons | `DailyTaskRow` in ProjectCard had only an Edit button and no Delete or Add Sub-task. Added all three icon buttons (pencil / + / ×) matching the standard task row pattern, with the same hover-reveal and two-step delete confirm behaviour. |
| FEAT-012 | Due & Overdue Sort + Project Badges | Segmented sort control (Due Date / Priority / Project) above the list. Each row shows a small project pill in the project's accent color. Sort state persists for the session. |
| FEAT-013 | Completion Celebration (Confetti) | `canvas-confetti` burst on emptying either list. `CelebrationBanner` component (Framer Motion spring, fixed bottom-center). Once-per-list-per-day cooldown via `celebratedRef`. |
| FEAT-014 | Reporting — Today Filter + Custom Date Range | Added "Today" (default) and "Custom Range" to the filter bar. Custom picker: two `<input type="date">` fields with min/max constraints. All charts and the completed-tasks log respond correctly. |
| FEAT-015 | Bottom Nav + Configure Collapsed into Projects | Bottom nav (Today / Projects / Reporting) with SVG icons; navy bg, gold active state, safe-area inset padding. Top NavBar simplified to wordmark + Sign Out. On desktop (`md+`) tab buttons remain in the top bar; BottomNav hidden via `md:hidden`. Manage Categories panel (gear icon, AnimatePresence) at bottom of Projects tab replaces standalone Configure tab. |
| FEAT-016 | Parent-Child Subtasks (Projects + Today) | `parentId` field on task docs. ProjectCard: "+ Sub" icon on each task row opens inline SubtaskAddRow; SubtaskRow renders indented below parent with its own edit/delete icons. Completing all children auto-completes parent. Today tab: subtasks rendered indented below parent in the Due & Overdue list with per-subtask complete buttons. Subtask rows collapsible via inline ▾/▶ toggle. |
| FEAT-017 | Icon Action Buttons | All text-based task action buttons (Edit / Del / + Sub) replaced with SVG icons: pencil for edit, × (soft red) for delete, + for add sub-task. Tooltip via `title` attribute. Buttons fade in on row hover. Delete still requires two clicks (first click turns icon bright red + updates tooltip). |
| BUG-008 | Expand Arrow Chevron Fix | Replaced invisible `▾` text char with an SVG chevron that rotates 90° (175ms ease) on expand. No dot in either state. |
| BUG-009 | Add Task → + Icon in Card Header | Moved Add Task trigger to a `+` icon in the project card header (left of pencil). Removed the always-visible bottom strip button; form still renders inline when triggered. |
| BUG-010 | Due & Overdue Grouped by Category | Due & Overdue panel on Today tab now groups tasks under category sub-headers (same style as Dailies), sorted by due date within each group. |
| BUG-011 | Default Project Filter = Active | `statusFilter` state initialises to `'active'` instead of `'all'`. |
| BUG-012 | Celebration Banner Centered | `CelebrationBanner` now uses `fixed inset-0 flex items-center justify-center` — truly centered on screen, no longer bottom-anchored. |
| BUG-013 | Reporting Table Header Polish | Completed Tasks table header: white background, bold (`font-semibold`) black text, heavier border (`1.5px`). Card border/shadow increased. |
| BUG-014 | Chart Card Borders Restored | `ChartCard` in Charts.jsx replaced `bg-surface border-border` (unresolved tokens) with `bg-white` + inline `1px solid` border. `text-text` / `text-text-muted` tokens fixed to `text-text-primary` / `text-text-tertiary`. |
| BUG-015 | Project Card Max-Height | Task list container always caps at `maxHeight: 320px, overflowY: auto` — no longer gated on task count. |
| BUG-016 | Status Pill Inline Picker | `StatusPill` is now interactive: click opens a portal-rendered `position: fixed` dropdown (escapes `overflow-hidden`) listing all four statuses. Selection writes to Firestore immediately via `onUpdateProject`. |
| FEAT-021 | General Grouping for Project-less Tasks | `+` icon on each category header opens an inline `GeneralTaskAddRow` (null `projectId`). Project-less tasks render under a "General" sub-label within their category on the Projects tab, below project cards. |
| FEAT-022 | Completed Today Panel | Bottom panel on Today tab shows tasks completed today, grouped by category with dividers, green left-bar accent, and completion time. Panel hidden when none. `completedTasks` prop threaded from AppShell → HomeTab. |
| FEAT-023 | HubSpot Deal & Contact Links | Four optional fields (dealName, dealUrl, contactName, contactUrl) added to TaskEditModal and ProjectModal with URL format validation. Links render as `↗` hyperlinks on task rows (ProjectCard + TodayTaskRow) and in project card headers. Stored in Firestore via existing `updateTask` / `updateProject`. |
| FEAT-024 | Per-Category "New Project" Outline Card | Top-level `NewProjectPanel` bar removed. Each category's project grid now ends with a dashed outline card (`+` / "New project"). Clicking it opens `ProjectModal` pre-set to that category via new `defaultCategoryName` prop. |
| FEAT-025 | Project Status Note | `statusNote` field on projects, distinct from the existing `description` (FEAT-005). `ProjectModal`: "Status Note" textarea below Description with a live 500-char counter (soft limit, not blocked). `ProjectCard`: renders below description with a gold "STATUS" eyebrow label, `line-clamp-2`, hidden entirely when empty. Along the way, fixed a pre-existing bug where `addProject` only forwarded a fixed field subset — new projects were silently dropping HubSpot fields (and would have dropped `statusNote`) on creation; create/update now pass the full form payload through. |
| FEAT-026 | Follow-Up (FU) Reminder Chains | `fuChain` field on tasks + new `fuTemplates` collection. `TaskEditModal`: toggle + chip-based sequence builder (`+X days ✕`, template dropdown with confirm-before-overwrite) — toggle lives in the edit modal only, not the lightweight inline quick-add rows, matching how HubSpot fields are scoped. Completing a non-final FU task silently spawns the next step (`useTasks` `completeTask`/`completeSubtask`); the final step surfaces `EndOfChainModal` ("Add another follow-up" / "Close out") rendered from `AppShell`. Chain-link icon on FU task rows in `ProjectCard` and `HomeTab` (incl. subtasks). "Follow-Up Templates" management panel added next to Manage Categories in the Projects tab (Configure tab is dead code post-FEAT-015, so templates live where Categories already do). Fixed a nested-`<form>` bug in the "+ Add step" control (both in the modal and the templates panel) that was causing a full page reload/navigation on save instead of saving. |
| FEAT-027 | Project Cards Sorted Alphabetically | `projectsByCategory` in `ProjectsTab` now sorts each category's project list by name (`localeCompare`) instead of Firestore creation order. |

---

## FEAT-002 | P2 | Logo Redesign
*Ref: `Branding-and-schema-updates.md` Part 4 (brand direction)*

**Description:**
Replace the current logo/branding assets. The new visual direction is Bearing (navy + gold) — logo should align with that palette and feel. Scope includes favicon, apple-touch-icon, PWA manifest icons, and any in-app logo/wordmark usage.

**Acceptance Criteria:**
- New logo asset provided and approved before implementation
- Favicon updated (ICO + SVG + 96x96 PNG)
- Apple touch icon updated (180x180 PNG)
- PWA manifest icons updated (192x192 maskable + 512x512)
- In-app wordmark / header reflects new branding
- Redeployed and verified on mobile home screen

---

## FEAT-003 | P1 | MCP Server — Claude ↔ Firebase Integration

**Description:**
Build a remote MCP server that exposes the user's Firestore task and project database as callable tools for Claude. Hosted publicly over HTTPS (Cloud Run) and registered in claude.ai's Integrations settings. Target use case: user is in a Claude browser chat, describes a task conversationally, and Claude creates/updates it in the app without opening the app. Must support the Projects layer once FEAT-004 is shipped.

**Acceptance Criteria:**
- MCP server implements tools: `list_tasks`, `create_task`, `update_task`, `complete_task`, `delete_task`, `list_categories`, `list_projects`
- Server deployed publicly over HTTPS and registered in claude.ai Integrations
- Auth prevents unauthorized access (API key or OAuth bearer token)
- Claude can create a task with correct project, category, priority, and due date from a natural language prompt
- Claude can list active tasks and return a readable summary
- Changes reflected in the PWA in real time via Firestore listener

---

## FEAT-008 | P1 | Today Tab — Remaining Items

**Description:**
The Today tab exists and shows overdue + due-today tasks and the Daily Checklist. The following acceptance criteria from the original spec are still outstanding.

**Remaining:**
- `pinnedToday` flag: "Add to today" pins any task to the Due & Overdue panel regardless of due date; flag resets on first app load after midnight

*Note: Completed Today panel extracted to FEAT-022 with fuller spec.*

---

## FEAT-009 | P2 | Completion Progress — Hero Card & Per-Project Bars
*Ref: `Branding-and-schema-updates.md` Part 5*

**Description:**
Add a daily progress hero card to the top of the Today tab and compact progress bars to each project card header. The hero card is the one dark card on an otherwise light page — navy background, gold progress bar, percentage + task count. Depends on FEAT-005 and FEAT-008.

**Acceptance Criteria:**
- Today tab hero card: navy background, section label "DAILY PROGRESS", today's date, gold progress bar, `X of Y tasks complete` count, large gold percentage on the right
- Progress counts include tasks + subtasks; excludes undated tasks not created today and not pinned
- Per-project progress bar in each project card header: 80px wide, 4px tall, color matches project accent
- Project bar shows `3 of 5` label and percentage above the bar
- At 100%: bar and percentage switch to `--accent-green`
- At 0%: empty track only, no fill
- Both counts update in real time as tasks are completed

---

## Open Bugs

*No open bugs at this time.*

---

## FEAT-016 | P2 | Push Notifications — 11 PM Daily Reminder
**Complexity:** M
**Platform:** Android only

**Description:**
Send a push notification at ~11:00 PM each night reminding the user to review and check off remaining tasks.

**Acceptance Criteria:**
- App requests Web Push notification permission on first use with a friendly explanatory prompt
- User's push subscription stored in Firestore against their user record
- Firebase Cloud Function on a scheduled trigger (nightly ~11 PM) sends push via Web Push API
- Notification copy: *"🌴 Hey — did you close out today? A few tasks might still be waiting on you."*
- Tapping the notification opens the app to the Today tab
- If all tasks for the day are already completed, notification is skipped

**Notes:**
- Web Push for PWAs requires a service worker (already in place via `vite-plugin-pwa`)
- VAPID keys to be generated and stored as Firebase environment config

---

## FEAT-017 | P2 | Calendar Integration — Phase 1: Read Access
**Complexity:** L
**Note:** Required dependency for FEAT-018

**Description:**
Connect the app to the user's Google Calendar to read events. Foundational layer for all calendar features.

**Acceptance Criteria:**
- "Connect Calendar" button in Projects or Configure area triggers Google OAuth flow
- OAuth credentials/tokens stored securely in Firestore against user record
- App can read user's calendar events for a given day
- Calendar connection state visible (connected/disconnected indicator)
- User can disconnect calendar at any time, clearing stored credentials
- Token refresh handled gracefully (store refresh tokens, handle expiry)
- Read-only scope: `https://www.googleapis.com/auth/calendar.readonly`

---

## FEAT-018 | P2 | Calendar Integration — Phase 2: End-of-Day Smart Prompt Modal
**Complexity:** L
**Depends on:** FEAT-017

**Description:**
At ~5:30 PM, surface a modal reviewing the user's calendar events and prompting them to log completed tasks or add forgotten ones, based on event-to-project matching.

**Acceptance Criteria:**
- Modal appears at ~5:30 PM (client-side trigger) if app is open, or on next open after 5:30 PM that day
- Modal shows curated calendar events that match projects, with prompts to mark tasks complete
- Matching uses two layers: (1) fuzzy string match between event title and project names, (2) attendee email domain vs project names for weak title matches
- Only events above a defined confidence threshold are surfaced
- Each prompted item has **Mark Complete** and **Dismiss** actions
- Modal appears at most once per day; does not re-surface if dismissed
- If no confident matches found, modal does not appear

**Notes:**
- Use `fuse.js` for fuzzy title matching

---

## FEAT-019 | Future | Calendar Integration — Phase 3: Write Access / Calendar Blocking
**Complexity:** XL
**Depends on:** FEAT-017
**Status:** Needs further scoping before implementation

**Description:**
Allow the app to write events to Google Calendar — either reminders tied to tasks or time-blocking events.

**Notes:**
- Open questions: What triggers a write? Manual or app-suggested? Event format/duration?
- Will require upgrading OAuth scope to `https://www.googleapis.com/auth/calendar.events`
- Do not implement until scoped further

---

## FEAT-020 | P3 | Achievements & Badges System
**Complexity:** XL
**Soft dependency:** BUG-002 (streak tracking requires daily reset to work)

**Description:**
A milestone-based achievement system tracking and celebrating user accomplishments over time.

**Acceptance Criteria:**

*Display:*
- "Badges" shelf in the Reporting tab
- Horizontally scrollable row of circular or hexagonal badge icons
- Locked badges greyed out; unlocked badges in full color with gold border
- Tapping an unlocked badge shows tooltip/modal with name, description, date earned

*Badge Set:*

| Category | Badge Name | Trigger |
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

*Data Model:*
- New `achievements` Firestore collection or sub-collection per user
- Stores: unlocked badges + timestamps earned
- Aggregate counters on user document: `totalTasksCompleted`, `currentDailyStreak`, `longestDailyStreak`
- Counters incremented on task completion; streak evaluated on daily reset
- Badge unlock checks happen client-side after relevant events

---

## Dependency Map

```
FEAT-018 (Calendar Read) ─────────────────────────► FEAT-019 (Smart Prompt Modal)
                         ─────────────────────────► FEAT-020 (Calendar Write) [future]
```
