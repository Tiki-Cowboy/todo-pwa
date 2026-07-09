import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToProjects,
  addProject as fsAddProject,
  updateProject as fsUpdateProject,
  deleteProject as fsDeleteProject,
} from '../lib/firestore'

export function useProjects(uid) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!uid) return
    const unsub = subscribeToProjects(uid, docs => {
      setProjects(docs)
      setLoading(false)
    })
    return unsub
  }, [uid])

  const addProject = useCallback(
    data => fsAddProject(uid, data),
    [uid]
  )

  const updateProject = useCallback(
    (projectId, updates) => fsUpdateProject(uid, projectId, updates),
    [uid]
  )

  const archiveProject = useCallback(
    projectId => fsUpdateProject(uid, projectId, { status: 'archived' }),
    [uid]
  )

  const deleteProject = useCallback(
    projectId => fsDeleteProject(uid, projectId),
    [uid]
  )

  const getProjectById = useCallback(
    projectId => projects.find(p => p.id === projectId),
    [projects]
  )

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'on-hold')

  return {
    projects,
    activeProjects,
    loading,
    addProject,
    updateProject,
    archiveProject,
    deleteProject,
    getProjectById,
  }
}
