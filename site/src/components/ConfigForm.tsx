'use client'
import { useMemo, useState } from 'react'
import { CodeBlock } from './CodeBlock'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'
type Chain = { id:number; name:string; slug:string }

function buildClaudeCodeCmd(chains:Chain[], o:{rpcUrl?:string; customChainName?:string; customChainId?:string; alchemy?:string; drpc?:string; infura?:string}) {
  const envs:string[] = []
  const defaultChainId = chains.length > 0 ? chains[0].id.toString() : '1'
  
  envs.push(`DEFAULT_CHAIN_ID=${defaultChainId}`)
  
  if (o.drpc) {
    envs.push(`RPC_PROVIDER=drpc`)
    envs.push(`DRPC_API_KEY=${o.drpc}`)
    if (chains.some(c => c.id === 1)) {
      envs.push(`MAINNET_RPC_URL_DRPC=https://lb.drpc.org/ethereum/${o.drpc}`)
    }
  } else if (o.alchemy) {
    envs.push(`RPC_PROVIDER=alchemy`)
    envs.push(`ALCHEMY_API_KEY=${o.alchemy}`)
  } else if (o.infura) {
    envs.push(`RPC_PROVIDER=infura`)
    envs.push(`INFURA_API_KEY=${o.infura}`)
  }
  
  if (o.rpcUrl && o.customChainName && o.customChainId) {
    envs.push(`CUSTOM_RPC_URL=${o.rpcUrl}`)
    envs.push(`CUSTOM_CHAIN_NAME=${o.customChainName}`)
    envs.push(`CUSTOM_CHAIN_ID=${o.customChainId}`)
  }
  
  // Single line command
  return `claude mcp add viemcp${envs.length ? ' -e ' + envs.join(' ') : ''} -- npx -y viemcp`
}

function buildCursorConfig(chains:Chain[], o:{rpcUrl?:string; customChainName?:string; customChainId?:string; alchemy?:string; drpc?:string; infura?:string}) {
  const env:Record<string, string> = {}
  const defaultChainId = chains.length > 0 ? chains[0].id.toString() : '1'
  
  env.DEFAULT_CHAIN_ID = defaultChainId
  
  if (o.drpc) {
    env.RPC_PROVIDER = 'drpc'
    env.DRPC_API_KEY = o.drpc
    if (chains.some(c => c.id === 1)) {
      env.MAINNET_RPC_URL_DRPC = `https://lb.drpc.org/ethereum/${o.drpc}`
    }
  } else if (o.alchemy) {
    env.RPC_PROVIDER = 'alchemy'
    env.ALCHEMY_API_KEY = o.alchemy
  } else if (o.infura) {
    env.RPC_PROVIDER = 'infura'
    env.INFURA_API_KEY = o.infura
  }
  
  if (o.rpcUrl && o.customChainName && o.customChainId) {
    env.CUSTOM_RPC_URL = o.rpcUrl
    env.CUSTOM_CHAIN_NAME = o.customChainName
    env.CUSTOM_CHAIN_ID = o.customChainId
  }
  
  return JSON.stringify({
    "viemcp": {
      "command": "npx",
      "args": [
        "-y",
        "viemcp"
      ],
      "env": env
    }
  }, null, 2)
}

export function ConfigForm({ selected }:{ selected:Chain[] }) {
  const [rpcUrl, setRpcUrl] = useState('')
  const [customChainName, setCustomChainName] = useState('')
  const [customChainId, setCustomChainId] = useState('')
  const [alchemy, setAlchemy] = useState('')
  const [drpc, setDrpc] = useState('')
  const [infura, setInfura] = useState('')
  const [showCustomRpc, setShowCustomRpc] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)

  const cursorCfg = useMemo(() => buildCursorConfig(selected, { rpcUrl, customChainName, customChainId, alchemy, drpc, infura }), [selected, rpcUrl, customChainName, customChainId, alchemy, drpc, infura])
  const claudeCmd = useMemo(() => buildClaudeCodeCmd(selected, { rpcUrl, customChainName, customChainId, alchemy, drpc, infura }), [selected, rpcUrl, customChainName, customChainId, alchemy, drpc, infura])

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Custom RPC */}
        <div className="space-y-6">
          <div>
            <button
              onClick={() => setShowCustomRpc(!showCustomRpc)}
              className="flex items-center gap-2 mb-4"
            >
              <h3 className="section-heading m-0">CUSTOM RPC URL</h3>
              {showCustomRpc ? (
                <ChevronDownIcon className="w-4 h-4 text-[--viem-heading]" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-[--viem-heading]" />
              )}
            </button>
            
            {showCustomRpc && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">RPC URL</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="https://rpc.example.org" 
                    value={rpcUrl} 
                    onChange={e => setRpcUrl(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">Chain Name</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="my-chain" 
                    value={customChainName} 
                    onChange={e => setCustomChainName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">Chain ID</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="1337" 
                    value={customChainId} 
                    onChange={e => setCustomChainId(e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - API Keys */}
        <div className="space-y-6">
          <div>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center gap-2 mb-4"
            >
              <h3 className="section-heading m-0">CUSTOM API KEY</h3>
              {showApiKeys ? (
                <ChevronDownIcon className="w-4 h-4 text-[--viem-heading]" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-[--viem-heading]" />
              )}
            </button>
            
            {showApiKeys && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">Alchemy API Key</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="YOUR-API-KEY" 
                    value={alchemy} 
                    onChange={e => setAlchemy(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">DRPC API Key</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="YOUR-API-KEY" 
                    value={drpc} 
                    onChange={e => setDrpc(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-[--viem-text-muted] mb-2">Infura API Key</label>
                  <input 
                    className="input-field w-full" 
                    placeholder="YOUR-API-KEY" 
                    value={infura} 
                    onChange={e => setInfura(e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <CodeBlock title="Claude Code MCP Command" code={claudeCmd} />
        <CodeBlock title="Cursor MCP Config" code={cursorCfg} />
      </div>
    </section>
  )
}