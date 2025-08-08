import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  type Abi,
  type Address,
  type BlockTag,
  erc20Abi,
  formatEther,
  type Hash,
  isAddress,
  toHex,
} from 'viem'
import type { ClientManager } from '../clientManager.js'
import { handleError, jsonResponse } from '../responses.js'
/**
 * Register consolidated Model Context Protocol tools for viemcp.
 * Each tool groups a set of related read-only EVM actions behind one interface.
 * Input validation uses Zod schemas from `src/core/validation.ts`.
 */
import type {
  ChainInfoOutput,
  ContractStateOutput,
  EnsInfoOutput,
  Erc20InfoOutput,
  GasInfoOutput,
} from '../types.js'
import {
  AccountInfoSchema,
  BlockInfoSchema,
  ChainInfoSchema,
  ContractActionSchema,
  ContractStateSchema,
  EncodeDataSchema,
  EnsInfoSchema,
  Erc20InfoSchema,
  GasInfoSchema,
  TransactionBuildSchema,
  TransactionInfoSchema,
  validateInput,
} from '../validation.js'

export function registerConsolidatedTools(
  server: McpServer,
  clientManager: ClientManager,
) {
  function isBlockTag(value: string): value is BlockTag {
    return value === 'latest' || value === 'earliest' || value === 'pending'
  }

  async function getBalanceAt(
    client: ReturnType<ClientManager['getClient']>,
    address: Address,
    tagOrNumber?: string,
  ): Promise<bigint> {
    const v = (tagOrNumber ?? 'latest').trim().toLowerCase()
    if (isBlockTag(v)) {
      return client.getBalance({ address, blockTag: v })
    }
    // Raw RPC for historical number
    const blockParam = /^0x/i.test(v)
      ? (v as `0x${string}`)
      : (toHex(BigInt(v)) as `0x${string}`)
    const hex = (await client.request({
      method: 'eth_getBalance',
      params: [address, blockParam],
    })) as `0x${string}`
    return BigInt(hex)
  }

  async function getNonceAt(
    client: ReturnType<ClientManager['getClient']>,
    address: Address,
    tagOrNumber?: string,
  ): Promise<number> {
    const v = (tagOrNumber ?? 'latest').trim().toLowerCase()
    if (isBlockTag(v)) {
      return client.getTransactionCount({ address, blockTag: v })
    }
    const blockParam = /^0x/i.test(v)
      ? (v as `0x${string}`)
      : (toHex(BigInt(v)) as `0x${string}`)
    const hex = (await client.request({
      method: 'eth_getTransactionCount',
      params: [address, blockParam],
    })) as `0x${string}`
    return Number(hex)
  }
  // viemBlockInfo — combined view of block header, optional tx count, optional full transactions
  server.tool(
    'viemBlockInfo',
    'Get block header and optionally tx count/full transactions',
    {
      type: 'object',
      properties: {
        numberOrTag: {
          type: 'string',
          description:
            'Block number (dec/hex) or tag (latest/earliest/pending)',
        },
        includeTxCount: {
          type: 'boolean',
          description: 'Include transaction count',
        },
        includeFullTransactions: {
          type: 'boolean',
          description: 'Include full transactions array',
        },
        chain: { type: 'string', description: 'Chain to query' },
      },
      required: [],
    },
    async (params) => {
      try {
        const { numberOrTag, includeTxCount, includeFullTransactions, chain } =
          validateInput(BlockInfoSchema, params)
        const client = clientManager.getClient(chain)
        const input = (numberOrTag ?? 'latest').trim().toLowerCase()
        const isTag = isBlockTag(input)
        const block = isTag
          ? await client.getBlock({
              blockTag: input as BlockTag,
              includeTransactions: Boolean(includeFullTransactions),
            })
          : await client.getBlock({
              blockNumber: BigInt(input),
              includeTransactions: Boolean(includeFullTransactions),
            })
        let transactionCount: number | undefined
        if (includeTxCount) {
          transactionCount = isTag
            ? await client.getBlockTransactionCount({
                blockTag: input as BlockTag,
              })
            : await client.getBlockTransactionCount({
                blockNumber: BigInt(input),
              })
        }
        return jsonResponse({ block, transactionCount })
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemTransactionInfo — transaction object; optionally include receipt & logs
  server.tool(
    'viemTransactionInfo',
    'Get transaction details and optionally receipt/logs',
    {
      type: 'object',
      properties: {
        hash: { type: 'string', description: 'Transaction hash (0x...)' },
        includeReceipt: {
          type: 'boolean',
          description: 'Include transaction receipt',
        },
        includeLogs: {
          type: 'boolean',
          description: 'Include logs from receipt (implies includeReceipt)',
        },
        chain: { type: 'string', description: 'Chain to query' },
      },
      required: ['hash'],
    },
    async (params) => {
      try {
        const { hash, includeReceipt, includeLogs, chain } = validateInput(
          TransactionInfoSchema,
          params,
        )
        const client = clientManager.getClient(chain)
        const tx = await client.getTransaction({ hash: hash as Hash })
        let receipt: unknown | undefined
        let logs: unknown[] | undefined
        if (includeReceipt || includeLogs) {
          const r = await client.getTransactionReceipt({ hash: hash as Hash })
          receipt = r
          if (includeLogs) {
            const withLogs = r as { logs?: unknown[] }
            logs = Array.isArray(withLogs.logs) ? withLogs.logs : []
          }
        }
        return jsonResponse({ transaction: tx, receipt, logs })
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemAccountInfo — balance (optionally at historical tag) and optional nonce
  server.tool(
    'viemAccountInfo',
    'Get account balance and optionally nonce',
    {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Ethereum address' },
        blockTag: {
          type: 'string',
          description: 'Optional block tag for balance/nonce',
        },
        historicalBalanceAt: {
          type: 'string',
          description: 'Block tag or number for historical balance lookup',
        },
        includeNonce: {
          type: 'boolean',
          description: 'Include nonce (transaction count)',
        },
        chain: { type: 'string', description: 'Chain to query' },
      },
      required: ['address'],
    },
    async (params) => {
      try {
        const { address, blockTag, historicalBalanceAt, includeNonce, chain } =
          validateInput(AccountInfoSchema, params)
        const client = clientManager.getClient(chain)
        const balance = await getBalanceAt(
          client,
          address as Address,
          historicalBalanceAt ?? blockTag,
        )
        let nonce: number | undefined
        if (includeNonce) {
          nonce = await getNonceAt(client, address as Address, blockTag)
        }
        return jsonResponse({
          address,
          balance: balance.toString(),
          formatted: formatEther(balance),
          nonce,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemGasInfo — current gas price and/or EIP-1559 fee history
  server.tool(
    'viemGasInfo',
    'Get gas price and/or EIP-1559 fee history',
    {
      type: 'object',
      properties: {
        includePrice: {
          type: 'boolean',
          description: 'Include current gas price',
        },
        history: {
          type: 'object',
          description: 'Include fee history if provided',
          properties: {
            blockCount: { type: 'string' },
            newestBlock: { type: 'string' },
            rewardPercentiles: { type: 'array' },
          },
        },
        chain: { type: 'string', description: 'Chain to query' },
      },
      required: [],
    },
    async (params) => {
      try {
        const { includePrice, history, chain } = validateInput(
          GasInfoSchema,
          params,
        )
        const client = clientManager.getClient(chain)
        const out: GasInfoOutput = {}
        if (includePrice !== false) {
          const price = await client.getGasPrice()
          out.price = { wei: price.toString() }
        }
        if (history?.blockCount && history.newestBlock) {
          const count = Number(history.blockCount)
          const rewards = Array.isArray(history.rewardPercentiles)
            ? (history.rewardPercentiles as number[])
            : []
          if (isBlockTag(String(history.newestBlock))) {
            out.feeHistory = await client.getFeeHistory({
              blockCount: count,
              blockTag: String(history.newestBlock) as BlockTag,
              rewardPercentiles: rewards,
            })
          } else {
            out.feeHistory = await client.getFeeHistory({
              blockCount: count,
              blockNumber: BigInt(String(history.newestBlock)),
              rewardPercentiles: rewards,
            })
          }
        }
        return jsonResponse(out)
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemEnsInfo — ENS name/address resolution, resolver, avatar, and text records
  server.tool(
    'viemEnsInfo',
    'Resolve ENS data (name <-> address, resolver, avatar, text records)',
    {
      type: 'object',
      properties: {
        lookupType: { type: 'string', description: "'name' or 'address'" },
        value: { type: 'string', description: 'ENS name or address' },
        includeAddress: { type: 'boolean' },
        includeName: { type: 'boolean' },
        includeResolver: { type: 'boolean' },
        includeAvatar: { type: 'boolean' },
        textKeys: { type: 'array' },
        chain: { type: 'string' },
      },
      required: ['lookupType', 'value'],
    },
    async (params) => {
      try {
        const {
          lookupType,
          value,
          includeAddress,
          includeName,
          includeResolver,
          includeAvatar,
          textKeys,
          chain,
        } = validateInput(EnsInfoSchema, params)
        const client = clientManager.getClient(chain ?? 'ethereum')
        const out: EnsInfoOutput = { lookupType }
        if (lookupType === 'name') {
          const address =
            includeAddress !== false
              ? await client.getEnsAddress({ name: value })
              : undefined
          out.address = address ?? null
          if (includeResolver) {
            out.resolver = await client.getEnsResolver({ name: value })
          }
          if (includeAvatar) {
            out.avatar = await client
              .getEnsAvatar({ name: value })
              .catch(() => null)
          }
          if (Array.isArray(textKeys) && textKeys.length) {
            const texts: Record<string, string | null> = {}
            for (const key of textKeys) {
              texts[key] = (await client
                .getEnsText({ name: value, key })
                .catch(() => null)) as string | null
            }
            out.texts = texts
          }
        } else if (lookupType === 'address') {
          if (!isAddress(value)) {
            throw new Error('Invalid address')
          }
          if (includeName) {
            out.name =
              (await client.getEnsName({ address: value as Address })) ?? null
          }
        } else {
          throw new Error("lookupType must be 'name' or 'address'")
        }
        return jsonResponse(out)
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemErc20Info — ERC20 metadata, balance, and allowance in one call
  server.tool(
    'viemErc20Info',
    'Get ERC20 metadata/balance/allowance',
    {
      type: 'object',
      properties: {
        token: { type: 'string' },
        owner: { type: 'string' },
        spender: { type: 'string' },
        includeMetadata: { type: 'boolean' },
        includeBalance: { type: 'boolean' },
        includeAllowance: { type: 'boolean' },
        chain: { type: 'string' },
      },
      required: ['token'],
    },
    async (params) => {
      try {
        const {
          token,
          owner,
          spender,
          includeMetadata,
          includeBalance,
          includeAllowance,
          chain,
        } = validateInput(Erc20InfoSchema, params)
        const client = clientManager.getClient(chain)
        const out: Erc20InfoOutput = { token }
        if (includeMetadata !== false) {
          const [name, symbol, decimals] = await Promise.all([
            client
              .readContract({
                address: token as Address,
                abi: erc20Abi,
                functionName: 'name',
                args: [],
              })
              .catch(() => ''),
            client
              .readContract({
                address: token as Address,
                abi: erc20Abi,
                functionName: 'symbol',
                args: [],
              })
              .catch(() => ''),
            client.readContract({
              address: token as Address,
              abi: erc20Abi,
              functionName: 'decimals',
              args: [],
            }),
          ])
          out.metadata = { name, symbol, decimals: Number(decimals) }
        }
        if (includeBalance && owner) {
          if (!isAddress(owner)) {
            throw new Error('Invalid owner')
          }
          const balance = (await client.readContract({
            address: token as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [owner as Address],
          })) as bigint
          out.balance = { raw: balance.toString() }
        }
        if (includeAllowance && owner && spender) {
          if (!isAddress(owner) || !isAddress(spender)) {
            throw new Error('Invalid owner/spender')
          }
          const allowance = (await client.readContract({
            address: token as Address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [owner as Address, spender as Address],
          })) as bigint
          out.allowance = allowance.toString()
        }
        return jsonResponse(out)
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemContractState — contract code and/or storage slots
  server.tool(
    'viemContractState',
    'Get contract code and/or storage slots',
    {
      type: 'object',
      properties: {
        address: { type: 'string' },
        slots: { type: 'array' },
        blockTag: { type: 'string' },
        includeCode: { type: 'boolean' },
        includeStorage: { type: 'boolean' },
        chain: { type: 'string' },
      },
      required: ['address'],
    },
    async (params) => {
      try {
        const { address, slots, blockTag, includeCode, includeStorage, chain } =
          validateInput(ContractStateSchema, params)
        const client = clientManager.getClient(chain)
        const out: ContractStateOutput = { address }
        if (includeCode !== false) {
          out.code = await client.getCode({
            address: address as Address,
            blockTag: blockTag as BlockTag | undefined,
          })
        }
        if (includeStorage && Array.isArray(slots) && slots.length) {
          const result: Record<string, string> = {}
          for (const s of slots as string[]) {
            const input = (s ?? '').trim().toLowerCase()
            if (!/^\d+$/.test(input) && !/^0x[0-9a-fA-F]+$/.test(input)) {
              throw new Error('slot must be dec or 0x-hex')
            }
            const v = await client.getStorageAt({
              address: address as Address,
              slot: /^0x/i.test(input)
                ? (input as `0x${string}`)
                : (toHex(BigInt(input)) as `0x${string}`),
              blockTag: blockTag as BlockTag | undefined,
            })
            result[input] = String(v)
          }
          out.storage = result
        }
        return jsonResponse(out)
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemEncodeData — encode function call data or deployment data
  server.tool(
    'viemEncodeData',
    'Encode function/deploy data',
    {
      type: 'object',
      properties: {
        mode: { type: 'string', description: 'function | deploy' },
        abi: { type: 'array' },
        functionName: { type: 'string' },
        args: { type: 'array' },
        bytecode: { type: 'string' },
        constructorArgs: { type: 'array' },
      },
      required: ['mode', 'abi'],
    },
    async (params) => {
      try {
        const { mode, abi, functionName, args, bytecode, constructorArgs } =
          validateInput(EncodeDataSchema, params)
        if (mode === 'function') {
          const { encodeFunctionData } = await import('viem')
          const data = encodeFunctionData({
            abi,
            functionName,
            args: Array.isArray(args) ? args : [],
          })
          return jsonResponse({ data })
        }
        if (mode === 'deploy') {
          const { encodeDeployData } = await import('viem')
          const data = encodeDeployData({
            abi,
            bytecode: bytecode as `0x${string}`,
            args: Array.isArray(constructorArgs) ? constructorArgs : [],
          })
          return jsonResponse({ data })
        }
        throw new Error("mode must be 'function' or 'deploy'")
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemContractAction — read/simulate/estimateGas for a single contract function
  server.tool(
    'viemContractAction',
    'Read/simulate/estimateGas for a contract function',
    {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'read | simulate | estimateGas',
        },
        address: { type: 'string' },
        abi: { type: 'array' },
        functionName: { type: 'string' },
        args: { type: 'array' },
        account: { type: 'string' },
        value: { type: 'string' },
        blockTag: { type: 'string' },
        chain: { type: 'string' },
      },
      required: ['action', 'address', 'abi', 'functionName'],
    },
    async (params) => {
      try {
        const {
          action,
          address,
          abi,
          functionName,
          args,
          account,
          value: _value,
          blockTag,
          chain,
        } = validateInput(ContractActionSchema, params)
        const client = clientManager.getClient(chain)
        const abiTyped = abi as Abi
        if (action === 'read') {
          const readParams = {
            address: address as Address,
            abi: abiTyped,
            functionName,
            args: Array.isArray(args) ? (args as readonly unknown[]) : [],
            blockTag: blockTag as BlockTag | undefined,
          } satisfies Parameters<typeof client.readContract>[0]
          const result = await client.readContract(readParams)
          return jsonResponse({ result })
        }
        if (action === 'simulate') {
          const simParams = {
            address: address as Address,
            abi: abiTyped,
            functionName,
            args: Array.isArray(args) ? (args as readonly unknown[]) : [],
            account: (account as Address) || undefined,
            blockTag: blockTag as BlockTag | undefined,
          } satisfies Parameters<typeof client.simulateContract>[0]
          const result = await client.simulateContract(simParams)
          return jsonResponse(result)
        }
        if (action === 'estimateGas') {
          const estParams = {
            address: address as Address,
            abi: abiTyped,
            functionName,
            args: Array.isArray(args) ? (args as readonly unknown[]) : [],
            account: (account as Address) || undefined,
            blockTag: blockTag as BlockTag | undefined,
          } satisfies Parameters<typeof client.estimateContractGas>[0]
          const gas = await client.estimateContractGas(estParams)
          return jsonResponse({ gas: gas.toString() })
        }
        throw new Error('action must be one of read|simulate|estimateGas')
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemTransactionBuild — estimate gas or prepare a transaction request
  server.tool(
    'viemTransactionBuild',
    'Estimate gas or prepare a transaction request',
    {
      type: 'object',
      properties: {
        mode: { type: 'string', description: 'estimateGas | prepare' },
        from: { type: 'string' },
        to: { type: 'string' },
        data: { type: 'string' },
        value: { type: 'string' },
        gas: { type: 'string' },
        maxFeePerGas: { type: 'string' },
        maxPriorityFeePerGas: { type: 'string' },
        gasPrice: { type: 'string' },
        nonce: { type: 'string' },
        chain: { type: 'string' },
      },
      required: ['mode'],
    },
    async (params) => {
      try {
        const {
          mode,
          from,
          to,
          data,
          value,
          gas,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasPrice,
          nonce,
          chain,
        } = validateInput(TransactionBuildSchema, params)
        const client = clientManager.getClient(chain)
        const req: {
          from?: Address
          to?: Address
          data?: `0x${string}`
          value?: bigint
          gas?: bigint
          maxFeePerGas?: bigint
          maxPriorityFeePerGas?: bigint
          nonce?: number
        } = {}
        const toBigIntIf = (v?: string) => (v ? BigInt(v) : undefined)
        if (from) {
          req.from = from as Address
        }
        if (to) {
          req.to = to as Address
        }
        if (data) {
          if (!/^0x[0-9a-fA-F]*$/.test(data)) {
            throw new Error('data must be 0x-hex')
          }
          req.data = data as `0x${string}`
        }
        const vv = toBigIntIf(value)
        if (vv !== undefined) {
          req.value = vv
        }
        const gg = toBigIntIf(gas)
        if (gg !== undefined) {
          req.gas = gg
        }
        // Normalize legacy gasPrice to EIP-1559 params if provided
        if (gasPrice && !maxFeePerGas && !maxPriorityFeePerGas) {
          const gp = toBigIntIf(gasPrice)
          if (gp !== undefined) {
            req.maxFeePerGas = gp
            req.maxPriorityFeePerGas = gp
          }
        }
        const mf = toBigIntIf(maxFeePerGas)
        if (mf !== undefined) {
          req.maxFeePerGas = mf
        }
        const mp = toBigIntIf(maxPriorityFeePerGas)
        if (mp !== undefined) {
          req.maxPriorityFeePerGas = mp
        }
        if (nonce) {
          req.nonce = Number(nonce)
        }
        if (mode === 'estimateGas') {
          const g = await client.estimateGas(req)
          return jsonResponse({ gas: g.toString() })
        }
        if (mode === 'prepare') {
          const prepared = await client.prepareTransactionRequest({
            ...req,
            // explicitly provide chain: undefined to satisfy exactOptionalPropertyTypes
            chain: undefined,
          })
          return jsonResponse(prepared)
        }
        throw new Error('mode must be estimateGas|prepare')
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // viemChainInfo — chain id and optionally supported chain list and rpc URL
  server.tool(
    'viemChainInfo',
    'Get chain id and/or supported chains',
    {
      type: 'object',
      properties: {
        includeSupported: { type: 'boolean' },
        includeRpcUrl: { type: 'boolean' },
        chain: { type: 'string' },
      },
      required: [],
    },
    async (params) => {
      try {
        const { includeSupported, includeRpcUrl, chain } = validateInput(
          ChainInfoSchema,
          params,
        )
        const client = clientManager.getClient(chain)
        const out: ChainInfoOutput = { chainId: 0 } as ChainInfoOutput
        const id = await client.getChainId()
        out.chainId = id
        if (includeSupported) {
          const { SUPPORTED_CHAINS, getRpcUrl } = await import('../chains.js')
          out.supportedChains = Object.entries(SUPPORTED_CHAINS).map(
            ([name, c]) => ({
              name,
              chainId: c.id,
              displayName: c.name,
            }),
          )
          if (includeRpcUrl && chain) {
            out.rpcUrl = getRpcUrl(chain)
          }
        }
        return jsonResponse(out)
      } catch (error) {
        return handleError(error)
      }
    },
  )

  // Standalone alias notes no longer needed since all tools are viem-prefixed
}
