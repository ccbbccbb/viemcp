'use client'
import { useState } from 'react'
import { ChainMultiSelect } from '@/components/ChainMultiSelect'
import { ConfigForm } from '@/components/ConfigForm'

type Chain = { id: number; name: string; slug: string }

export default function Page() {
  const [selected, setSelected] = useState<Chain[]>([
    { id: 1, name: 'Ethereum', slug: 'mainnet' },
  ])

  return (
    <main className="relative z-[1] min-h-screen">
      <header className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
        <div className="text-xl font-semibold font-title">viemcp</div>
        <nav className="text-sm text-[--viem-text-muted]">
          MCP server for Viem
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 space-y-6 text-center flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold font-title">viemcp</h1>
        <p className="text-lg md:text-xl text-[--viem-text-muted]">
          Fast setup & flexible config - choose networks, RPC, & keys.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-[--viem-text] mb-6">
            CUSTOM CONFIG
          </h2>
          <div className="mb-8">
            <ChainMultiSelect value={selected} onChange={setSelected} />
          </div>
          <ConfigForm selected={selected} />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-[--viem-text-muted]">
        Built with Next.js 15 + Tailwind v4 - styled by viem.
      </footer>
    </main>
  )
}
