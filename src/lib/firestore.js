import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  writeBatch, getDocs, getDoc, setDoc, where,
} from 'firebase/firestore'
import { db } from './firebase'

const tasksRef       = uid => collection(db, 'users', uid, 'tasks')
const categoriesRef  = uid => collection(db, 'users', uid, 'categories')
const projectsRef    = uid => collection(db, 'users', uid, 'projects')
const fuTemplatesRef = uid => collection(db, 'users', uid, 'fuTemplates')
const userDocRef     = uid => doc(db, 'users', uid)

function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDaysISO(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function subscribeToTasks(uid, callback) {
  return onSnapshot(query(tasksRef(uid), orderBy('createdAt', 'asc')), snapshot => {
    const docs = snapshot.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        createdAt:   data.createdAt?.toDate()   ?? new Date(),
        completedAt: data.completedAt?.toDate()  ?? null,
      }
    })
    callback(docs)
  })
}

export function subscribeToCategories(uid, callback) {
  return onSnapshot(query(categoriesRef(uid)), snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function addTask(uid, { text, priority, category, dueDate = null, parentId = null, projectId = null, fuChain = null }) {
  await addDoc(tasksRef(uid), {
    text, priority, category, dueDate, parentId, projectId, fuChain,
    createdAt: serverTimestamp(),
    completedAt: null,
    lastCompletedDate: null,
  })
}

// Spawns the next step of a Follow-Up chain, based on the task that was just completed.
export async function spawnFollowUpTask(uid, { fuChain, projectId, category, priority }) {
  const nextIndex = fuChain.stepIndex + 1
  await addTask(uid, {
    text: `FU: ${fuChain.baseTitle}`,
    priority, category,
    dueDate: addDaysISO(fuChain.sequence[nextIndex]),
    projectId: projectId ?? null,
    fuChain: {
      enabled: true,
      baseTitle: fuChain.baseTitle,
      sequence: fuChain.sequence,
      stepIndex: nextIndex,
      templateId: fuChain.templateId ?? null,
    },
  })
}

export async function setDailyTaskCompletion(uid, taskId, date) {
  await updateDoc(doc(tasksRef(uid), taskId), { lastCompletedDate: date })
}

export async function getLastResetDate(uid) {
  const snap = await getDoc(userDocRef(uid))
  return snap.exists() ? (snap.data().lastResetDate ?? null) : null
}

export async function resetDailyTasks(uid, taskIds) {
  const batch = writeBatch(db)
  taskIds.forEach(id => batch.update(doc(tasksRef(uid), id), { lastCompletedDate: null }))
  await batch.commit()
  await setDoc(userDocRef(uid), { lastResetDate: localDateStr() }, { merge: true })
}

export async function updateTask(uid, taskId, updates) {
  await updateDoc(doc(tasksRef(uid), taskId), updates)
}

export async function completeTask(uid, taskId, subtaskIds = []) {
  const batch = writeBatch(db)
  const now = new Date()
  batch.update(doc(tasksRef(uid), taskId), { completedAt: now })
  subtaskIds.forEach(id => batch.update(doc(tasksRef(uid), id), { completedAt: now }))
  await batch.commit()
}

export async function deleteTask(uid, taskId, subtaskIds = []) {
  const batch = writeBatch(db)
  batch.delete(doc(tasksRef(uid), taskId))
  subtaskIds.forEach(id => batch.delete(doc(tasksRef(uid), id)))
  await batch.commit()
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function subscribeToProjects(uid, callback) {
  return onSnapshot(query(projectsRef(uid), orderBy('createdAt', 'asc')), snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addProject(uid, {
  name, categoryName, status = 'active', description = '', type = 'standard',
  statusNote = '',
  dealName = null, dealUrl = null, contactName = null, contactUrl = null,
}) {
  await addDoc(projectsRef(uid), {
    name, categoryName, status, description, type, statusNote,
    dealName, dealUrl, contactName, contactUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProject(uid, projectId, updates) {
  await updateDoc(doc(projectsRef(uid), projectId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProject(uid, projectId) {
  const batch = writeBatch(db)
  // Null out projectId on all tasks belonging to this project
  const snap = await getDocs(query(tasksRef(uid), where('projectId', '==', projectId)))
  snap.forEach(d => batch.update(d.ref, { projectId: null }))
  batch.delete(doc(projectsRef(uid), projectId))
  await batch.commit()
}

// ── FU Templates ──────────────────────────────────────────────────────────────

export function subscribeToFuTemplates(uid, callback) {
  return onSnapshot(query(fuTemplatesRef(uid), orderBy('createdAt', 'asc')), snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addFuTemplate(uid, { name, sequence }) {
  await addDoc(fuTemplatesRef(uid), { name, sequence, createdAt: serverTimestamp() })
}

export async function deleteFuTemplate(uid, templateId) {
  await deleteDoc(doc(fuTemplatesRef(uid), templateId))
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function addCategory(uid, { name, color, isDefault = false }) {
  await addDoc(categoriesRef(uid), { name, color, isDefault })
}

export async function deleteCategory(uid, categoryId, categoryName) {
  const batch = writeBatch(db)
  const snap = await getDocs(query(tasksRef(uid), where('category', '==', categoryName)))
  snap.forEach(d => batch.update(d.ref, { category: 'Uncategorized' }))
  batch.delete(doc(categoriesRef(uid), categoryId))
  await batch.commit()
}

// One-time migration: old localStorage categories → Firestore
const LEGACY_COLOR_MAP = {
  'bg-gray-100':   '#8b9eb5',
  'bg-purple-100': '#9b7fd4',
  'bg-blue-100':   '#5b9bd5',
  'bg-green-100':  '#3db07a',
  'bg-yellow-100': '#e8a020',
  'bg-red-100':    '#e05050',
  'bg-pink-100':   '#f472b6',
  'bg-indigo-100': '#818cf8',
}
const DEFAULT_NAMES = new Set(['Personal', 'Work'])

export async function migrateCategories(uid, legacyCategories) {
  const batch = writeBatch(db)
  legacyCategories.forEach(cat => {
    const ref = doc(categoriesRef(uid))
    batch.set(ref, {
      name:      cat.name,
      color:     LEGACY_COLOR_MAP[cat.color] ?? '#7a9a8a',
      isDefault: DEFAULT_NAMES.has(cat.name),
    })
  })
  await batch.commit()
}

export async function seedDefaultCategories(uid) {
  const batch = writeBatch(db)
  ;[
    { name: 'Personal', color: '#5b9bd5', isDefault: true },
    { name: 'Work',     color: '#9b7fd4', isDefault: true },
  ].forEach(cat => batch.set(doc(categoriesRef(uid)), cat))
  await batch.commit()
}
