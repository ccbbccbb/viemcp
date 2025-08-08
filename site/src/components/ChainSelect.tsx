'use client'
import { useEffect, useState } from 'react'

type Chain = { id: number; name: string; slug: string }

export function ChainSelect({
  value,
  onChange,
}: {
  value: Chain[]
  onChange: (next: Chain[]) => void
}) {
  const [chains, setChains] = useState<Chain[]>([])
  useEffect(() => {
    fetch('/chains.json')
      .then((r) => r.json())
      .then(setChains)
      .catch(() => setChains([]))
  }, [])
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Supported networks</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
        {chains.map((c) => {
          const checked = value.some((v) => v.id === c.id)
          return (
            <label
              key={c.id}
              className="flex items-center gap-2 border rounded p-2"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  onChange(
                    e.target.checked
                      ? [...value, c]
                      : value.filter((v) => v.id !== c.id),
                  )
                }}
              />
              <span className="text-sm">
                {c.name} - {c.id}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
