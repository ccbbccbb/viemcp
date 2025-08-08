"use client";
import { useEffect, useState, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
type Chain = { id: number; name: string; slug: string };

export function ChainMultiSelect({
  value,
  onChange,
}: {
  value: Chain[];
  onChange: (chains: Chain[]) => void;
}) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/chains.json")
      .then((r) => r.json())
      .then(setChains)
      .catch(() => setChains([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredChains = chains.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toString().includes(search)
  );

  const toggleChain = (chain: Chain) => {
    if (value.some((c) => c.id === chain.id)) {
      onChange(value.filter((c) => c.id !== chain.id));
    } else {
      onChange([...value, chain]);
    }
  };

  const displayText =
    value.length === 0
      ? "Select networks"
      : value.length === 1
        ? value[0].name
        : `${value.length} networks selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-4">
        <label className="section-heading m-0">Supported Networks</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="dropdown flex items-center justify-between min-w-[200px]"
        >
          <span className="text-sm">{displayText}</span>
          {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 card max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[--viem-border]">
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search networks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {filteredChains.length === 0 ? (
              <div className="text-sm text-[--viem-text-muted] p-3 text-center">
                No networks found
              </div>
            ) : (
              filteredChains.map((chain) => {
                const isSelected = value.some((c) => c.id === chain.id);
                return (
                  <label
                    key={chain.id}
                    className="flex items-center gap-3 p-2 hover:bg-[--viem-border] rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleChain(chain)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm flex-1">
                      {chain.name} <span className="text-[--viem-text-muted]">({chain.id})</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>

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
        </div>
      )}
    </div>
  );
}
