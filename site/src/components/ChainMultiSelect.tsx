'use client'
import * as Checkbox from '@radix-ui/react-checkbox'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useEffect, useState } from 'react'

type Chain = { id: number; name: string; slug: string }

export function ChainMultiSelect({
  value,
  onChange,
}: {
  value: Chain[]
  onChange: (chains: Chain[]) => void
}) {
  const [chains, setChains] = useState<Chain[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/chains.json')
      .then((r) => r.json())
      .then(setChains)
      .catch(() => setChains([]))
  }, [])

  const filteredChains = chains.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toString().includes(search),
  )

  const toggleChain = (chain: Chain) => {
    if (value.some((c) => c.id === chain.id)) {
      onChange(value.filter((c) => c.id !== chain.id))
    } else {
      onChange([...value, chain])
    }
  }

  const displayText =
    value.length === 0
      ? 'Select networks'
      : value.length === 1
        ? value[0].name
        : `${value.length} networks selected`

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <label className="section-heading m-0" htmlFor="multi-chain-button">
          Supported Networks
        </label>

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              id="multi-chain-button"
              className="dropdown flex items-center justify-between min-w-[220px]"
            >
              <span className="text-sm">{displayText}</span>
              {open ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </Popover.Trigger>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="card w-[340px] p-0 shadow-lg"
          >
            <div className="p-3 border-b border-[--viem-border]">
              <input
                type="text"
                className="input-field w-full"
                placeholder="Search networks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ScrollArea.Root className="h-64">
              <ScrollArea.Viewport className="h-full p-2">
                {filteredChains.length === 0 ? (
                  <div className="text-sm text-[--viem-text-muted] p-3 text-center">
                    No networks found
                  </div>
                ) : (
                  filteredChains.map((chain) => {
                    const isSelected = value.some((c) => c.id === chain.id)
                    return (
                      <button
                        key={chain.id}
                        aria-pressed={isSelected}
                        className="flex items-center gap-3 p-2 hover:bg-[--viem-border] rounded cursor-pointer w-full text-left"
                        onClick={() => toggleChain(chain)}
                        type="button"
                      >
                        <Checkbox.Root
                          checked={isSelected}
                          onCheckedChange={() => toggleChain(chain)}
                          className="h-4 w-4 rounded border border-[--viem-border] data-[state=checked]:bg-[--viem-heading] flex items-center justify-center"
                        >
                          <Checkbox.Indicator>
                            <CheckIcon className="h-3 w-3 text-white" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="text-sm flex-1">
                          {chain.name}{' '}
                          <span className="text-[--viem-text-muted]">
                            ({chain.id})
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                orientation="vertical"
                className="flex select-none touch-none p-0.5 bg-transparent"
              >
                <ScrollArea.Thumb className="flex-1 bg-[--viem-border] rounded" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            {value.length > 0 && (
              <div className="p-3 border-t border-[--viem-border]">
                <button
                  onClick={() => onChange([])}
                  className="text-sm text-[--viem-text-muted] hover:text-[--viem-text]"
                >
                  Clear all
                </button>
              </div>
            )}
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  )
}
