import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAssistant } from '../../hooks/useAssistant'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-page-bg rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center"
           style={{ border: '1px solid rgba(12,26,51,0.08)' }}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: '#8B93A1' }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

export default function AssistantPanel({ isOpen, onClose }) {
  const { messages, loading, error, sendMessage, clearHistory } = useAssistant()
  const [input, setInput]  = useState('')
  const messagesEndRef     = useRef(null)
  const inputRef           = useRef(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleClose() {
    clearHistory()
    onClose()
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    await sendMessage(text)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          />

          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-white flex flex-col shadow-2xl"
            style={{ borderLeft: '1px solid rgba(12,26,51,0.08)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(12,26,51,0.08)', background: '#F4F2ED' }}
            >
              <div>
                <h3 className="font-semibold text-text-primary">Assistant</h3>
                <p className="text-xs text-text-tertiary">Ask anything or give a command</p>
              </div>
              <button
                onClick={handleClose}
                className="text-text-tertiary hover:text-text-secondary transition w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(12,26,51,0.04)' }}
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-text-tertiary py-10 px-4"
                >
                  <p className="text-4xl mb-3">🤠</p>
                  <p className="text-base text-text-primary font-medium mb-2">Howdy, partner.</p>
                  <p className="text-sm leading-relaxed">
                    Ask me what's overdue, tell me to add a task, or say "what did I finish this week?" — I've got your list right here.
                  </p>
                  <div className="mt-5 space-y-2 text-left">
                    {[
                      'What tasks are overdue?',
                      'Add "Call dentist" — high priority, Personal',
                      'How many tasks did I finish this week?',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus() }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg text-text-tertiary hover:text-text-secondary transition"
                        style={{ background: 'rgba(12,26,51,0.04)', border: '1px solid rgba(12,26,51,0.08)' }}
                      >
                        "{s}"
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={
                        msg.role === 'user'
                          ? { background: '#C4A24E', color: 'white', borderRadius: '16px 16px 4px 16px', fontWeight: 500 }
                          : { background: '#F4F2ED', color: '#0C1A33', border: '1px solid rgba(12,26,51,0.08)', borderRadius: '16px 16px 16px 4px' }
                      }
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && <TypingIndicator />}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center py-2"
                  style={{ color: '#C0392B' }}
                >
                  {error}
                </motion.p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="px-4 py-4 flex gap-2 shrink-0"
              style={{ borderTop: '1px solid rgba(12,26,51,0.08)' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask or command…"
                disabled={loading}
                className="flex-1 bg-page-bg border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold transition disabled:opacity-50"
                style={{ borderColor: 'rgba(12,26,51,0.12)' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 shrink-0 text-white"
                style={{ background: '#C4A24E' }}
              >
                →
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
