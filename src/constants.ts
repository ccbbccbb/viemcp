import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  polygonMumbai,
  goerli,
  arbitrumGoerli,
  optimismGoerli,
  baseGoerli,
} from "viem/chains";

// Supported chains mapping
export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  polygon: polygon,
  optimism: optimism,
  arbitrum: arbitrum,
  base: base,
  sepolia: sepolia,
  mumbai: polygonMumbai,
  goerli: goerli,
  arbitrumGoerli: arbitrumGoerli,
  optimismGoerli: optimismGoerli,
  baseGoerli: baseGoerli,
} as const;

export type SupportedChainName = keyof typeof SUPPORTED_CHAINS;

// Common contract ABIs
export const COMMON_ABIS = {
  ERC20_MINIMAL: [
    {
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ],
  ERC721_MINIMAL: [
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "ownerOf",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "tokenURI",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
  ],
} as const;

// Default RPC endpoints (fallbacks)
export const DEFAULT_RPC_URLS = {
  ethereum: ["https://eth.public-rpc.com", "https://ethereum.publicnode.com"],
  polygon: ["https://polygon.public-rpc.com", "https://polygon.llamarpc.com"],
  optimism: ["https://optimism.public-rpc.com", "https://optimism.llamarpc.com"],
  arbitrum: ["https://arbitrum.public-rpc.com", "https://arbitrum.llamarpc.com"],
  base: ["https://base.public-rpc.com", "https://base.llamarpc.com"],
} as const;

// Block explorer URLs
export const BLOCK_EXPLORER_URLS = {
  ethereum: "https://etherscan.io",
  polygon: "https://polygonscan.com",
  optimism: "https://optimistic.etherscan.io",
  arbitrum: "https://arbiscan.io",
  base: "https://basescan.org",
  sepolia: "https://sepolia.etherscan.io",
  mumbai: "https://mumbai.polygonscan.com",
} as const;
