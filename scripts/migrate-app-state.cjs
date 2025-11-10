/* eslint-disable @typescript-eslint/no-require-imports */
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node'
})

require('ts-node/register/transpile-only')

const { readFileSync, writeFileSync } = require('fs')
const { ensureWorkspaceState } = require('../lib/migrations')

/**
 * Reads legacy app_state JSON from app_state.json (repo root),
 * converts it to the new WorkspaceState shape, and writes it to workspace-state.json.
 */
function main() {
  const sourcePath = 'app_state.json'
  const outputPath = 'workspace-state.json'

  const raw = readFileSync(sourcePath, 'utf-8')
  const parsed = JSON.parse(raw)

  const { state: workspaceState, migrated } = ensureWorkspaceState(parsed)

  writeFileSync(outputPath, JSON.stringify(workspaceState, null, 2))
  console.log(
    `Workspace state written to ${outputPath}. migrated=${migrated ? 'yes' : 'no'}`
  )
}

main()
