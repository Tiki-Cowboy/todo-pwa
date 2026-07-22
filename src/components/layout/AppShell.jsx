import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from './NavBar'
import BottomNav from './BottomNav'
import UpdateBanner from './UpdateBanner'
import HomeTab from '../tasks/HomeTab'
import ReportingTab from '../reporting/ReportingTab'
import AssistantPanel from '../assistant/AssistantPanel'
import ProjectsTab from '../projects/ProjectsTab'
import ProjectDetailView from '../projects/ProjectDetailView'
import EndOfChainModal from '../tasks/EndOfChainModal'
import { useTasks } from '../../hooks/useTasks'
import { useCategories } from '../../hooks/useCategories'
import { useProjects } from '../../hooks/useProjects'
import { useDailyReset } from '../../hooks/useDailyReset'
import { useFuTemplates } from '../../hooks/useFuTemplates'
import { migrateLegacyProjectTypes } from '../../lib/firestore'
import { SHOW_CLAUDE_FAB } from '../../config'

export default function AppShell({ user, onSignOut }) {
  const location = useLocation()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [chainInfo, setChainInfo]         = useState(null)

  const {
    tasks, completedTasks, loading: tasksLoading,
    addTask, completeTask, completeSubtask, deleteTask, updateTask, addSubtask, toggleDailyTask,
    completeFrequentTask, extendFuChain,
  } = useTasks(user.uid)

  const { categories, loading: catsLoading, addCategory, deleteCategory } = useCategories(user.uid)
  const { projects, activeProjects, loading: projectsLoading, addProject, updateProject, archiveProject, deleteProject } = useProjects(user.uid)
  const { templates: fuTemplates, addTemplate: addFuTemplate, deleteTemplate: deleteFuTemplate } = useFuTemplates(user.uid)

  const loading = tasksLoading || catsLoading || projectsLoading

  async function handleComplete(taskId) {
    const result = await completeTask(taskId)
    if (result?.chainComplete) setChainInfo(result)
  }

  async function handleCompleteSubtask(taskId, parentId) {
    const result = await completeSubtask(taskId, parentId)
    if (result?.chainComplete) setChainInfo(result)
  }

  // One-time: task type used to live on the project (pre-task-type Daily/Frequent). No-op once migrated.
  useEffect(() => { migrateLegacyProjectTypes(user.uid) }, [user.uid])

  useDailyReset(user.uid, tasks)

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      <NavBar user={user} onSignOut={onSignOut} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-6 pb-[88px] md:pb-8">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/today" replace />} />
                <Route
                  path="/today"
                  element={
                    <HomeTab
                      tasks={tasks}
                      completedTasks={completedTasks}
                      categories={categories}
                      activeProjects={activeProjects}
                      fuTemplates={fuTemplates}
                      onComplete={handleComplete}
                      onCompleteSubtask={handleCompleteSubtask}
                      onUpdate={updateTask}
                      onToggleDailyTask={toggleDailyTask}
                      onCompleteFrequentTask={completeFrequentTask}
                    />
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProjectsTab
                      tasks={tasks}
                      categories={categories}
                      projects={projects}
                      activeProjects={activeProjects}
                      fuTemplates={fuTemplates}
                      onAdd={addTask}
                      onAddSubtask={addSubtask}
                      onComplete={(id, parentId) => parentId ? handleCompleteSubtask(id, parentId) : handleComplete(id)}
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                      onAddProject={addProject}
                      onUpdateProject={updateProject}
                      onDeleteProject={deleteProject}
                      onToggleDailyTask={toggleDailyTask}
                      onCompleteFrequentTask={completeFrequentTask}
                      onAddCategory={addCategory}
                      onDeleteCategory={deleteCategory}
                      onAddFuTemplate={addFuTemplate}
                      onDeleteFuTemplate={deleteFuTemplate}
                    />
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <ProjectDetailView
                      tasks={tasks}
                      completedTasks={completedTasks}
                      projects={projects}
                      categories={categories}
                      activeProjects={activeProjects}
                      fuTemplates={fuTemplates}
                      onAdd={addTask}
                      onAddSubtask={addSubtask}
                      onComplete={(id, parentId) => parentId ? handleCompleteSubtask(id, parentId) : handleComplete(id)}
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                      onUpdateProject={updateProject}
                      onToggleDailyTask={toggleDailyTask}
                      onCompleteFrequentTask={completeFrequentTask}
                    />
                  }
                />
                <Route path="/reporting" element={<ReportingTab completedTasks={completedTasks} categories={categories} projects={projects} />} />
                <Route path="*" element={<Navigate to="/today" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {SHOW_CLAUDE_FAB && (
        <motion.button
          onClick={() => setAssistantOpen(true)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full shadow-2xl text-2xl flex items-center justify-center transition-colors"
          style={{ background: '#C4A24E' }}
          aria-label="Open assistant"
        >
          🤠
        </motion.button>
      )}

      <AssistantPanel
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      <EndOfChainModal
        chainInfo={chainInfo}
        onAddAnother={days => extendFuChain(chainInfo, days)}
        onClose={() => setChainInfo(null)}
      />

      <BottomNav />

      <UpdateBanner />
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3 pt-4">
      <div className="h-8 bg-white rounded-2xl w-40 mb-6" style={{ border: '1px solid rgba(12,26,51,0.06)' }} />
      <div className="h-24 bg-white rounded-2xl" style={{ border: '1px solid rgba(12,26,51,0.06)' }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-white rounded-2xl" style={{ border: '1px solid rgba(12,26,51,0.06)', opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  )
}
