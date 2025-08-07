import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  polygonMumbai,
  bsc,
  avalanche,
  fantom,
  gnosis,
  moonbeam,
  celo,
  aurora,
  type Chain,
} from "viem/chains";

export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  polygon: polygon,
  optimism: optimism,
  arbitrum: arbitrum,
  base: base,
  bsc: bsc,
  avalanche: avalanche,
  fantom: fantom,
  gnosis: gnosis,
  moonbeam: moonbeam,
  celo: celo,
  aurora: aurora,
  sepolia: sepolia,
  mumbai: polygonMumbai,
} as const;

export type SupportedChainName = keyof typeof SUPPORTED_CHAINS;

export function getChainByName(chainName: string): Chain | undefined {
  return SUPPORTED_CHAINS[chainName as SupportedChainName];
}

export function getChainById(chainId: number): Chain | undefined {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
}

export function getDefaultChain(): Chain {
  const defaultChainId = process.env["DEFAULT_CHAIN_ID"] ? 
    parseInt(process.env["DEFAULT_CHAIN_ID"]) : 1;
  return getChainById(defaultChainId) || mainnet;
}