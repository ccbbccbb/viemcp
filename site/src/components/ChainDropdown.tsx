"use client";
import { useEffect, useState } from "react";
type Chain = { id: number; name: string; slug: string };

export function ChainDropdown({
  value,
  onChange,
}: {
  value: Chain | null;
  onChange: (chain: Chain) => void;
}) {
  const [chains, setChains] = useState<Chain[]>([]);

  useEffect(() => {
    fetch("/chains.json")
      .then((r) => r.json())
      .then(setChains)
      .catch(() => setChains([]));
  }, []);

  return (
    <div className="space-y-2">
      <label className="section-heading">Supported Networks</label>
      <select
        className="dropdown w-full"
        value={value?.id || ""}
        onChange={(e) => {
          const chain = chains.find((c) => c.id === parseInt(e.target.value));
          if (chain) onChange(chain);
        }}
      >
        <option value="">Select a network</option>
        {chains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.id})
          </option>
        ))}
      </select>
    </div>
  );
}
