# Tiki Cowboy To-Dos — V2 Addendum
**For Claude Code | Applies on top of the original overhaul brief**

This document covers four things:
1. A new **Projects** layer in the data model
2. **Due dates** with overdue flagging
3. **Nav restructure** — Today, Projects, Reporting, Configure tabs
4. **Design system overhaul** — adopt the Bearing design system (navy + gold)

Work these in order. Each section has its own acceptance criteria.

---

## Part 1 — Data Model: Projects

### The New Hierarchy

```
Category  (Work, Personal, Admin — stable, stored in localStorage)
  └── Project  (Ontic, Equifax, Kitchen Reno — stored in Firestore)
        └── Task  (atomic action item)
              └── Subtask  (task with parentId set)
```

Projects are a new first-class concept. They sit between categories and tasks. A task may belong to a project, or it may belong directly to a category with no project (both are valid).

---

### Firestore Schema

#### New collection: `users/{uid}/projects`

```js
{
  id: string,                          // auto-generated doc ID
  name: string,                        // e.g. "Ontic"
  categoryName: string,                // e.g. "Work" — links to localStorage category
  status: "active" | "on-hold" | "archived",
  description: string,                 // optional free-text notes
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Updated task schema: `users/{uid}/tasks`

Add one new optional field:

```js
{
  // ...existing fields unchanged...
  projectId: string | null,            // NEW — references a project doc ID, or null
}
```

Everything else on tasks stays the same. `category` remains on the task for display/grouping when no project is set.

**Do not remove or rename any existing task fields.** Existing tasks with no `projectId` are valid and display under their category with no project label.

---

### Migration Strategy

No automated migration. Existing tasks keep `projectId: null` and display exactly as they do today, grouped by `category`. The user will manually reassign tasks to projects via the task edit modal as needed.

Provide a clear visual indicator in the task edit modal that helps the user understand the new model: a short line like *"Optional — group this task under a project"* above the project selector.

---

### useProjects Hook

Create `src/hooks/useProjects.js`:

```js
// Exposes:
{
  projects,              // array, real-time Firestore listener
  addProject,            // (name, categoryName, status, description) => Promise
  updateProject,         // (projectId, updates) => Promise
  archiveProject,        // (projectId) => sets status: 'archived'
  deleteProject,         // (projectId) => deletes doc (does NOT delete tasks)
  getProjectById,        // (projectId) => project object or undefined
  activeProjects,        // projects filtered to status !== 'archived'
}
```

Deleting a project does **not** delete its tasks — it sets `projectId: null` on all tasks belonging to that project (batch update), then deletes the project doc.

---

### UI Changes — Projects Tab

The Projects tab shows all active projects as collapsible cards, grouped by category.

#### Project card structure
Each project is a card with:
- A colored left accent bar (4px, color assigned per project — gold, red, blue, green — cycling through semantic colors)
- Header row: project name (15px, 500 weight) + category label (12px, muted) on the left; task count + status pill + collapse chevron on the right
- Task list area: `padding-left: 44px` — aligns task content to the right of the accent bar, making nesting immediately legible
- Collapsed state: header only, chevron points right (▶), task count visible
- Expanded state: header + task list beneath a hairline separator, chevron points down (▾)
- Collapse state stored in component state (not Firestore); default expanded for projects with overdue tasks, collapsed otherwise

#### Task rows within a project card
Each task row shows:
- Colored left priority bar (3px)
- Task text + due date as secondary line beneath (12px, muted)
- Priority pill + done button (circle) + `···` overflow menu on the right
- Completed tasks shown at 50% opacity with strikethrough text

#### Standalone tasks (no project)
Tasks with `projectId: null` are grouped directly under their category, rendered above the project cards for that category. Category headers use the same section label style as in the Today tab.

#### Task input on Projects tab
A task input row sits at the top of the Projects tab (same as existing input, with project dropdown). When a project card is expanded, an inline "+ Add task" affordance appears at the bottom of that project's task list as a secondary entry point, pre-filling the project field.

#### Configure tab — Projects section
Add a Projects section below Categories:
- List grouped by category
- Each row: name, status pill, description (truncated), edit + archive + delete buttons
- Archived projects in a collapsible "Archived" section at the bottom
- "Add Project" button opens a modal with fields: Name, Category, Status, Description

**Acceptance Criteria — Projects:**
- [ ] `projects` collection created in Firestore with correct schema
- [ ] `useProjects` hook implemented with all listed methods
- [ ] Tasks can be created with an optional `projectId`
- [ ] Projects tab shows all active projects as collapsible cards grouped by category
- [ ] Project cards collapse/expand; default expanded for projects with overdue tasks
- [ ] Task rows within project cards show priority bar, text, due date, priority pill, done + overflow actions
- [ ] Standalone tasks (no project) render above project cards under their category header
- [ ] Inline "+ Add task" affordance inside expanded project cards
- [ ] Task edit modal includes project selector with hint text
- [ ] Configure tab has Projects section: list, add, edit, archive, delete
- [ ] Deleting a project sets `projectId: null` on all its tasks (batch update)
- [ ] Archived projects hidden from Projects tab and task input dropdown
- [ ] Archived projects visible in Configure under collapsible "Archived" section

---

## Part 2 — Due Dates

### Data

```js
dueDate: string | null   // ISO date string e.g. "2026-06-14", or null
```

Store as a plain ISO date string (not a Firestore Timestamp) — date only, no time component needed.

---

### Overdue Flagging

A task is overdue if: `dueDate !== null && dueDate < today's ISO date && completedAt === null`

Overdue tasks display:
- Due date secondary line in `--accent-red` with a warning icon
- Left priority bar overrides to `--accent-red` when overdue
- Overdue tasks auto-expand their parent project on the Projects tab
- Overdue tasks sort to the top within their group

---

### Due Date Display Format

Use `date-fns` for all formatting:

| Condition | Display |
|---|---|
| Overdue | `Overdue · Jun 3` in red |
| Due today | `Today` in gold |
| Due tomorrow | `Tomorrow` in gold |
| Due within 7 days | day name e.g. `Friday` |
| Due further out | `Jun 14` or `Jun 14, 2027` if next year |
| No due date | nothing shown |

---

### Reporting

- Completed task log shows due date alongside completion date
- New stat card: **On-time rate** — % of completed tasks finished on or before their due date

**Acceptance Criteria — Due Dates:**
- [ ] `dueDate` stored as ISO date string or null
- [ ] Task input and edit modal include a date picker
- [ ] Overdue tasks flagged with red secondary line + icon + red priority bar
- [ ] Overdue tasks sort to top within their group
- [ ] Overdue tasks auto-expand their project card on Projects tab
- [ ] Due date displays using relative format per the table above
- [ ] Reporting shows due date on completed tasks
- [ ] On-time rate stat card in reporting

---

## Part 3 — Nav Restructure

### New Tab Structure

Replace the current Home / Reporting / Configure nav with:

```
TIKI TO-DOS    Today    Projects    Reporting    Configure    [email]  [Sign out]
```

Four tabs. No more "Home."

---

### Today Tab

The daily driver. Shows two panels only — nothing else.

**Page title**: Today's date, e.g. `Monday, June 9` (DM Sans, 22px, 500 weight, navy)

**Overdue banner** (shown only when overdue tasks exist):
- Subtle red-tinted card at the top: `⚠ 2 overdue tasks`
- "Add to today" button on the right — opens task input pre-filled with today's date

**Panel 1 — Due & Overdue** (section label: `DUE & OVERDUE`)
A single white card containing all tasks that are:
- Overdue (any past due date, incomplete)
- Due today

Within the card, tasks are sorted: overdue first (oldest first), then due today. Each task row shows:
- 3px colored priority bar on the left (red override if overdue)
- Task text (14px, navy)
- Secondary line: `{Project or Category} · due {formatted date}` (12px, muted)
- Right side: status pill (Overdue/Today) + priority pill + circle done button + `···` overflow

**Panel 2 — Completed Today** (section label: `COMPLETED TODAY`)
A single white card containing tasks completed today (`completedAt` date === today). Each row:
- Muted (50% opacity), strikethrough task text
- Secondary line: `{Project or Category} · completed {time}` (12px, muted)
- Filled green circle checkmark on the right (no overflow menu)

If no tasks are due/overdue: friendly empty state — `All clear. Nothing due today.`
If nothing completed yet today: omit the Completed panel entirely (don't show an empty card).

**No task input on the Today tab.** Tasks are created on the Projects tab or via the Claude assistant. The Today tab is read-focused — a daily briefing, not a task manager.

**"Add to today" behavior**: manually pinning a task to Today sets a `pinnedToday: true` flag (date-scoped — resets at midnight) and adds it to the Due & Overdue panel even if its due date is in the future or unset.

---

### Projects Tab

All in-flight work. See Part 1 for full spec.

---

### Reporting Tab

Unchanged from original brief, plus the due date additions in Part 2.

---

### Configure Tab

Unchanged from original brief, plus the Projects section in Part 1.

**Acceptance Criteria — Nav:**
- [ ] Four tabs: Today, Projects, Reporting, Configure
- [ ] Today tab shows date as page title
- [ ] Overdue banner appears when overdue tasks exist
- [ ] Due & Overdue panel shows all overdue + due-today tasks in correct sort order
- [ ] Completed Today panel shows tasks completed today with time
- [ ] Completed Today panel is hidden when no tasks completed yet today
- [ ] Empty state shown when nothing is due
- [ ] No task input on Today tab
- [ ] "Add to today" pins a task to today's view regardless of due date
- [ ] `pinnedToday` flag resets at midnight (or on next app load after midnight)

---

## Part 4 — Design System: Bearing

**Replace the existing color palette and typography entirely.** Adopt the Bearing design system. The two apps share a user and a personality — they should feel like siblings.

---

### CSS Variables

Replace all existing color variables with:

```css
:root {
  --navy-deep:     #0C1A33;
  --navy-mid:      #162544;
  --navy-light:    #1E3055;
  --gold:          #C4A24E;
  --gold-light:    #D4B87A;
  --gold-muted:    #8B7332;
  --cream:         #E8D5A0;
  --cream-light:   #F5EDD8;
  --bg:            #F4F2ED;
  --card-bg:       #FFFFFF;
  --card-border:   rgba(12, 26, 51, 0.06);
  --text-primary:  #0C1A33;
  --text-secondary:#5A6478;
  --text-tertiary: #8B93A1;
  --accent-green:  #2D8F65;
  --accent-green-bg: rgba(45, 143, 101, 0.08);
  --accent-amber:  #C4A24E;
  --accent-amber-bg: rgba(196, 162, 78, 0.08);
  --accent-red:    #C0392B;
  --accent-red-bg: rgba(192, 57, 43, 0.06);
  --accent-blue:   #4A6FA5;
  --accent-blue-bg:rgba(74, 111, 165, 0.06);
  --radius-sm:     8px;
  --radius-md:     12px;
  --radius-lg:     16px;
  --radius-xl:     20px;
}
```

---

### Typography

- **DM Sans** for all UI text (already in use — confirm weights 400, 500, 600 are loaded)
- No Playfair Display — drop it entirely. DM Sans at varying weights and sizes carries the hierarchy.

Type scale:
- Page title (date): 22px / 500 / `--text-primary`
- Section label: 11px / 500 / `--text-tertiary` / letter-spacing 1.5px / uppercase
- Project name: 15px / 500 / `--text-primary`
- Task text: 14px / 400 / `--text-primary`
- Secondary/meta: 12px / 400 / `--text-tertiary`
- Badge/pill text: 11px / 500

---

### Navigation Bar

```
background: --navy-deep
height: 52px
padding: 0 24px
border-bottom: none (gold rule replaces it — see below)
```

- **Wordmark**: `TIKI TO-DOS` — DM Sans, 600 weight, 15px, letter-spacing 3px, uppercase, color `--gold`
- **Nav tabs**: 13px, 400 weight, color `--text-tertiary` (inactive), `--cream` (active)
- **Active tab indicator**: 2px bottom border in `--gold`, no background fill
- **Gold rule**: a 2px line in `--gold` at 40% opacity immediately beneath the nav bar, full width. This is the brand layer separator from Bearing.
- **User email**: 12px, `--text-secondary`
- **Sign out**: 11px, border `--navy-light`, border-radius `--radius-sm`, color `--text-secondary`

---

### Page Background & Cards

- Page background: `--bg` (#F4F2ED) — warm off-white, never pure white
- Cards: `--card-bg` (#FFFFFF), border `--card-border` (navy at 6% opacity), border-radius `--radius-lg` (16px), padding 16px 20px
- Section labels above card groups: 11px uppercase, `--text-tertiary`, letter-spacing 1.5px, margin-bottom 10px

---

### Priority Colors (updated)

Map priority to Bearing semantic colors:
- High → `--accent-red` (#C0392B)
- Medium → `--accent-amber` (#C4A24E)
- Low → `--accent-green` (#2D8F65)

Priority pills use the `*-bg` variant for background and the base color for text.

---

### Status Pills

Small rounded badges (11px, 500 weight, padding 3px 9px, border-radius 8px):
- Overdue: `--accent-red-bg` bg / `--accent-red` text
- Today: `--accent-amber-bg` bg / `--gold-muted` text
- Done: `--accent-green-bg` bg / `--accent-green` text
- Active (project): `--accent-green-bg` bg / `--accent-green` text
- On hold (project): `--accent-amber-bg` bg / `--gold-muted` text
- Archived (project): light gray bg / `--text-tertiary` text

---

### Done Button

Circle button (26px diameter):
- Default: transparent bg, 1.5px border at `rgba(12,26,51,0.15)`
- Completed: `--accent-green` fill, white checkmark icon, no border

---

### Tailwind Config

Update `tailwind.config.js` to extend theme with all Bearing tokens so they're available as utility classes. Map the CSS variables above into the Tailwind color palette under a `bearing` namespace:

```js
colors: {
  navy: { deep: '#0C1A33', mid: '#162544', light: '#1E3055' },
  gold: { DEFAULT: '#C4A24E', light: '#D4B87A', muted: '#8B7332' },
  cream: { DEFAULT: '#E8D5A0', light: '#F5EDD8' },
  // ...etc
}
```

**Acceptance Criteria — Design System:**
- [ ] All CSS variables replaced with Bearing tokens
- [ ] Tailwind config updated with Bearing color namespace
- [ ] Nav bar: navy background, gold wordmark (uppercase, spaced), gold rule beneath
- [ ] Active tab uses 2px gold bottom border, no fill
- [ ] Page background is `--bg` (#F4F2ED), not white or dark
- [ ] Cards are white with subtle navy border and 16px radius
- [ ] Priority colors updated to Bearing semantic palette
- [ ] All pills/badges use correct bg/text color pairing from Bearing tokens
- [ ] Done button is a circle: outline default, green filled when complete
- [ ] No Playfair Display anywhere — DM Sans only
- [ ] No dark backgrounds on content cards (dark is nav only)

---

## Implementation Order

1. **Data model** (Part 1) — Firestore schema + `useProjects` hook, no UI
2. **Projects tab** (Part 1 UI) — collapsible project cards, task rows, standalone tasks
3. **Configure tab** (Part 1 UI) — Projects section
4. **Due dates** (Part 2) — field, overdue flagging, display format
5. **Nav restructure** (Part 3) — four tabs, Today tab, `pinnedToday` logic
6. **Design system** (Part 4) — Bearing tokens, nav, cards, pills, done button

Do not combine steps. Each step should leave the app in a working, shippable state.

---

*Addendum version 2.0 — June 2026*

---

## Part 5 — Completion Progress

### Today Tab — Daily Hero Card

Replace the plain date page title with a navy hero card at the top of the Today tab. This is the one dark card on the page, following Bearing's "one dark card per page" principle.

```
┌─────────────────────────────────────────────────────┐
│  DAILY PROGRESS                              62%     │
│  Monday, June 9                           complete   │
│  ████████████████░░░░░░░░░░                          │
│  8 of 13 tasks complete                              │
└─────────────────────────────────────────────────────┘
```

**Spec:**
- Background: `--navy-deep` (#0C1A33), border-radius `--radius-lg` (16px)
- Left side: section label "DAILY PROGRESS" (11px, uppercase, letter-spacing 1.5px, `--text-secondary`), date below it (22px, 500, `--cream`), progress bar beneath (6px tall, `--gold` fill on `rgba(255,255,255,0.1)` track), task count below bar (12px, `--text-secondary`)
- Right side: large percentage number (36px, 600, `--gold`), "complete" label beneath (12px, `--text-secondary`)
- Progress bar fill color: `--gold`
- **Counts**: all tasks + subtasks with `completedAt` today / all tasks + subtasks created on or before today that are not yet complete. Excludes tasks with no due date that were not created today and are not pinned.

---

### Projects Tab — Per-Project Progress

Each project card header includes a compact progress indicator on the right side, between the task count and the status pill.

**Spec:**
- A small `3 of 5` label (11px, `--text-tertiary`) left-aligned above the bar
- Percentage (13px, 500, `--text-primary`) right-aligned above the bar
- Progress bar: 80px wide, 4px tall, border-radius 2px
- Bar fill color: matches the project's accent color (same color as the left accent bar)
- **Counts**: all tasks + subtasks belonging to this project, regardless of due date. Completed = `completedAt !== null`.
- At 100%: fill color switches to `--accent-green` and percentage displays in `--accent-green` — a small reward signal
- At 0%: bar shows empty track only, no fill rendered

**Acceptance Criteria — Completion Progress:**
- [ ] Today hero card renders at top of Today tab with navy background
- [ ] Hero card shows date, progress bar, percentage, and `X of Y tasks complete` count
- [ ] Progress bar fills in gold proportional to completion
- [ ] Per-project progress bar appears in every project card header
- [ ] Project bar uses the project's accent color as fill
- [ ] Project bar turns green at 100%
- [ ] Both calculations count tasks + subtasks individually
- [ ] Today count updates in real time as tasks are completed