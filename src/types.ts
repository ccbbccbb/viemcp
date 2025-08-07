import type { Address, Hash, Chain } from "viem";

// Common validation schemas and types
export interface ChainInfo {
  name: string;
  chainId: number;
  displayName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorers?: {
    default: {
      name: string;
      url: string;
    };
  };
  rpcUrls: {
    default: {
      http: string[];
      webSocket?: string[];
    };
  };
}

export interface TokenMetadata {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
}

export interface TransactionSummary {
  hash: Hash;
  from: Address;
  to?: Address;
  value: string; // ETH formatted
  gas?: string;
  gasPrice?: string;
  blockNumber?: string;
  blockHash?: Hash;
  status?: 'success' | 'reverted' | 'pending';
}

export interface ContractCall {
  address: Address;
  abi: any[];
  functionName: string;
  args?: any[];
}

export interface PreparedTransaction {
  to?: Address;
  value?: string;
  data?: Hash;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}