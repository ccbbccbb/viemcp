import { formatEther, formatUnits, parseEther, parseUnits } from "viem";

export function formatBalance(
  balance: bigint,
  decimals: number = 18,
  symbol?: string
): string {
  const formatted = decimals === 18 
    ? formatEther(balance)
    : formatUnits(balance, decimals);
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function parseAmount(
  amount: string,
  decimals: number = 18
): bigint {
  return decimals === 18
    ? parseEther(amount)
    : parseUnits(amount, decimals);
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBlockNumber(blockNumber: bigint | null): string {
  if (!blockNumber) return "N/A";
  return blockNumber.toString();
}

export function formatGasPrice(gasPrice: bigint | null): string {
  if (!gasPrice) return "N/A";
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString();
}

export function jsonResponse(data: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value, null, 2),
      },
    ],
  };
}

export function textResponse(text: string): { content: Array<{ type: string; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}