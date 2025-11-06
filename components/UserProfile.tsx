'use client'

import { useAuth } from '@/lib/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function UserProfile() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="fixed left-4 top-4 z-50 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-md">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground max-w-[150px] truncate">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="ml-2 p-1 hover:bg-accent rounded transition-colors"
        title="Sign out"
      >
        <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  )
}
