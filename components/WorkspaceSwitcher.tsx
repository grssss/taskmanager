'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, Check, Plus, Edit2 } from 'lucide-react'
import { WorkspaceState } from '@/lib/types'
import Dialog from '@/components/Dialog'
import { WorkspaceInput, WorkspaceUpdateInput } from '@/lib/workspaceUtils'

interface WorkspaceSwitcherProps {
  workspaceState: WorkspaceState
  onWorkspaceChange: (workspaceId: string) => void
  onWorkspaceCreate: (input: WorkspaceInput) => void
  onWorkspaceEdit: (workspaceId: string, updates: WorkspaceUpdateInput) => void
}

const ICON_SUGGESTIONS = ['🗂️', '📝', '🚀', '🏢', '📚', '💼']

const DEFAULT_ICON = '🗂️'

export default function WorkspaceSwitcher({
  workspaceState,
  onWorkspaceChange,
  onWorkspaceCreate,
  onWorkspaceEdit,
}: WorkspaceSwitcherProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [iconInput, setIconInput] = useState(DEFAULT_ICON)

  const activeWorkspace = workspaceState.workspaces.find(
    (workspace) => workspace.id === workspaceState.activeWorkspaceId
  )

  const editingWorkspace = useMemo(
    () => workspaceState.workspaces.find((workspace) => workspace.id === editingId),
    [editingId, workspaceState.workspaces]
  )

  if (!activeWorkspace) return null

  const handleSelect = (workspaceId: string) => {
    onWorkspaceChange(workspaceId)
    setMenuOpen(false)
  }

  const handleCreateClick = () => {
    setEditingId(null)
    setNameInput('')
    setIconInput(DEFAULT_ICON)
    setMenuOpen(false)
    setFormOpen(true)
  }

  const handleEditClick = (workspaceId: string) => {
    const workspace = workspaceState.workspaces.find((w) => w.id === workspaceId)
    if (!workspace) return
    setEditingId(workspaceId)
    setNameInput(workspace.name)
    setIconInput(workspace.icon || DEFAULT_ICON)
    setMenuOpen(false)
    setFormOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setNameInput('')
    setIconInput(DEFAULT_ICON)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = nameInput.trim()
    const trimmedIcon = iconInput.trim() || DEFAULT_ICON

    if (editingId) {
      onWorkspaceEdit(editingId, {
        name: trimmedName || undefined,
        icon: trimmedIcon,
      })
    } else {
      onWorkspaceCreate({
        name: trimmedName || 'New workspace',
        icon: trimmedIcon,
      })
    }

    setFormOpen(false)
    resetForm()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-zinc-100 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>{activeWorkspace.icon}</span>
          <span className="truncate max-w-[160px]">{activeWorkspace.name}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform ${
            menuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto py-1">
              {workspaceState.workspaces.map((workspace) => {
                const isActive = workspace.id === workspaceState.activeWorkspaceId
                return (
                  <div
                    key={workspace.id}
                    className={`flex items-center px-2 ${
                      isActive ? 'bg-zinc-800/80' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(workspace.id)}
                      className={`flex-1 flex items-center gap-2 px-1 py-2 text-sm text-left transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span>{workspace.icon}</span>
                      <span className="truncate flex-1">{workspace.name}</span>
                      {isActive && <Check size={14} className="text-green-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEditClick(workspace.id)
                      }}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={`Edit ${workspace.name}`}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-white/5">
              <button
                onClick={handleCreateClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <Plus size={14} />
                New workspace
              </button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          resetForm()
        }}
        title={editingWorkspace ? 'Edit workspace' : 'Create workspace'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Workspace name
            </label>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="My workspace"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-200">
              Icon
            </label>
            <div className="flex items-center gap-2">
              <input
                value={iconInput}
                onChange={(event) => setIconInput(event.target.value)}
                maxLength={4}
                className="w-16 text-center rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-lg outline-none focus:border-white/30"
              />
              <div className="flex flex-wrap gap-2">
                {ICON_SUGGESTIONS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setIconInput(icon)}
                    className={`rounded-lg border px-2 py-1 text-lg ${
                      iconInput === icon
                        ? 'border-white/50 bg-white/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                resetForm()
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-white/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
            >
              {editingWorkspace ? 'Save changes' : 'Create workspace'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
