import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import Anthropic from '@anthropic-ai/sdk'

initializeApp()

const TOOLS = [
  {
    name: 'create_task',
    description: 'Create a new task for the user.',
    input_schema: {
      type: 'object',
      properties: {
        text:     { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
        category: { type: 'string', description: 'Category name (must match an existing category)' },
        dueDate:  { type: 'string', description: 'Optional due date as YYYY-MM-DD' },
      },
      required: ['text', 'priority', 'category'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as complete by its ID.',
    input_schema: {
      type: 'object',
      properties: { taskId: { type: 'string', description: 'The task ID from the task list' } },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task by its ID.',
    input_schema: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId'],
    },
  },
  {
    name: 'update_task',
    description: "Update a task's text, priority, category, or due date.",
    input_schema: {
      type: 'object',
      properties: {
        taskId:   { type: 'string' },
        text:     { type: 'string' },
        priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
        category: { type: 'string' },
        dueDate:  { type: 'string', description: 'YYYY-MM-DD, or empty string to clear' },
      },
      required: ['taskId'],
    },
  },
]

async function executeTool(name, input, uid, db) {
  const tasksRef = db.collection('users').doc(uid).collection('tasks')

  switch (name) {
    case 'create_task': {
      const ref = await tasksRef.add({
        text:        input.text,
        priority:    input.priority,
        category:    input.category,
        dueDate:     input.dueDate || null,
        parentId:    null,
        createdAt:   FieldValue.serverTimestamp(),
        completedAt: null,
      })
      return { success: true, taskId: ref.id }
    }
    case 'complete_task': {
      await tasksRef.doc(input.taskId).update({ completedAt: new Date() })
      return { success: true }
    }
    case 'delete_task': {
      await tasksRef.doc(input.taskId).delete()
      return { success: true }
    }
    case 'update_task': {
      const updates = {}
      if (input.text     !== undefined) updates.text     = input.text
      if (input.priority !== undefined) updates.priority = input.priority
      if (input.category !== undefined) updates.category = input.category
      if (input.dueDate  !== undefined) updates.dueDate  = input.dueDate || null
      await tasksRef.doc(input.taskId).update(updates)
      return { success: true }
    }
    default:
      return { success: false, error: `Unknown tool: ${name}` }
  }
}

export const claudeChat = onCall({ timeoutSeconds: 60, memory: '256MiB', secrets: ['ANTHROPIC_API_KEY'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in to use the assistant.')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new HttpsError('internal', 'Assistant not configured — ANTHROPIC_API_KEY missing.')
  }

  const uid = request.auth.uid
  const { messages: history = [] } = request.data

  const db = getFirestore()

  // Fetch current tasks for context
  const snap = await db.collection('users').doc(uid).collection('tasks').get()
  const allTasks = snap.docs.map(d => {
    const data = d.data()
    return {
      id:          d.id,
      text:        data.text,
      priority:    data.priority,
      category:    data.category,
      dueDate:     data.dueDate ?? null,
      parentId:    data.parentId ?? null,
      completed:   !!data.completedAt,
      completedAt: data.completedAt?.toDate?.()?.toISOString() ?? null,
    }
  })

  const activeTasks  = allTasks.filter(t => !t.completed)
  const recentlyDone = allTasks.filter(t =>  t.completed).slice(-20)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const systemPrompt =
    `You are a helpful assistant built into Tiki Cowboy To-Dos, a personal task management app.\n\n` +
    `You have access to the user's task list and can create, update, complete, and delete tasks. ` +
    `Be concise and conversational. Confirm actions taken. When answering questions, be specific. ` +
    `Do not reference tasks that aren't in the list.\n\n` +
    `Today: ${today}\n\n` +
    `Active tasks (${activeTasks.length}):\n${JSON.stringify(activeTasks, null, 2)}\n\n` +
    `Recently completed (last 20):\n${JSON.stringify(recentlyDone, null, 2)}`

  const client = new Anthropic({ apiKey })

  // Build API messages from the simple history (role + string content)
  let msgs = history.map(m => ({ role: m.role, content: m.content }))

  // Agentic loop — runs until Claude stops using tools
  while (true) {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      system:     systemPrompt,
      tools:      TOOLS,
      messages:   msgs,
    })

    msgs.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text')?.text ?? ''
      return { text }
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults = []
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue
        const result = await executeTool(block.name, block.input, uid, db)
        toolResults.push({
          type:        'tool_result',
          tool_use_id: block.id,
          content:     JSON.stringify(result),
        })
      }
      msgs.push({ role: 'user', content: toolResults })
      continue
    }

    throw new HttpsError('internal', `Unexpected stop reason: ${response.stop_reason}`)
  }
})
