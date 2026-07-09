# HANDOFF — Tiki To-Dos Feature Implementation
## Instructions for Claude Code
Implement the two features below sequentially. Complete Phase 1 fully before starting Phase 2. Each phase should leave the app in a shippable state. Check in after each phase.

---

# Feature 1: Project Status Note

## Overview
Add a short free-text `statusNote` field to each project. The note (2–5 sentences) is displayed on the collapsed project card in the Projects tab, giving a quick at-a-glance summary of where the project stands. Updated in-place — no history, no versioning.

## Data Model
- **Firestore**: Add optional `statusNote: string` field to the `projects` collection documents. No migration needed; absence of the field = no note set.

## UI — Projects Tab (Collapsed Card)
- Display `statusNote` beneath the project title and progress bar on the **collapsed** card.
- Truncate to **2 lines max** with CSS `line-clamp-2`; full text visible when card is expanded.
- Style: muted text (`text-sm`, reduced opacity or a lighter navy/gray tone), not bold. Should feel secondary to the project title.
- If `statusNote` is empty or unset, render nothing (no placeholder label, no empty space).

## UI — Edit Flow
- Add a `<textarea>` for Status Note in the existing project edit modal/drawer.
- Label: "Status Note"
- Placeholder: "Where does this project stand?"
- Max character count: 500 (soft limit with counter shown, not enforced as a hard block)
- No rich text — plain text only.
- Saves on modal confirm, same as other project fields.

## Acceptance Criteria
- [ ] `statusNote` persists to Firestore on save and loads correctly on refresh.
- [ ] Collapsed card shows note truncated to 2 lines; expanded card shows full note.
- [ ] Empty/unset note renders no visible element on the card.
- [ ] Editing and clearing the note (empty string) removes it from the card.
- [ ] Character counter visible in edit textarea.

## Complexity Estimate
Low — ~2–3 hours. No new data structures, no logic beyond CRUD.

## Dependencies
None.

---

# Feature 2: Follow-Up (FU) Reminder Chains

## Overview
Tasks can optionally be configured as **Follow-Up reminder chains** — when completed, they automatically spawn a successor task at a defined interval. Chains are finite (a defined sequence of steps), completion-triggered, and can use reusable templates or one-off sequences. When the final step completes, the user is prompted to extend or close out the chain.

## Terminology
- **FU Task**: A task that is part of a follow-up chain.
- **Sequence**: An ordered list of intervals (in days) defining the gaps between each step. e.g. `[7, 4, 10]` = first FU due 7 days after creation, next due 4 days after that one is completed, etc.
- **Step Index**: Which step in the sequence the current task represents (0-indexed).
- **Template**: A saved, reusable sequence stored in Configure tab.

## Data Model

### Task document additions (Firestore `tasks` collection)
```
fuChain: {
  enabled: boolean,                  // true if this task is part of a FU chain
  baseTitle: string,                 // original task name, stripped of any "FU: " prefix
  sequence: number[],                // array of day intervals, e.g. [7, 4, 10]
  stepIndex: number,                 // current step (0 = original task, 1 = first FU, etc.)
  templateId: string | null          // ref to FU template if one was used, else null
}
```

### New Firestore collection: `fuTemplates`
```
{
  id: string,
  name: string,           // e.g. "Weekly then taper"
  sequence: number[],     // e.g. [7, 4, 10]
  createdAt: timestamp
}
```

## Task Naming Convention
- Step 0 (original): user-defined name as-is.
- Step 1+: `"FU: [baseTitle]"` — always normalized, never stacked (strip any existing "FU: " prefix before prepending).

## Spawning Logic (on task completion)
When a FU-enabled task is marked complete:
1. Check `stepIndex` against `sequence.length - 1`.
2. **If not the final step**: silently create a new task with:
   - `title`: `"FU: [baseTitle]"`
   - `dueDate`: today + `sequence[stepIndex + 1]` days
   - `projectId`: inherited from parent task
   - `fuChain.enabled`: true
   - `fuChain.baseTitle`: same as parent
   - `fuChain.sequence`: same as parent
   - `fuChain.stepIndex`: `stepIndex + 1`
   - `fuChain.templateId`: same as parent
3. **If it is the final step**: show the **End-of-Chain modal** (see below).

Spawning should happen at the moment of completion (optimistic, client-side creation with Firestore write). No Cloud Function required for MVP.

## End-of-Chain Modal
Triggered when the last step in a sequence is completed.

Content:
- Title: "Follow-up chain complete"
- Body: "You've reached the end of this follow-up sequence for **[baseTitle]**. What would you like to do?"
- Buttons:
  - **"Add another follow-up"** → opens a small input to enter a new interval in days, then spawns one more task at that gap and closes the modal. The new task's `sequence` is extended by that value.
  - **"Close out"** → dismisses modal, chain ends. No new task created.

## UI — Task Creation / Edit

### Toggle
- Add a "Follow-up reminder" toggle in the task create/edit form, off by default.
- When toggled on, reveal the sequence builder UI below.

### Sequence Builder
- Display the sequence as a series of pill/chip inputs: each chip shows "+X days".
- User can add steps with an "+ Add step" button (opens a small day-count input).
- User can remove individual steps via an ✕ on each chip.
- Below the chips: a "Use a template" dropdown that populates chips from a saved template (overrides current chips; confirm if chips already exist).
- Minimum 1 step required if FU is enabled.

### Visual example of sequence builder (compact):
```
[+7 days ✕]  [+4 days ✕]  [+10 days ✕]   + Add step
[ Use a template ▾ ]
```

## UI — Task Card (Projects & Today tabs)
- FU tasks display a small chain-link icon (or similar) next to the title to indicate they're part of a chain.
- No other visual difference needed for MVP.

## Configure Tab — FU Templates
- Add a "Follow-Up Templates" section to the Configure tab.
- List existing templates with name + sequence summary (e.g. "Weekly then taper — 7, 4, 10 days").
- Add / delete templates. No edit — delete and recreate.
- Template name is required; sequence must have at least 1 step.

## Acceptance Criteria
- [ ] FU toggle appears in task create and edit forms, off by default.
- [ ] Sequence builder allows adding/removing day-interval steps.
- [ ] "Use a template" dropdown populates sequence from saved templates.
- [ ] On completion of a non-final FU task, a successor task is created in Firestore with correct title, due date, projectId, and chain metadata.
- [ ] Successor task name is always "FU: [baseTitle]" — never stacked.
- [ ] Successor task inherits parent's projectId.
- [ ] End-of-Chain modal appears on completion of the final step.
- [ ] "Add another follow-up" in modal creates one more task at the entered interval.
- [ ] "Close out" dismisses modal cleanly with no new task.
- [ ] FU Templates can be created and deleted in Configure tab.
- [ ] Chain-link icon visible on FU task cards.
- [ ] All FU data persists correctly to Firestore and survives page refresh.

## Complexity Estimate
Medium-High — ~1–2 days. Primary complexity is the sequence builder UI and the spawning logic edge cases (final step, normalization, modal flow).

## Dependencies
- Feature 1 (Project Status Note) should be complete first, but Feature 2 has no hard dependency on it.
- No dependency on recurring tasks feature.

## Implementation Order
1. Data model + Firestore writes (fuChain fields on tasks, fuTemplates collection)
2. FU toggle + sequence builder in task form
3. Template management in Configure tab
4. Spawning logic on task completion
5. End-of-Chain modal
6. Task card indicator icon