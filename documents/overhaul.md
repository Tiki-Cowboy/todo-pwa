# Tiki Cowboy To-Dos — Overhaul Brief
**For Claude Code | React + Vite + Firebase v9 Modular SDK**

---

## 1. Project Overview

Overhaul an existing vanilla JS PWA to-do app into a modern, well-architected React application. The app uses Firebase for auth and Firestore for task storage. The goal is: dramatically improved aesthetics, new features (due dates, task editing, richer reporting), clean component architecture, and a mobile-first experience — while preserving all existing functionality and the user's data in Firestore.

**Personality**: "Somewhere between Tiki Cowboy and professional." Warm, personality-driven, but polished. Not a generic productivity tool. Think: an app someone actually enjoys opening. Dark-ish tone with warm accents (think deep teal + amber/gold) — evokes something slightly tropical and premium at the same time.

---

## 2. Current Stack (What Exists)

| Layer | Current | Target |
|---|---|---|
| Framework | Vanilla JS | React 18 + Vite |
| Firebase SDK | v9 compat (deprecated) | v9 Modular |
| Styling | Inline styles + ad-hoc CSS | Tailwind CSS v3 |
| PWA | Manual service worker | `vite-plugin-pwa` |
| State | Global variables | React state + Context |
| File structure | 2 files (index.html + main.js) | Component tree |

---

## 3. Tech Stack

- **React 18** with Vite
- **Firebase v9 Modular SDK** (Auth + Firestore)
- **Tailwind CSS v3**
- **Framer Motion** for animations
- **date-fns** for date formatting/manipulation
- **Recharts** for reporting charts
- **vite-plugin-pwa** for PWA/service worker
- **Headless UI** for accessible modal/drawer primitives
- **Anthropic SDK** (`@anthropic-ai/sdk`) via Firebase Cloud Function (server-side only)
- **MCP SDK** (`@modelcontextprotocol/sdk`) for the standalone MCP server (Phase 6)

Keep it simple — no Redux, no router needed (single-page, tab-based navigation is fine).

---

## 4. Architecture

### File Structure
```
src/
  components/
    auth/
      AuthScreen.jsx
    tasks/
      TaskList.jsx
      TaskItem.jsx
      TaskInput.jsx
      TaskEditModal.jsx
      SubtaskList.jsx
    reporting/
      ReportingView.jsx
      CompletedByDay.jsx
      Charts.jsx
    configure/
      CategoryManager.jsx
    layout/
      AppShell.jsx
      NavBar.jsx
      UpdateBanner.jsx
  hooks/
    useAuth.js
    useTasks.js
    useCategories.js
    useAssistant.js     ← manages assistant chat state + API calls
  lib/
    firebase.js        ← v9 modular init
    firestore.js       ← all Firestore CRUD functions
  App.jsx
  main.jsx
functions/             ← Firebase Cloud Functions (separate package)
  index.js             ← claudeChat Cloud Function (keeps API key server-side)
mcp-server/            ← standalone MCP server (Phase 6)
  index.js
  tools.js             ← shared tool definitions
```

### State Strategy
- `useAuth` hook: wraps `onAuthStateChanged`, exposes `user`, `signIn`, `signUp`, `signOut`
- `useTasks` hook: wraps Firestore real-time listener, exposes `tasks`, `completedTasks`, CRUD operations
- `useCategories` hook: wraps localStorage, exposes `categories`, `addCategory`, `deleteCategory`
- Pass state down via props or a lightweight Context — no external state library needed

---

## 5. Design System

### Color Palette (CSS variables / Tailwind config)
```
--color-bg:           #0f1a1c   ← deep dark teal-black
--color-surface:      #1a2e32   ← card/panel background
--color-surface-2:    #243b40   ← elevated surface
--color-accent:       #e8a020   ← warm amber/gold (primary CTA)
--color-accent-light: #f5c55a   ← lighter amber for hover
--color-text:         #e8efe0   ← warm off-white
--color-text-muted:   #7a9a8a   ← muted teal-gray
--color-success:      #3db07a   ← teal-green for complete
--color-danger:       #e05050   ← muted red for delete/overdue
--color-border:       #2e4a50   ← subtle border
```

### Typography
- **Display / Headings**: `Playfair Display` (Google Fonts) — elegant, warm, slightly editorial
- **Body / UI**: `DM Sans` (Google Fonts) — modern, readable, friendly
- Import both in `index.html` or via `@import` in global CSS

### Priority Colors
Replace the current garish red/orange/yellow:
- High: `#e05050` (muted red) with a small left border accent on task cards
- Medium: `#e8a020` (amber) 
- Low: `#3db07a` (teal-green)

### Task Card Design
- Rounded cards (`rounded-xl`) with subtle shadow
- Left border strip (4px) indicating priority color
- Alternating subtle backgrounds for even/odd tasks within a category
- Smooth hover lift (`translateY(-1px)` + shadow increase)
- Completed tasks: strikethrough text, reduced opacity, muted left border

---

## 6. Feature Specifications

### 6.1 Authentication
**Preserve existing behavior.** Clean up the UI:
- Centered card on the dark background
- Logo displayed prominently above
- Email/password fields with proper labels (not just placeholders)
- Sign In and Sign Up as clearly differentiated buttons
- Inline error messaging (no `alert()` calls anywhere in the app)

**Acceptance Criteria:**
- [ ] User can sign in with email/password
- [ ] User can sign up with email/password
- [ ] Auth errors display inline beneath the form, not as `alert()`
- [ ] User can sign out
- [ ] Auth state persists across page refresh

---

### 6.2 Task Management (Home Tab)

#### Task Input
- Text input + priority selector + category selector + due date picker + Add button
- Due date: native `<input type="date">`, styled to match the design system
- Due date is optional but encouraged
- Keyboard shortcut: `Enter` submits the form

#### Task List
- Grouped by category (alphabetical), with collapsible category sections
- Within each category, tasks sorted by user's selected sort option
- Sort options: Default (created order), Priority High→Low, Priority Low→High, Due Date (soonest first), Name A→Z, Name Z→A

#### Task Cards
Each task card displays:
- Task text (truncated if long, expandable on click)
- Priority indicator (left border color + small badge)
- Category badge (subtle pill)
- Due date (if set): shown as relative date ("Tomorrow", "In 3 days", "Jun 14") — overdue shown in `--color-danger` with a warning icon
- Action buttons: ✓ Complete, ✏️ Edit, ➕ Add Subtask, 🗑 Delete

#### Subtasks
- Rendered indented beneath their parent
- Inherit parent's category
- Have their own priority and due date
- Completing all subtasks auto-completes the parent (preserve existing behavior)

#### Completion
- Completing a task plays a subtle animation (checkmark burst or card fade-slide out)
- Completion percentage shown at bottom of task list (preserve existing)
- No `confirm()` dialogs — use inline confirmation (e.g., button turns red + "Sure?" on first click, confirms on second)

**Acceptance Criteria:**
- [ ] Tasks can be added with text, priority, category, and optional due date
- [ ] Tasks display due date; overdue tasks are visually flagged
- [ ] Tasks can be completed (with animation)
- [ ] Tasks can be deleted with a two-step inline confirmation (no browser `confirm()`)
- [ ] Tasks can be edited via modal (see 6.3)
- [ ] Subtasks can be added, completed, and deleted
- [ ] Completing all subtasks auto-completes the parent
- [ ] Tasks are grouped by category with collapsible headers
- [ ] Sort order can be changed via dropdown

---

### 6.3 Task Edit Modal

A slide-up drawer or centered modal (Headless UI `Dialog`) allowing full edit of:
- Task text
- Priority
- Category
- Due date

Opens when the ✏️ edit button is clicked. Closes on save, cancel, or clicking outside.

**Acceptance Criteria:**
- [ ] Edit modal opens from task card edit button
- [ ] All four fields (text, priority, category, due date) are editable
- [ ] Changes are saved to Firestore on confirm
- [ ] Modal closes on save or cancel
- [ ] Clicking outside the modal closes it (with cancel behavior)

---

### 6.4 Reporting Tab

#### Completed Tasks Log (preserve + improve)
- Daily sections showing completed tasks, grouped by category within each day
- Priority badge visible on each task
- Completion time shown
- Date range filter: "Last 7 days", "Last 30 days", "All time" (default: Last 7 days)

#### Charts (improve + extend)
All charts use Recharts. Render only if data exists for selected range.

1. **Tasks by Category** — Pie or donut chart (current)
2. **Tasks by Time of Day** — Bar chart (current)
3. **Tasks by Day of Week** — Bar chart (current)
4. **Completion Trend** — NEW: Line chart showing tasks completed per day over the selected date range
5. **Priority Breakdown** — NEW: Stacked bar or donut showing High/Medium/Low split of completed tasks

**Acceptance Criteria:**
- [ ] Date range filter controls all charts and the completed task log simultaneously
- [ ] All 5 charts render correctly with data
- [ ] Charts show an empty state message if no data exists for the selected range
- [ ] Completed task log is grouped by day → category → tasks

---

### 6.5 Configure Tab (Categories)

Preserve existing functionality with UI improvements:
- Category list with color swatches
- Add new category
- Delete non-default categories
- **NEW**: Color picker when adding a category (6–8 preset swatches, no free-form color input needed)
- Replace Tailwind color class strings (e.g. `bg-blue-100`) with actual hex values for simplicity

**Acceptance Criteria:**
- [ ] User can add a category with a name and chosen color
- [ ] User can delete non-default categories
- [ ] Deleting a category reassigns its tasks to 'Uncategorized' in Firestore
- [ ] Color swatches are shown next to each category name in the list and in the task input dropdown

---

### 6.6 PWA

- Use `vite-plugin-pwa` with `generateSW` strategy
- Preserve the "new version available" update banner (currently working well)
- Icons and manifest already exist — wire them up in Vite config

**Acceptance Criteria:**
- [ ] App installs as a PWA on mobile and desktop
- [ ] Update banner appears when a new version is deployed
- [ ] App loads from cache when offline (read-only; writes fail gracefully with a toast)

---

## 7. UX Patterns (Global)

- **No `alert()` or `confirm()` anywhere.** Replace with:
  - Inline error messages near the relevant UI
  - Two-step delete confirmation (button state change)
  - Toast notifications for success/error feedback (simple custom toast, bottom-right)
- **Loading states**: Skeleton cards while Firestore data loads (not "Loading tasks..." text)
- **Empty states**: Friendly illustrated or icon-based empty state when task list is empty
- **Animations**: Framer Motion for:
  - Task card entrance (staggered fade-up on initial load)
  - Task completion (fade + slide out)
  - Modal open/close
  - Tab switching (crossfade)

---

## 8. Firebase Migration Notes

The existing Firestore data model is fine — **do not change the schema**. Just migrate to the v9 modular SDK:

```js
// Old (compat)
firebase.firestore().collection('users').doc(uid).collection('tasks')

// New (modular)
import { collection, doc } from 'firebase/firestore'
collection(doc(collection(db, 'users'), uid), 'tasks')
```

All Firestore operations live in `src/lib/firestore.js` as named exports. No Firebase calls in components — components call hook functions only.

---

## 6.7 Claude Assistant Panel (AI Integration)

A slide-out drawer accessible via a persistent button (bottom-right corner, chat bubble icon) or a dedicated "Assistant" nav tab. The panel is a simple chat interface — the user types natural language, Claude responds and takes actions.

### How It Works

1. User sends a message (e.g. "What's overdue?" or "Add a task to call the dentist on Friday, high priority")
2. Frontend calls a Firebase Cloud Function (`claudeChat`) — **never the Anthropic API directly**
3. The Cloud Function:
   - Fetches the user's current tasks from Firestore (to inject as context)
   - Calls the Anthropic API (`claude-sonnet-4-20250514`) with the task list as context + tool definitions
   - Returns Claude's response + any tool calls to execute
4. Frontend receives the response, executes any Firestore writes, updates UI

### API Key Security
- Anthropic API key stored as a Firebase Cloud Function environment variable (`ANTHROPIC_API_KEY`)
- **Never in frontend code or the repo**
- Cloud Function is callable only by authenticated users (Firebase Auth check at function entry)
- Set via: `firebase functions:config:set anthropic.key="sk-ant-..."`

### Tool Definitions (shared between in-app assistant and MCP server)

Claude is given these tools:

```js
tools = [
  {
    name: "create_task",
    description: "Create a new task for the user",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        priority: { type: "string", enum: ["High", "Medium", "Low"] },
        category: { type: "string" },
        dueDate: { type: "string", description: "ISO date string, optional" }
      },
      required: ["text", "priority", "category"]
    }
  },
  {
    name: "complete_task",
    description: "Mark a task as complete by its ID",
    input_schema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"]
    }
  },
  {
    name: "delete_task",
    description: "Delete a task by its ID",
    input_schema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"]
    }
  },
  {
    name: "update_task",
    description: "Update a task's text, priority, category, or due date",
    input_schema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        text: { type: "string" },
        priority: { type: "string", enum: ["High", "Medium", "Low"] },
        category: { type: "string" },
        dueDate: { type: "string" }
      },
      required: ["taskId"]
    }
  },
  {
    name: "query_tasks",
    description: "Answer a question about the user's tasks (overdue, by category, completion stats, etc). Returns a natural language summary.",
    input_schema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"]
    }
  }
]
```

### System Prompt (Cloud Function)
```
You are a helpful assistant integrated into the user's personal to-do app.
You have access to their current task list (provided below) and can create, 
update, complete, and delete tasks on their behalf.

Be concise and conversational. Confirm actions you've taken. When answering 
questions about tasks, be specific (names, due dates, counts). Do not make 
up tasks that aren't in the list.

Current tasks:
{tasks_json}

Current date: {current_date}
```

### UI — Assistant Panel
- Slide-out drawer from the right (or bottom sheet on mobile)
- Chat bubble input at the bottom, messages scroll above
- Claude's messages show tool use results inline ("✓ Created task: Call the dentist")
- Typing indicator while waiting for response
- Persist chat history in component state (cleared on panel close — no need to store in Firestore)

### Example Interactions
- "What tasks are overdue?" → Claude queries the task list and summarizes
- "Add a high priority task to review the Q3 report, due next Monday" → Claude calls `create_task`
- "Mark the dentist task as done" → Claude fuzzy-matches the task and calls `complete_task`
- "How many tasks did I complete this week?" → Claude queries `completedTasks` and responds

**Acceptance Criteria:**
- [ ] Assistant panel opens/closes via persistent chat button
- [ ] User can send natural language messages
- [ ] Claude can create tasks (reflected immediately in task list)
- [ ] Claude can complete tasks (reflected immediately)
- [ ] Claude can delete tasks (with confirmation message before executing)
- [ ] Claude can answer questions about the current task list
- [ ] API key is never exposed client-side
- [ ] Only authenticated users can invoke the Cloud Function
- [ ] Loading/typing indicator shown while waiting for response
- [ ] Error state shown if Cloud Function call fails

---

## 6.8 MCP Server (Developer Integration)

A standalone Node.js server implementing the Model Context Protocol. When running, it allows Claude Code and claude.ai (with MCP configured) to read and write the user's tasks directly — useful for planning sessions, building features, and agentic workflows.

### Setup
```
mcp-server/
  package.json
  index.js       ← MCP server entry, HTTP/SSE transport
  tools.js       ← tool definitions (same as 6.7, adapted for MCP)
  firestore.js   ← Firebase Admin SDK Firestore access
  .env           ← FIREBASE_SERVICE_ACCOUNT, USER_UID (not committed)
```

### Tools Exposed
Same set as the in-app assistant: `list_tasks`, `create_task`, `complete_task`, `delete_task`, `update_task` — plus:
- `list_categories` — returns the user's categories
- `get_completion_stats` — returns completion counts by day/category for a date range

### Auth Model
The MCP server uses the **Firebase Admin SDK** with a service account. It operates on behalf of a single configured user (your UID in `.env`). This is a personal developer tool — not multi-user. Keep the `.env` and service account key out of the repo.

### Running Locally
```bash
cd mcp-server
npm install
node index.js
# Server runs at http://localhost:3333/sse
```

### Connecting to Claude Code
Add to your Claude Code MCP config (`~/.claude/mcp_servers.json` or `.claude/mcp_servers.json` in the repo):
```json
{
  "tiki-todo": {
    "type": "url",
    "url": "http://localhost:3333/sse"
  }
}
```

### Connecting to claude.ai
In claude.ai Settings → Integrations → Add MCP Server → enter `http://localhost:3333/sse`. Then this browser session can read and write your tasks directly.

**Acceptance Criteria:**
- [ ] MCP server starts without error
- [ ] `list_tasks` returns all active tasks for the configured user
- [ ] `create_task` creates a task in Firestore
- [ ] `complete_task` marks a task complete
- [ ] `delete_task` deletes a task
- [ ] `get_completion_stats` returns date-ranged completion data
- [ ] Service account key and user UID are in `.env`, not committed
- [ ] README in `mcp-server/` explains setup and Claude Code connection steps



### Phase 1 — Scaffolding & Auth
- Vite + React project setup
- Firebase v9 modular init (`src/lib/firebase.js`)
- Tailwind config with design system tokens
- Font imports (Playfair Display + DM Sans)
- `AppShell`, `NavBar`, `AuthScreen` components
- `useAuth` hook
- PWA config via `vite-plugin-pwa`

**Done when**: App loads, shows auth screen, user can sign in/out, nav tabs render.

---

### Phase 2 — Core Task Functionality
- `useTasks` hook (Firestore listener, CRUD)
- `useCategories` hook (localStorage)
- `TaskInput` component (with due date field)
- `TaskList` + `TaskItem` components
- `SubtaskList` component
- Two-step delete confirmation
- Completion animation
- Sort dropdown

**Done when**: Full task CRUD works, subtasks work, due dates display, overdue tasks flagged.

---

### Phase 3 — Task Edit Modal
- `TaskEditModal` component (Headless UI Dialog)
- Edit saves to Firestore
- All four fields editable

**Done when**: Edit button opens modal, changes persist.

---

### Phase 4 — Reporting
- `ReportingView` with date range filter
- `CompletedByDay` log component
- All 5 Recharts charts
- Empty states per chart

**Done when**: All charts render, date filter works across all views.

---

### Phase 6 — Claude In-App Assistant
- Firebase Cloud Function (`claudeChat`) with Anthropic API call
- Tool definitions for create/complete/delete/update/query
- `useAssistant` hook
- `AssistantPanel` component (drawer + chat UI)
- Wire tool responses back to Firestore + live task list

**Done when**: User can chat with Claude in the app, create and complete tasks via natural language, and ask questions about their task list. API key confirmed server-side only.

---

### Phase 7 — MCP Server
- `mcp-server/` package scaffolded
- Firebase Admin SDK connected
- All tools implemented and tested
- README with setup + Claude Code connection instructions

**Done when**: `node mcp-server/index.js` starts cleanly, Claude Code can list/create/complete tasks via MCP config, and claude.ai can connect to the local server.


- `CategoryManager` with color picker
- Replace Tailwind color class strings with hex values
- Toast notification system
- Skeleton loading states
- Empty state for task list
- Final animation pass (Framer Motion)
- PWA smoke test (install, offline, update banner)

**Done when**: App is fully polished, no `alert()`/`confirm()` anywhere, all animations in place.

---

## 11. Out of Scope (for this overhaul)

- Drag-to-reorder tasks
- Recurring tasks
- Push notifications / reminders
- Multi-user / sharing
- Dark/light mode toggle (dark is the default and only mode)
- Google/social auth (email/password only for now)
- MCP server deployed to cloud (local-only for now)

---

## 11. Key Files to Reference

The original app lives in the repo. Key reference files:
- `index.html` — original HTML structure and CSS
- `main.js` — all existing logic (auth, Firestore listener, task CRUD, reporting, categories)
- `sw.js` — existing service worker (being replaced by vite-plugin-pwa)
- `manifest.json` — existing PWA manifest (update icons section)
- `icons/` — all existing icons and logo; reuse as-is

---

*Brief version 1.0 — generated June 2026*
