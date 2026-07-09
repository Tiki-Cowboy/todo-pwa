import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToFuTemplates,
  addFuTemplate as fsAdd,
  deleteFuTemplate as fsDelete,
} from '../lib/firestore'

export function useFuTemplates(uid) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!uid) return
    return subscribeToFuTemplates(uid, docs => {
      setTemplates(docs)
      setLoading(false)
    })
  }, [uid])

  const addTemplate = useCallback(
    (name, sequence) => fsAdd(uid, { name, sequence }),
    [uid]
  )

  const deleteTemplate = useCallback(
    templateId => fsDelete(uid, templateId),
    [uid]
  )

  return { templates, loading, addTemplate, deleteTemplate }
}
