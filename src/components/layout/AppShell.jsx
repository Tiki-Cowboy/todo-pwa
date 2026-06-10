import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from './NavBar'
import BottomNav from './BottomNav'
import UpdateBanner from './UpdateBanner'
import HomeTab from '../tasks/HomeTab'
import ReportingTab from '../reporting/ReportingTab'
import ConfigureTab from '../configure/ConfigureTab'
import AssistantPanel from '../assistant/AssistantPanel'
import ProjectsTab from '../projects/ProjectsTab'
import { useTasks } from '../../hooks/useTasks'
import { useCategories } from '../../hooks/useCategories'
import { useProjects } from '../../hooks/useProjects'
import { useDailyReset } from '../../hooks/useDailyReset'
import { SHOW_CLAUDE_FAB } from '../../config'

export default function AppShell({ user, onSignOut }) {
  const [activeTab, setActiveTab]         = useState('home')
  const [assistantOpen, setAssistantOpen] = useState(false)

  const {
    tasks, completedTasks, loading: tasksLoading,
    addTask, completeTask, completeSubtask, deleteTask, updateTask, addSubtask, toggleDailyTask,
  } = useTasks(user.uid)

  const { categories, loading: catsLoading, addCategory, deleteCategory } = useCategories(user.uid)
  const { projects, activeProjects, loading: projectsLoading, addProject, updateProject, archiveProject, deleteProject } = useProjects(user.uid)

  const loading = tasksLoading || catsLoading || projectsLoading

  const dailyProjectIds = useMemo(
    () => new Set(activeProjects.filter(p => p.type === 'daily').map(p => p.id)),
    [activeProjects]
  )

  useDailyReset(user.uid, tasks, dailyProjectIds)

  function renderTab() {
    if (loading) return <SkeletonLoader />
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            tasks={tasks}
            categories={categories}
            activeProjects={activeProjects}
            onComplete={completeTask}
            onCompleteSubtask={completeSubtask}
            onUpdate={updateTask}
            onToggleDailyTask={toggleDailyTask}
          />
        )
      case 'projects':
        return (
          <ProjectsTab
            tasks={tasks}
            categories={categories}
            projects={projects}
            activeProjects={activeProjects}
            onAdd={addTask}
            onAddSubtask={addSubtask}
            onComplete={(id, parentId) => parentId ? completeSubtask(id, parentId) : completeTask(id)}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onToggleDailyTask={toggleDailyTask}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        )
      case 'reporting':
        return <ReportingTab completedTasks={completedTasks} categories={categories} projects={projects} />
      case 'configure':
        return (
          <ConfigureTab
            categories={categories}
            onAdd={addCategory}
            onDelete={deleteCategory}
            projects={projects}
            onUpdateProject={updateProject}
            onArchiveProject={archiveProject}
            onDeleteProject={deleteProject}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      <NavBar user={user} onSignOut={onSignOut} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-6 pb-[88px] md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
