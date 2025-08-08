import { type Chain, mainnet } from 'viem/chains'

export function getRpcUrl(chainName: string): string | undefined {
  const provider = process.env.RPC_PROVIDER || 'drpc'

  const envVariants = [
    chainName.toUpperCase(),
    chainName.toUpperCase().replace('-', '_'),
    chainName.toUpperCase().replace(' ', '_'),
    chainName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, ''),
  ]

  for (const variant of envVariants) {
    const providerUrl =
      process.env[`${variant}_RPC_URL_${provider.toUpperCase()}`]
    if (providerUrl) {
      return providerUrl
    }

    const genericUrl = process.env[`${variant}_RPC_URL`]
    if (genericUrl) {
      return genericUrl
    }
  }
  return undefined
}

export const SUPPORTED_CHAINS: Record<string, Chain> = (() => {
  // Minimal default set to avoid bundle size pressure; server can dynamically expand
  const mapping: Record<string, Chain> = {}
  mapping.mainnet = mainnet
  mapping.ethereum = mainnet
  mapping.eth = mainnet
  return mapping
})()

export function registerChain(chain: Chain, aliases: string[] = []) {
  const c = chain
  SUPPORTED_CHAINS[c.name] = c
  const normalized = [
    c.name.toLowerCase(),
    c.name.replace(/\s+/g, '-').toLowerCase(),
  ]
  for (const key of new Set([...aliases, ...normalized])) {
    SUPPORTED_CHAINS[key] = c
  }
}

export function getChainByName(name: string): Chain | undefined {
  return SUPPORTED_CHAINS[name] || SUPPORTED_CHAINS[name?.toLowerCase?.() ?? '']
}

export function findChainByIdLocal(id: number): Chain | undefined {
  for (const key of Object.keys(SUPPORTED_CHAINS)) {
    const c = SUPPORTED_CHAINS[key]
    if (c && typeof c === 'object' && typeof c.id === 'number' && c.id === id) {
      return c as Chain
    }
  }
  return undefined
}

export async function resolveChainById(id: number): Promise<Chain | undefined> {
  try {
    const allowDynamic =
      process.env.VIEM_ENABLE_DYNAMIC_CHAIN_RESOLUTION !== 'false'
    if (!allowDynamic) {
      return undefined
    }
    const all = await import('viem/chains')
    const values = Object.values(all) as unknown[]
    const chain = values.find(
      (c) => c && typeof c === 'object' && (c as { id?: number }).id === id,
    ) as Chain | undefined
    return chain
  } catch {
    return undefined
  }
}

export function loadCustomChainsFromEnv() {
  const raw = process.env.VIEM_CUSTOM_CHAINS
  if (!raw) {
    return
  }
  try {
    const arr = JSON.parse(raw) as unknown[]
    for (const maybeChain of arr) {
      const c = maybeChain as Partial<Chain>
      if (c && typeof c.id === 'number' && typeof c.name === 'string') {
        registerChain(c as Chain)
      }
    }
  } catch {
    // ignore invalid JSON
  }
}
