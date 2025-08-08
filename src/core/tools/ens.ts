// Consolidated ENS support exists via viemEnsInfo; keep this module as a no-op to retain API surface
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ClientManager } from '../clientManager.js'

export function registerEnsTools(
  _server: McpServer,
  _clientManager: ClientManager,
) {
  // no-op
}
