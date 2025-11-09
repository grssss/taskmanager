'use client'

import { useAuth } from '@/lib/AuthContext'
import { LogOut, User } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function UserProfile() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="fixed left-4 top-4 z-50 flex items-center gap-3">
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 shadow-sm">
        <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        <span className="text-sm text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="ml-2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
        </button>
      </div>
      <ThemeToggle />
    </div>
  )
}
