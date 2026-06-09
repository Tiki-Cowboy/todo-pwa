import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/auth/AuthScreen'
import AppShell from './components/layout/AppShell'
import { ToastProvider } from './components/ui/Toast'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/icons/siteimage.png" alt="Tiki Cowboy" className="w-20 h-20 object-contain opacity-60 animate-pulse" />
        <p className="text-text-muted text-sm">Loading…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, signIn, signUp, signOut } = useAuth()

  if (user === undefined) return <LoadingScreen />
  if (user === null)      return <AuthScreen onSignIn={signIn} onSignUp={signUp} />

  return (
    <ToastProvider>
      <AppShell user={user} onSignOut={signOut} />
    </ToastProvider>
  )
}
