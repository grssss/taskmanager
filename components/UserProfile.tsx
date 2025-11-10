'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { WorkspaceState, Page, Workspace } from '@/lib/types'
import { LogOut, ChevronDown, Check, Plus, Trash2 } from 'lucide-react'
import { createPage } from '@/lib/pageUtils'

interface UserProfileProps {
  workspaceState: WorkspaceState
  onWorkspaceChange: (workspaceId: string) => void
  onWorkspaceStateChange: (
    value: WorkspaceState | ((prev: WorkspaceState) => WorkspaceState)
  ) => void
}

const randomId = () => Math.random().toString(36).slice(2, 10)

function createDefaultWorkspacePages(
  workspaceId: string,
  workspaceName: string
): Page[] {
  const overviewPage: Page = {
    ...createPage(workspaceId, `${workspaceName} Overview`, 'document'),
    position: 0,
    icon: '📘',
    content: [
      {
        id: `block-${randomId()}`,
        type: 'heading2',
        content: `${workspaceName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `block-${randomId()}`,
        type: 'paragraph',
        content: 'Capture plans, notes, and documents for this workspace.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }

  const boardPage: Page = {
    ...createPage(workspaceId, `${workspaceName} Board`, 'database'),
    position: 1,
    icon: '📋',
  }

  return [overviewPage, boardPage]
}

export default function UserProfile({
  workspaceState,
  onWorkspaceChange,
  onWorkspaceStateChange,
}: UserProfileProps) {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('🗂')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  if (!user) return null

  const activeWorkspace = workspaceState.workspaces.find(
    (workspace) => workspace.id === workspaceState.activeWorkspaceId
  )

  const workspaceCount = workspaceState.workspaces.length

  const hasMultipleWorkspaces = workspaceCount > 1

  const workspaceGroups = useMemo(() => {
    return workspaceState.workspaces.reduce<Record<string, Workspace[]>>(
      (acc, workspace) => {
        const [groupKey] = workspace.name.split(':')
        const group = groupKey.trim().length > 0 ? groupKey.trim() : 'General'
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(workspace)
        return acc
      },
      {}
    )
  }, [workspaceState.workspaces])

  const handleWorkspaceSelect = (workspaceId: string) => {
    onWorkspaceChange(workspaceId)
    setShowMenu(false)
  }

  const handleCreateWorkspace = () => {
    const trimmedName = newWorkspaceName.trim()
    if (!trimmedName) return

    const icon = newWorkspaceIcon.trim() || '🗂'
    const workspaceId = `workspace-${randomId()}`
    const now = new Date().toISOString()

    onWorkspaceStateChange((prev) => {
      const newWorkspace = {
        id: workspaceId,
        name: trimmedName,
        icon,
        createdAt: now,
        updatedAt: now,
      }

      const defaultPages = createDefaultWorkspacePages(workspaceId, trimmedName)
      const pages = { ...prev.pages }
      defaultPages.forEach((page) => {
        pages[page.id] = page
      })

      const primaryPageId =
        defaultPages.find((page) => page.type === 'database')?.id ||
        defaultPages[0]?.id

      return {
        ...prev,
        workspaces: [...prev.workspaces, newWorkspace],
        pages,
        activeWorkspaceId: workspaceId,
        activePageId: primaryPageId,
      }
    })

    setNewWorkspaceName('')
    setNewWorkspaceIcon('🗂')
    setIsCreatingWorkspace(false)
  }

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (workspaceState.workspaces.length <= 1) {
      alert('You need at least one workspace.')
      return
    }

    setIsDeleting(workspaceId)
    onWorkspaceStateChange((prev) => {
      const remainingWorkspaces = prev.workspaces.filter(
        (workspace) => workspace.id !== workspaceId
      )
      const filteredPages = Object.fromEntries(
        Object.entries(prev.pages).filter(
          ([, page]) => page.workspaceId !== workspaceId
        )
      )

      const deletedWasActive = prev.activeWorkspaceId === workspaceId

      const fallbackWorkspaceId = deletedWasActive
        ? remainingWorkspaces[0]?.id || prev.activeWorkspaceId
        : prev.activeWorkspaceId

      let nextActivePageId = prev.activePageId
      if (
        deletedWasActive ||
        (nextActivePageId &&
          prev.pages[nextActivePageId]?.workspaceId === workspaceId)
      ) {
        const fallbackPage = Object.values(filteredPages)
          .filter((page) => page.workspaceId === fallbackWorkspaceId)
          .sort((a, b) => a.position - b.position)[0]
        nextActivePageId = fallbackPage?.id
      }

      return {
        ...prev,
        workspaces: remainingWorkspaces,
        pages: filteredPages,
        activeWorkspaceId: fallbackWorkspaceId,
        activePageId: nextActivePageId,
      }
    })
    setIsDeleting(null)
  }

  const groupKeys = Object.keys(workspaceGroups)

  return (
    <>
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="fixed left-4 top-4 z-50 flex items-center gap-3 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-xl px-4 py-2.5 shadow-lg hover:border-white/20 transition-colors"
        title="Account settings"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="text-left">
          <p className="text-sm text-zinc-100 font-medium max-w-[160px] truncate">
            {user.email}
          </p>
          {activeWorkspace && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <span>{activeWorkspace.icon}</span>
              <span className="truncate max-w-[140px]">
                {activeWorkspace.name}
              </span>
            </p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
        />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed left-4 top-20 z-50 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-100 font-medium truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {workspaceState.workspaces.length > 0 && (
              <div className="border-b border-white/5">
                <div className="px-4 py-2 text-xs uppercase tracking-wide text-zinc-500 flex items-center justify-between">
                  <span>Workspaces</span>
                  <button
                    onClick={() => setIsCreatingWorkspace((prev) => !prev)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={14} />
                    <span>New</span>
                  </button>
                </div>

                {isCreatingWorkspace && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={newWorkspaceIcon}
                        onChange={(e) => setNewWorkspaceIcon(e.target.value)}
                        maxLength={4}
                        className="w-16 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-center text-lg"
                        placeholder="🗂"
                      />
                      <input
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm"
                        placeholder="e.g. Work: Forex PA"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateWorkspace}
                        className="flex-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                        disabled={!newWorkspaceName.trim()}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingWorkspace(false)
                          setNewWorkspaceName('')
                          setNewWorkspaceIcon('🗂')
                        }}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {groupKeys.map((group) => (
                  <div key={group} className="border-t border-white/5 first:border-t-0">
                    <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-zinc-500">
                      {group}
                    </p>
                    {workspaceGroups[group].map((workspace) => {
                      const isActive =
                        workspace.id === workspaceState.activeWorkspaceId
                      return (
                        <div
                          key={workspace.id}
                          className={`group flex items-center gap-3 px-4 py-2 text-sm ${
                            isActive
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'text-zinc-300 hover:bg-zinc-800/70'
                          }`}
                        >
                          <button
                            onClick={() => handleWorkspaceSelect(workspace.id)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            <span className="text-base">{workspace.icon}</span>
                            <span className="truncate">{workspace.name}</span>
                            {isActive && (
                              <Check
                                size={16}
                                className="text-green-400 shrink-0"
                              />
                            )}
                          </button>
                          {workspaceCount > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteWorkspace(workspace.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Delete workspace"
                              disabled={isDeleting === workspace.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                signOut()
                setShowMenu(false)
              }}
              className="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </>
  )
}
