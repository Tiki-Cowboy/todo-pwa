import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'

export default function EndOfChainModal({ chainInfo, onAddAnother, onClose }) {
  const [addingMore, setAddingMore] = useState(false)
  const [days, setDays]             = useState('')

  function handleClose() {
    setAddingMore(false)
    setDays('')
    onClose()
  }

  function handleAddAnother(e) {
    e.preventDefault()
    const n = parseInt(days, 10)
    if (!n || n < 1) return
    onAddAnother(n)
    handleClose()
  }

  return (
    <AnimatePresence>
      {!!chainInfo && (
        <Dialog static open={!!chainInfo} onClose={handleClose} className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              className="w-full sm:max-w-sm"
            >
              <DialogPanel
                className="w-full bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
                style={{ border: '1px solid rgba(12, 26, 51, 0.06)' }}
              >
                <DialogTitle className="text-lg font-semibold text-text-primary mb-2">
                  Follow-up chain complete
                </DialogTitle>
                <p className="text-sm text-text-secondary leading-snug mb-5">
                  You've reached the end of this follow-up sequence for <strong>{chainInfo?.baseTitle}</strong>. What would you like to do?
                </p>

                {addingMore ? (
                  <form onSubmit={handleAddAnother} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Follow up again in how many days?
                      </label>
                      <input
                        autoFocus
                        type="number"
                        min="1"
                        value={days}
                        onChange={e => setDays(e.target.value)}
                        placeholder="e.g. 7"
                        className="w-full bg-page-bg border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold"
                        style={{ borderColor: 'rgba(12,26,51,0.12)' }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAddingMore(false)}
                        className="flex-1 font-semibold py-2.5 rounded-xl border transition text-text-secondary"
                        style={{ borderColor: 'rgba(12,26,51,0.12)', background: '#F4F2ED' }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!days || parseInt(days, 10) < 1}
                        className="flex-1 font-semibold py-2.5 rounded-xl transition disabled:opacity-50 text-white"
                        style={{ background: '#C4A24E' }}
                      >
                        Add follow-up
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 font-semibold py-2.5 rounded-xl border transition text-text-secondary"
                      style={{ borderColor: 'rgba(12,26,51,0.12)', background: '#F4F2ED' }}
                    >
                      Close out
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingMore(true)}
                      className="flex-1 font-semibold py-2.5 rounded-xl transition text-white"
                      style={{ background: '#C4A24E' }}
                    >
                      Add another follow-up
                    </button>
                  </div>
                )}
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
