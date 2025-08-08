#!/usr/bin/env node

import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  type Abi,
  type Address,
  formatEther,
  isAddress,
  keccak256,
  parseEther,
  toHex,
} from 'viem'
import { ClientManager } from './core/clientManager.js'
import { registerEVMPrompts } from './core/prompts.js'
import { setupGithubDocsResources } from './core/resources/docs.js'
import { handleError, jsonResponse, textResponse } from './core/responses.js'
import { registerConsolidatedTools } from './core/tools/consolidated.js'
import {
  FormatEtherSchema,
  IsAddressSchema,
  Keccak256Schema,
  ParseEtherSchema,
  validateInput,
  // GetBlockSchema,
  // GetTransactionReceiptSchema,
  // GetGasPriceSchema,
  // EstimateGasSchema,
  // GetChainIdSchema,
  // SimulateContractSchema,
  // EstimateContractGasSchema,
  // MulticallSchema,
  // GetCodeSchema,
  // GetStorageAtSchema,
  // GetERC20MetadataSchema,
  // GetERC20AllowanceSchema,
  // GetEnsNameSchema,
  // PrepareTransactionRequestSchema,
  // EncodeFunctionDataSchema,
  // EncodeDeployDataSchema,
} from './core/validation.js'

// RPC URL resolution moved to core/chains.ts

const clientManager = new ClientManager()

// Create server instance
const server = new McpServer(
  {
    name: 'viemcp',
    version: '0.0.4',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
)

// Helper to stringify JSON with BigInt support (prefix underscore to avoid unused rule)
function _toJsonString(data: unknown) {
  return JSON.stringify(
    data,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  )
}

// Utility Tools
server.tool(
  'viemParseEther',
  'Convert ETH to wei',
  {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: 'ETH amount',
      },
    },
    required: ['value'],
  },
  async (params) => {
    try {
      const { value } = validateInput(ParseEtherSchema, params)
      const wei = parseEther(value)
      return textResponse(`${value} ETH = ${wei.toString()} wei`)
    } catch (error) {
      return handleError(error)
    }
  },
)

server.tool(
  'viemFormatEther',
  'Convert wei to ETH',
  {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: 'Wei amount',
      },
    },
    required: ['value'],
  },
  async (params) => {
    try {
      const { value } = validateInput(FormatEtherSchema, params)
      const eth = formatEther(BigInt(value))
      return textResponse(`${value} wei = ${eth} ETH`)
    } catch (error) {
      return handleError(error)
    }
  },
)

server.tool(
  'viemIsAddress',
  'Validate Ethereum address',
  {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Address to validate',
      },
    },
    required: ['address'],
  },
  async (params) => {
    try {
      const { address } = validateInput(IsAddressSchema, params)
      const valid = isAddress(address)
      return textResponse(valid ? 'Valid address' : 'Invalid address')
    } catch (error) {
      return handleError(error)
    }
  },
)

server.tool(
  'viemKeccak256',
  'Hash data with Keccak256',
  {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'Data to hash',
      },
    },
    required: ['data'],
  },
  async (params) => {
    try {
      const { data } = validateInput(Keccak256Schema, params)
      const hash = keccak256(toHex(data))
      return textResponse(`Hash: ${hash}`)
    } catch (error) {
      return handleError(error)
    }
  },
)

server.tool(
  'viemMulticall',
  'Batch multiple contract reads (no state change)',
  {
    type: 'object',
    properties: {
      contracts: {
        type: 'array',
        description: 'Array of { address, abi, functionName, args }',
      },
      allowFailure: {
        type: 'boolean',
        description:
          'If true (default), failed calls return errors instead of failing the batch',
      },
      chain: { type: 'string', description: 'Chain to query' },
    },
    required: ['contracts'],
  },
  async ({ contracts, allowFailure, chain }) => {
    try {
      const client = clientManager.getClient(chain)
      if (!Array.isArray(contracts) || contracts.length === 0) {
        throw new Error("'contracts' must be a non-empty array")
      }
      // Basic validation and shape normalization
      type PartialContract = {
        address: string
        abi: unknown[]
        functionName: string
        args?: unknown[]
      }
      const normalized = (contracts as PartialContract[]).map((c) => {
        if (!c || !isAddress(c.address)) {
          throw new Error("Each contract must have a valid 'address'")
        }
        if (!Array.isArray(c.abi)) {
          throw new Error("Each contract must include an 'abi' array")
        }
        if (!c.functionName || typeof c.functionName !== 'string') {
          throw new Error("Each contract must include a 'functionName'")
        }
        return {
          address: c.address as Address,
          abi: c.abi as Abi,
          functionName: c.functionName,
          args: Array.isArray(c.args) ? (c.args as readonly unknown[]) : [],
        }
      }) as readonly {
        address: Address
        abi: Abi
        functionName: string
        args?: readonly unknown[]
      }[]
      const result = await client.multicall({
        contracts: normalized,
        allowFailure: allowFailure !== false,
      })
      return jsonResponse(result)
    } catch (error) {
      return handleError(error)
    }
  },
)

// Start server
async function main() {
  const transport = new StdioServerTransport()
  // Register GitHub-based Viem docs resources before connecting
  await setupGithubDocsResources(server)

  // Register prompts
  registerEVMPrompts(server)
  // Register consolidated tools (includes all blockchain operations)
  registerConsolidatedTools(server, clientManager)
  await server.connect(transport)
  console.error('viemcp started successfully')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
