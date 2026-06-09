import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

const claudeChat = httpsCallable(functions, 'claudeChat', { timeout: 70000 })

export function useAssistant() {
  // Simple text messages only — API complexity lives in the Cloud Function
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content: string }
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const sendMessage = useCallback(async (text) => {
    const userMsg    = { role: 'user', content: text }
    const nextMsgs   = [...messages, userMsg]
    setMessages(nextMsgs)
    setLoading(true)
    setError(null)

    try {
      const result = await claudeChat({ messages: nextMsgs })
      const { text: responseText } = result.data
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }])
    } catch (err) {
      // Roll back optimistic user message
      setMessages(prev => prev.slice(0, -1))
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [messages])

  function clearHistory() {
    setMessages([])
    setError(null)
  }

  return { messages, loading, error, sendMessage, clearHistory }
}
