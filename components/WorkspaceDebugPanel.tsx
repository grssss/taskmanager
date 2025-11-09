'use client'

import { useState } from 'react'
import { WorkspaceState } from '@/lib/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface WorkspaceDebugPanelProps {
  workspaceState: WorkspaceState
  onFix?: () => void
}

export default function WorkspaceDebugPanel({ workspaceState, onFix }: WorkspaceDebugPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors z-50"
      >
        🔧 Debug Data
      </button>
    )
  }

  const { activeWorkspaceId, activePageId, workspaces, pages } = workspaceState
  const pagesArray = Object.values(pages)
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const rootPages = pagesArray.filter(p => p.workspaceId === activeWorkspaceId && !p.parentPageId)
  const orphanedPages = pagesArray.filter(p => p.workspaceId !== activeWorkspaceId || (p.parentPageId && !pages[p.parentPageId]))

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xl p-4 max-w-2xl max-h-[80vh] overflow-auto z-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          🔧 Workspace Debug Panel
        </h2>
        <button
          onClick={() => setExpanded(false)}
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-sm">
        {/* Active Workspace Info */}
        <Section title="Active Workspace">
          <div className="space-y-1">
            <div><strong>ID:</strong> <code>{activeWorkspaceId || 'NONE'}</code></div>
            <div><strong>Name:</strong> {activeWorkspace?.name || <span className="text-red-500">NOT FOUND</span>}</div>
            <div><strong>Total Workspaces:</strong> {workspaces.length}</div>
          </div>
        </Section>

        {/* Pages Overview */}
        <Section title="Pages Overview">
          <div className="space-y-1">
            <div><strong>Total Pages:</strong> {pagesArray.length}</div>
            <div><strong>Root Pages (visible in sidebar):</strong> <span className={rootPages.length === 0 ? 'text-red-500 font-bold' : 'text-green-500'}>{rootPages.length}</span></div>
            <div><strong>Orphaned Pages:</strong> <span className={orphanedPages.length > 0 ? 'text-orange-500 font-bold' : ''}>{orphanedPages.length}</span></div>
          </div>
        </Section>

        {/* Root Pages (What should show in sidebar) */}
        {rootPages.length > 0 && (
          <Section title="Root Pages (Should Show in Sidebar)">
            <div className="space-y-2">
              {rootPages.map(page => (
                <div key={page.id} className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                  <div><strong>{page.icon} {page.title}</strong></div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">ID: {page.id}</div>
                  <div className="text-xs">Type: {page.type} | Position: {page.position}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Orphaned Pages (Problem pages) */}
        {orphanedPages.length > 0 && (
          <Section title="⚠️ Orphaned Pages (NOT showing)">
            <div className="space-y-2">
              {orphanedPages.map(page => (
                <div key={page.id} className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                  <div><strong>{page.icon} {page.title}</strong></div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">ID: {page.id}</div>
                  <div className="text-xs">WorkspaceId: <code>{page.workspaceId}</code> {page.workspaceId !== activeWorkspaceId && <span className="text-red-500">(MISMATCH!)</span>}</div>
                  <div className="text-xs">ParentPageId: {page.parentPageId || 'none'} {page.parentPageId && !pages[page.parentPageId] && <span className="text-red-500">(INVALID!)</span>}</div>
                  <div className="text-xs">Type: {page.type} | Position: {page.position}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* All Workspaces */}
        <Section title="All Workspaces">
          <div className="space-y-2">
            {workspaces.map(ws => (
              <div key={ws.id} className={`p-2 rounded border ${ws.id === activeWorkspaceId ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                <div><strong>{ws.icon} {ws.name}</strong></div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">ID: {ws.id}</div>
                <div className="text-xs">Pages in this workspace: {pagesArray.filter(p => p.workspaceId === ws.id).length}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Raw Data */}
        <Section title="Raw Data (JSON)">
          <pre className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(workspaceState, null, 2)}
          </pre>
        </Section>

        {/* Fix Button */}
        {onFix && orphanedPages.length > 0 && (
          <button
            onClick={onFix}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            🔧 Auto-Fix Orphaned Pages
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded p-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
