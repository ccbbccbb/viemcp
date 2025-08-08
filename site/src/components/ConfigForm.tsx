'use client'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { useMemo, useState } from 'react'
import { CodeBlock } from './CodeBlock'

type Chain = { id: number; name: string; slug: string }

function buildClaudeCodeCmd(
  chains: Chain[],
  o: {
    provider?: 'drpc' | 'alchemy' | 'infura' | 'none'
    rpcUrl?: string
    customChainName?: string
    customChainId?: string
    alchemy?: string
    drpc?: string
    infura?: string
  },
) {
  const envs: string[] = []
  const defaultChainId = chains.length > 0 ? chains[0].id.toString() : '1'

  envs.push(`DEFAULT_CHAIN_ID=${defaultChainId}`)
  if (chains.length > 0) {
    const idsCsv = chains.map((c) => c.id).join(',')
    const namesCsv = chains
      .map((c) => (c.slug || c.name).replace(/\s+/g, '-'))
      .join(',')
    envs.push(`SELECTED_CHAIN_IDS=${idsCsv}`)
    envs.push(`SELECTED_CHAINS=${namesCsv}`)
  }

  switch (o.provider) {
    case 'drpc':
      if (o.drpc) {
        envs.push(`RPC_PROVIDER=drpc`)
        envs.push(`DRPC_API_KEY=${o.drpc}`)
        if (chains.some((c) => c.id === 1)) {
          envs.push(
            `MAINNET_RPC_URL_DRPC=https://lb.drpc.org/ethereum/${o.drpc}`,
          )
        }
      }
      break
    case 'alchemy':
      if (o.alchemy) {
        envs.push(`RPC_PROVIDER=alchemy`)
        envs.push(`ALCHEMY_API_KEY=${o.alchemy}`)
      }
      break
    case 'infura':
      if (o.infura) {
        envs.push(`RPC_PROVIDER=infura`)
        envs.push(`INFURA_API_KEY=${o.infura}`)
      }
      break
    default:
      break
  }

  if (o.rpcUrl && o.customChainName && o.customChainId) {
    envs.push(`CUSTOM_RPC_URL=${o.rpcUrl}`)
    envs.push(`CUSTOM_CHAIN_NAME=${o.customChainName}`)
    envs.push(`CUSTOM_CHAIN_ID=${o.customChainId}`)
  }

  // Single line command
  return `claude mcp add viemcp${envs.length ? ` -e ${envs.join(' ')}` : ''} -- npx -y viemcp`
}

function buildCursorConfig(
  chains: Chain[],
  o: {
    provider?: 'drpc' | 'alchemy' | 'infura' | 'none'
    rpcUrl?: string
    customChainName?: string
    customChainId?: string
    alchemy?: string
    drpc?: string
    infura?: string
  },
) {
  const env: Record<string, string> = {}
  const defaultChainId = chains.length > 0 ? chains[0].id.toString() : '1'

  env.DEFAULT_CHAIN_ID = defaultChainId
  if (chains.length > 0) {
    env.SELECTED_CHAIN_IDS = chains.map((c) => c.id).join(',')
    env.SELECTED_CHAINS = chains
      .map((c) => (c.slug || c.name).replace(/\s+/g, '-'))
      .join(',')
  }

  switch (o.provider) {
    case 'drpc':
      if (o.drpc) {
        env.RPC_PROVIDER = 'drpc'
        env.DRPC_API_KEY = o.drpc
        if (chains.some((c) => c.id === 1)) {
          env.MAINNET_RPC_URL_DRPC = `https://lb.drpc.org/ethereum/${o.drpc}`
        }
      }
      break
    case 'alchemy':
      if (o.alchemy) {
        env.RPC_PROVIDER = 'alchemy'
        env.ALCHEMY_API_KEY = o.alchemy
      }
      break
    case 'infura':
      if (o.infura) {
        env.RPC_PROVIDER = 'infura'
        env.INFURA_API_KEY = o.infura
      }
      break
    default:
      break
  }

  if (o.rpcUrl && o.customChainName && o.customChainId) {
    env.CUSTOM_RPC_URL = o.rpcUrl
    env.CUSTOM_CHAIN_NAME = o.customChainName
    env.CUSTOM_CHAIN_ID = o.customChainId
  }

  return JSON.stringify(
    {
      viemcp: {
        command: 'npx',
        args: ['-y', 'viemcp'],
        env: env,
      },
    },
    null,
    2,
  )
}

export function ConfigForm({ selected }: { selected: Chain[] }) {
  const [rpcUrl, setRpcUrl] = useState('')
  const [customChainName, setCustomChainName] = useState('')
  const [customChainId, setCustomChainId] = useState('')
  const [alchemy, setAlchemy] = useState('')
  const [drpc, setDrpc] = useState('')
  const [infura, setInfura] = useState('')
  const [provider, setProvider] = useState<
    'drpc' | 'alchemy' | 'infura' | 'none'
  >('none')

  const cursorCfg = useMemo(
    () =>
      buildCursorConfig(selected, {
        provider,
        rpcUrl,
        customChainName,
        customChainId,
        alchemy,
        drpc,
        infura,
      }),
    [
      selected,
      provider,
      rpcUrl,
      customChainName,
      customChainId,
      alchemy,
      drpc,
      infura,
    ],
  )
  const claudeCmd = useMemo(
    () =>
      buildClaudeCodeCmd(selected, {
        provider,
        rpcUrl,
        customChainName,
        customChainId,
        alchemy,
        drpc,
        infura,
      }),
    [
      selected,
      provider,
      rpcUrl,
      customChainName,
      customChainId,
      alchemy,
      drpc,
      infura,
    ],
  )

  return (
    <section className="space-y-8">
      <Accordion.Root type="multiple" defaultValue={[]} className="space-y-6">
        {/* Provider & Keys - first, full width */}
        <Accordion.Item value="provider" className="space-y-4">
          <Accordion.Header>
            <Accordion.Trigger className="accordion-trigger flex items-center gap-2 mb-2 bg-transparent p-0 border-0">
              <h3 className="section-heading m-0">RPC PROVIDER</h3>
              <ChevronDownIcon className="mb-4 chevron w-4 h-4 text-[--viem-heading] transition-transform" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="space-y-4 data-[state=closed]:hidden">
            <div className="space-y-2">
              <RadioGroup.Root
                value={provider}
                onValueChange={(v) => setProvider(v as typeof provider)}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { value: 'none', label: 'None / Custom' },
                  { value: 'drpc', label: 'DRPC' },
                  { value: 'alchemy', label: 'Alchemy' },
                  { value: 'infura', label: 'Infura' },
                ].map((opt) => (
                  <RadioGroup.Item
                    key={opt.value}
                    asChild
                    value={opt.value as any}
                  >
                    <button
                      type="button"
                      aria-pressed={provider === (opt.value as typeof provider)}
                      className="flex items-center gap-2 p-2 border rounded border-[--viem-border] cursor-pointer text-left"
                      onClick={() => setProvider(opt.value as typeof provider)}
                    >
                      <span
                        aria-hidden
                        className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-[--viem-border]"
                      >
                        {provider === (opt.value as typeof provider) ? (
                          <span className="block h-2 w-2 rounded-full bg-[--viem-heading]" />
                        ) : null}
                      </span>
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>

            {provider === 'alchemy' && (
              <div>
                <label
                  htmlFor="alchemy-key"
                  className="block text-sm text-[--viem-text-muted] mb-2"
                >
                  Alchemy API Key
                </label>
                <input
                  id="alchemy-key"
                  className="input-field w-full"
                  placeholder="YOUR-API-KEY"
                  value={alchemy}
                  onChange={(e) => setAlchemy(e.target.value)}
                />
              </div>
            )}

            {provider === 'drpc' && (
              <div>
                <label
                  htmlFor="drpc-key"
                  className="block text-sm text-[--viem-text-muted] mb-2"
                >
                  DRPC API Key
                </label>
                <input
                  id="drpc-key"
                  className="input-field w-full"
                  placeholder="YOUR-API-KEY"
                  value={drpc}
                  onChange={(e) => setDrpc(e.target.value)}
                />
              </div>
            )}

            {provider === 'infura' && (
              <div>
                <label
                  htmlFor="infura-key"
                  className="block text-sm text-[--viem-text-muted] mb-2"
                >
                  Infura API Key
                </label>
                <input
                  id="infura-key"
                  className="input-field w-full"
                  placeholder="YOUR-API-KEY"
                  value={infura}
                  onChange={(e) => setInfura(e.target.value)}
                />
              </div>
            )}
          </Accordion.Content>
        </Accordion.Item>

        {/* Custom RPC - second, full width */}
        <Accordion.Item value="custom-rpc" className="space-y-4">
          <Accordion.Header>
            <Accordion.Trigger className="accordion-trigger flex items-center gap-2 mb-2 bg-transparent p-0 border-0">
              <h3 className="section-heading m-0">CUSTOM RPC URL</h3>
              <ChevronDownIcon className="mb-4 chevron w-4 h-4 text-[--viem-heading] transition-transform" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="space-y-4 data-[state=closed]:hidden">
            <div>
              <label
                htmlFor="rpc-url"
                className="block text-sm text-[--viem-text-muted] mb-2"
              >
                RPC URL
              </label>
              <input
                id="rpc-url"
                className="input-field w-full"
                placeholder="https://rpc.example.org"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="custom-chain-name"
                className="block text-sm text-[--viem-text-muted] mb-2"
              >
                Chain Name
              </label>
              <input
                id="custom-chain-name"
                className="input-field w-full"
                placeholder="my-chain"
                value={customChainName}
                onChange={(e) => setCustomChainName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="custom-chain-id"
                className="block text-sm text-[--viem-text-muted] mb-2"
              >
                Chain ID
              </label>
              <input
                id="custom-chain-id"
                className="input-field w-full"
                placeholder="1337"
                value={customChainId}
                onChange={(e) => setCustomChainId(e.target.value)}
              />
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <div className="space-y-6">
        <CodeBlock title="Claude Code MCP Command" code={claudeCmd} />
        <CodeBlock title="Cursor MCP Config" code={cursorCfg} />
      </div>
    </section>
  )
}
