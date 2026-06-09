import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-surface border border-accent rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl"
        >
          <span className="text-sm text-text">A new version is available.</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-sm font-semibold bg-accent hover:bg-accent-light text-bg px-4 py-1.5 rounded-lg transition"
          >
            Update
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
