'use client'

import { useAuth } from '@/lib/AuthContext'

export default function UserProfile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
        {user.email?.charAt(0).toUpperCase()}
      </div>
      <p className="text-sm text-zinc-50 font-medium truncate max-w-[200px]">
        {user.email}
      </p>
    </div>
  )
}
