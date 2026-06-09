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

---

## BUG-001 | P1 | Mobile Layout Broken — Not Sized to Screen

**Description:**
On mobile, the PWA renders in a zoomed-out state that is left-aligned with excess whitespace on the right side. The app does not fill the screen properly and feels clunky to use on a phone.

**Acceptance Criteria:**
- App fills the full width of the mobile viewport with no horizontal overflow or dead space
- No unintended zoom-out on load; content is readable at native scale
- Layout feels native on both iOS Safari and Android Chrome
- Tested on at least one iOS and one Android device after fix

---

## FEAT-001 | P1 | Bearing Design System — Full Visual Overhaul
*Ref: `Branding-and-schema-updates.md` Part 4*

**Description:**
Replace the existing dark teal color palette and Playfair Display typography entirely with the Bearing design system (navy + gold, warm off-white page background, white cards). The two apps (Tiki To-Dos and Bearing) share a user and personality — they should feel like siblings. Includes updating CSS variables, Tailwind config, nav bar, cards, priority colors, status pills, and done button.

**Acceptance Criteria:**
- All CSS variables replaced with Bearing tokens (see Part 4 of ref doc)
- Tailwind config updated with Bearing color namespace
- Nav bar: `--navy-deep` background, gold wordmark (`TIKI TO-DOS`, uppercase, letter-spaced), gold rule beneath
- Active tab uses 2px gold bottom border indicator, no fill
- Page background is `--bg` (#F4F2ED) — warm off-white, not dark
- Cards are white (`--card-bg`) with subtle navy border and 16px radius
- Priority colors updated: High → red, Medium → amber, Low → green (Bearing semantic palette)
- All pills/badges use correct bg/text color pairings
- Done button is a circle: outline default, green filled when complete
- No Playfair Display anywhere — DM Sans only, weights 400/500/600
- No dark backgrounds on content areas (dark is nav only)

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

## FEAT-004 | P1 | Projects — Data Model & Hook
*Ref: `Branding-and-schema-updates.md` Part 1 (Data Model)*

**Description:**
Introduce Projects as a first-class concept sitting between categories and tasks. Create the `users/{uid}/projects` Firestore collection, add `projectId: string | null` to the task schema, and implement the `useProjects` hook. No UI changes in this ticket — data layer only. Existing tasks with no `projectId` remain valid and unchanged.

**Acceptance Criteria:**
- `projects` collection created in Firestore with schema: `id`, `name`, `categoryName`, `status`, `description`, `createdAt`, `updatedAt`
- `projectId` field added to task schema (null for existing tasks — no migration needed)
- `useProjects` hook implemented: `projects`, `activeProjects`, `addProject`, `updateProject`, `archiveProject`, `deleteProject`, `getProjectById`
- Deleting a project sets `projectId: null` on all its tasks via batch update, then deletes the project doc
- Existing tasks unaffected — display exactly as before

---

## FEAT-005 | P1 | Projects Tab UI
*Ref: `Branding-and-schema-updates.md` Part 1 (UI Changes)*

**Description:**
Build the Projects tab: collapsible project cards grouped by category, task rows within cards, standalone tasks (no project) above cards, and an inline "+ Add task" affordance inside expanded cards. Depends on FEAT-004.

**Acceptance Criteria:**
- Projects tab shows all active projects as collapsible cards grouped by category
- Project card: colored left accent bar, header (name, category, task count, status pill, chevron), collapsible task list
- Default state: expanded if project has overdue tasks, collapsed otherwise
- Task rows: 3px priority bar, text, due date secondary line, priority pill, done button, overflow menu
- Standalone tasks (no project) render above project cards under their category header
- Inline "+ Add task" affordance at bottom of expanded project card, pre-fills project field
- Task input row at top of Projects tab includes project dropdown
- Task edit modal includes project selector with hint text: *"Optional — group this task under a project"*

---

## FEAT-006 | P1 | Configure Tab — Projects Section
*Ref: `Branding-and-schema-updates.md` Part 1 (Configure tab)*

**Description:**
Add a Projects management section to the Configure tab, below the existing Categories section. Depends on FEAT-004.

**Acceptance Criteria:**
- Projects section lists all projects grouped by category
- Each row shows: name, status pill, truncated description, edit + archive + delete buttons
- "Add Project" button opens a modal with fields: Name, Category, Status, Description
- Archived projects visible in a collapsible "Archived" section at the bottom
- Archived projects hidden from the Projects tab and task input dropdown

---

## FEAT-007 | P1 | Due Dates — Storage, Display & Overdue Flagging
*Ref: `Branding-and-schema-updates.md` Part 2*

**Description:**
Formalize due date storage as ISO date strings and add overdue detection with visual flagging. Overdue tasks get red treatment throughout the app and sort to the top of their group. Adds due date to the completed task log and an on-time rate stat card to Reporting.

**Acceptance Criteria:**
- `dueDate` stored as ISO date string (`YYYY-MM-DD`) or null — no Firestore Timestamp
- Task input and edit modal include a date picker
- Due date displays using relative format: Overdue · Jun 3 (red), Today (gold), Tomorrow (gold), day name within 7 days, `Jun 14` or `Jun 14, 2027` beyond that
- Overdue tasks: red secondary due date line + warning icon + red priority bar override
- Overdue tasks sort to top within their group
- Overdue tasks auto-expand their parent project card on the Projects tab
- Reporting completed task log shows due date alongside completion date
- On-time rate stat card added to Reporting

---

## FEAT-008 | P1 | Nav Restructure + Today Tab
*Ref: `Branding-and-schema-updates.md` Part 3*

**Description:**
Replace the Home / Reporting / Configure nav with four tabs: Today, Projects, Reporting, Configure. Build the Today tab as a read-focused daily briefing showing overdue + due-today tasks and a completed-today panel. No task input on Today tab — task creation moves to the Projects tab and assistant.

**Acceptance Criteria:**
- Four tabs: Today, Projects, Reporting, Configure
- Today tab shows page title as today's date (e.g. `Monday, June 9`)
- Overdue banner (⚠ N overdue tasks) shown only when overdue tasks exist; includes "Add to today" button
- Due & Overdue panel: all overdue + due-today tasks, sorted overdue-first then due-today; shows project/category + formatted due date
- Completed Today panel: tasks completed today, shows time; hidden entirely if none completed yet
- Empty state shown when nothing is due: `All clear. Nothing due today.`
- No task input on the Today tab
- `pinnedToday` flag: "Add to today" sets flag; flag resets at midnight (or on first app load after midnight)
- Pinned tasks appear in Due & Overdue panel regardless of due date

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
