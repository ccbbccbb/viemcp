'use client'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { SiNpm } from 'react-icons/si'
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
        <nav className="flex items-center gap-4 text-sm text-[--viem-text-muted]">
          <a
            href="https://github.com/ccbbccbb/viemcp/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="hover:text-[--viem-text] transition-colors"
            title="GitHub"
          >
            <GitHubLogoIcon className="w-5 h-5" />
          </a>
          <a
            href="https://www.npmjs.com/package/viemcp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="npm package"
            className="hover:text-[--viem-text] transition-colors"
            title="npm"
          >
            <SiNpm className="w-6 h-6" />
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8 space-y-6 text-center flex flex-col items-center">
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

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-[--viem-text-muted] text-center">
        Built @ Paradigm Frontiers 2025 • Contribute? Feedback?{' '}
        <a
          href="mailto:char@automatethestack.com"
          className="underline hover:text-[--viem-text] transition-colors"
        >
          Get in Touch Here
        </a>
      </footer>
    </main>
  )
}
