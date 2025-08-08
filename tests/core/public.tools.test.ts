import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerConsolidatedTools } from '../../src/core/tools/consolidated.js'

// Create a lightweight fake client manager
class FakeClientManager {
  public client = {
    getLogs: vi.fn(async (_params: any) => []),
    getBlock: vi.fn(async () => ({})),
    getTransaction: vi.fn(async () => ({})),
    getTransactionReceipt: vi.fn(async () => ({})),
    getBalance: vi.fn(async () => BigInt(0)),
    getTransactionCount: vi.fn(async () => 0),
    getGasPrice: vi.fn(async () => BigInt(0)),
    getFeeHistory: vi.fn(async () => ({})),
    getEnsAddress: vi.fn(async () => null),
    getEnsResolver: vi.fn(async () => null),
    getEnsAvatar: vi.fn(async () => null),
    getEnsText: vi.fn(async () => null),
    getEnsName: vi.fn(async () => null),
    readContract: vi.fn(async () => ''),
    getCode: vi.fn(async () => '0x'),
    getStorageAt: vi.fn(async () => '0x'),
    simulateContract: vi.fn(async () => ({})),
    estimateContractGas: vi.fn(async () => BigInt(0)),
    estimateGas: vi.fn(async () => BigInt(0)),
    prepareTransactionRequest: vi.fn(async () => ({})),
    getChainId: vi.fn(async () => 1),
    getBlockTransactionCount: vi.fn(async () => 0),
    multicall: vi.fn(async () => []),
    request: vi.fn(async () => '0x0'),
  } as any
  getClient() {
    return this.client
  }
  getSupportedChains() {
    return ['mainnet', 'ethereum']
  }
}

function createFakeServer() {
  const tools: { name: string; callback: Function }[] = []
  const server = {
    tool: (_name: string, _desc: string, _schema: unknown, cb: Function) => {
      tools.push({ name: _name, callback: cb })
      return {} as unknown
    },
  } as any
  return { server, tools }
}

describe('viemGetLogs tool', () => {
  let server: any
  let tools: { name: string; callback: Function }[]
  let clientManager: FakeClientManager

  beforeEach(() => {
    ;({ server, tools } = createFakeServer())
    clientManager = new FakeClientManager()
  })

  it('parses viemGetLogs from/to block as bigint or BlockTag', async () => {
    registerConsolidatedTools(server, clientManager as any)
    const entry = tools.find((t) => t.name === 'viemGetLogs')
    expect(entry).toBeDefined()
    const cb = entry!.callback as (args: any) => Promise<any>

    // numeric blocks
    await cb({ fromBlock: '100', toBlock: '101' })
    const firstCall = clientManager.client.getLogs.mock.calls.at(-1)![0]
    expect(typeof firstCall.fromBlock === 'bigint').toBe(true)
    expect(typeof firstCall.toBlock === 'bigint').toBe(true)

    // tag blocks
    await cb({ fromBlock: 'latest', toBlock: 'pending' })
    const secondCall = clientManager.client.getLogs.mock.calls.at(-1)![0]
    expect(secondCall.fromBlock === 'latest').toBe(true)
    expect(secondCall.toBlock === 'pending').toBe(true)
  })
})
