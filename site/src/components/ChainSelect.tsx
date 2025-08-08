'use client'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { useEffect, useMemo, useState } from 'react'

type Chain = { id: number; name: string; slug: string }

export function ChainSelect({
  value,
  onChange,
}: {
  value: Chain[]
  onChange: (next: Chain[]) => void
}) {
  const [chains, setChains] = useState<Chain[]>([])
  const [search, setSearch] = useState('')
  const [showMore, setShowMore] = useState(false)
  useEffect(() => {
    fetch('/chains.json')
      .then((r) => r.json())
      .then(setChains)
      .catch(() => setChains([]))
  }, [])
  // Priority by chain IDs to avoid ambiguous name matches
  // Row1: Ethereum (1), Optimism (10), Base (8453), Arbitrum (42161)
  // Row2: Linea (59144), Unichain (130), Polygon (137), Avalanche (43114)
  const prioritizedIds = [1, 10, 8453, 42161, 59144, 130, 137, 43114]

  const displayNameFor = (c: Chain): string => {
    switch (c.id) {
      case 10:
        return 'Optimism'
      case 42161:
        return 'Arbitrum'
      case 59144:
        return 'Linea'
      default:
        return c.name
          .replace(/ One$/i, '')
          .replace(/ Mainnet$/i, '')
          .replace(/ MainNet$/i, '')
    }
  }

  const { prioritized, others } = useMemo(() => {
    const prioritySet = new Set<number>()
    const byId = new Map<number, Chain>()
    for (const c of chains) byId.set(c.id, c)
    const picks: Chain[] = []
    for (const id of prioritizedIds) {
      const found = byId.get(id)
      if (found && !prioritySet.has(found.id)) {
        prioritySet.add(found.id)
        picks.push(found)
      }
    }
    const rest = chains.filter((c) => !prioritySet.has(c.id))
    return { prioritized: picks.slice(0, 8), others: rest }
  }, [chains])

  const toggle = (c: Chain, checked: boolean) => {
    onChange(checked ? [...value, c] : value.filter((v) => v.id !== c.id))
  }

  const Item = ({ c }: { c: Chain }) => {
    const checked = value.some((v) => v.id === c.id)
    return (
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => toggle(c, !checked)}
        className={
          'flex items-center justify-between gap-2 px-3 py-2 rounded border-2 text-left transition-colors ' +
          (checked ? 'bg-[--viem-border]' : 'hover:bg-[--viem-border]')
        }
        style={{
          borderColor:
            'color-mix(in oklab, var(--viem-border) 35%, transparent)',
        }}
      >
        <span className="text-sm truncate">
          {displayNameFor(c)}
          <span className="text-[--viem-text-muted]"> · {c.id}</span>
        </span>
        <span
          aria-hidden
          className="inline-flex items-center justify-center h-4 w-4 rounded border-2"
          style={{
            borderColor:
              'color-mix(in oklab, var(--viem-border) 35%, transparent)',
          }}
        >
          {checked ? (
            <CheckIcon className="h-3 w-3 text-[--viem-heading]" />
          ) : null}
        </span>
      </button>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-heading m-0">NETWORKS</h3>
        <button
          type="button"
          className="text-sm text-[--viem-text-muted] hover:text-[--viem-text] inline-flex items-center gap-1"
          onClick={() => setShowMore((v) => !v)}
        >
          More <ChevronDownIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {prioritized.map((c) => (
          <Item key={c.id} c={c} />
        ))}
      </div>
      {showMore && (
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Search networks..."
            className="input-field w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {others
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    String(c.id).includes(search),
                )
                .map((c) => (
                  <Item key={c.id} c={c} />
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
