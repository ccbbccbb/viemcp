import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { type Address, type BlockTag, isAddress } from 'viem'
import type { ClientManager } from '../clientManager.js'
import { handleError, jsonResponse } from '../responses.js'
import type { LogParameters } from '../types.js'

export function registerPublicTools(
  server: McpServer,
  clientManager: ClientManager,
) {
  // Keep only explicit public primitive not covered by consolidated tools
  server.tool(
    'viemGetLogs',
    'Get logs by address/topics and block range',
    {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Contract address (optional)' },
        topics: { type: 'array', description: 'Array of topics (optional)' },
        fromBlock: {
          type: 'string',
          description: 'From block (tag or number)',
        },
        toBlock: { type: 'string', description: 'To block (tag or number)' },
        chain: { type: 'string', description: 'Chain to query' },
      },
      required: [],
    },
    async ({ address, topics, fromBlock, toBlock, chain }) => {
      try {
        const client = clientManager.getClient(chain)
        const params: LogParameters = {}
        if (address) {
          if (!isAddress(address)) {
            throw new Error('Invalid address')
          }
          ;(params as { address?: Address }).address = address as Address
        }
        if (Array.isArray(topics)) {
          ;(params as { topics?: unknown[] }).topics = topics as unknown[]
        }
        const parseBlock = (v?: string): bigint | BlockTag | undefined => {
          if (!v) {
            return undefined
          }
          if (/^\d+$/.test(v) || /^0x[0-9a-fA-F]+$/.test(v)) {
            return BigInt(v)
          }
          if (v === 'latest' || v === 'earliest' || v === 'pending') {
            return v as BlockTag
          }
          return undefined
        }
        const fb = parseBlock(fromBlock)
        if (fb !== undefined) {
          ;(params as { fromBlock?: bigint | BlockTag }).fromBlock = fb
        }
        const tb = parseBlock(toBlock)
        if (tb !== undefined) {
          ;(params as { toBlock?: bigint | BlockTag }).toBlock = tb
        }
        const logs = await client.getLogs(params)
        return jsonResponse({ count: logs.length, logs })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
