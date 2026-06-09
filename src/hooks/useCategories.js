import { useState, useEffect, useRef } from 'react'
import {
  subscribeToCategories,
  addCategory as fsAdd,
  deleteCategory as fsDelete,
  migrateCategories,
  seedDefaultCategories,
} from '../lib/firestore'

const LEGACY_KEY = 'todoPwaCategories_v2'

export function useCategories(uid) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const seeding                     = useRef(false)

  useEffect(() => {
    if (!uid) return
    return subscribeToCategories(uid, async cats => {
      if (cats.length === 0) {
        if (seeding.current) return
        seeding.current = true
        const legacy = localStorage.getItem(LEGACY_KEY)
        if (legacy) {
          try {
            await migrateCategories(uid, JSON.parse(legacy))
            localStorage.removeItem(LEGACY_KEY)
          } catch {
            await seedDefaultCategories(uid)
          }
        } else {
          await seedDefaultCategories(uid)
        }
        return // onSnapshot will fire again with seeded data
      }
      setCategories([...cats].sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })
  }, [uid])

  async function addCategory(name, color) {
    await fsAdd(uid, { name, color, isDefault: false })
  }

  async function deleteCategory(id, name) {
    await fsDelete(uid, id, name)
  }

  return { categories, loading, addCategory, deleteCategory }
}
