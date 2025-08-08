import type { Address, BlockTag } from 'viem'

export type GasInfoOutput = {
  price?: { wei: string }
  feeHistory?: unknown
}

export type EnsInfoOutput = {
  lookupType: 'name' | 'address'
  address?: `0x${string}` | null
  resolver?: unknown
  avatar?: string | null
  texts?: Record<string, string | null>
  name?: string | null
}

export type Erc20InfoOutput = {
  token: Address | string
  metadata?: { name: string; symbol: string; decimals: number }
  balance?: { raw: string }
  allowance?: string
}

export type ContractStateOutput = {
  address: Address | string
  code?: unknown
  storage?: Record<string, string>
}

export type ChainInfoOutput = {
  chainId: number
  supportedChains?: Array<{
    name: string
    chainId: number
    displayName: string
  }>
  rpcUrl?: string | undefined
}

export interface LogParameters {
  address?: Address
  topics?: unknown[]
  fromBlock?: bigint | BlockTag
  toBlock?: bigint | BlockTag
}
