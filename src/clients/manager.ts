import { createPublicClient, http, type PublicClient, type Chain } from "viem";
import { SUPPORTED_CHAINS, type SupportedChainName, getDefaultChain } from "./chains.js";

export class ClientManager {
  private clients: Map<number, PublicClient>;
  private currentChain: Chain;
  private currentClient: PublicClient;

  constructor() {
    this.clients = new Map();
    this.currentChain = getDefaultChain();
    this.currentClient = this.createClient(this.currentChain);
  }

  private createClient(chain: Chain): PublicClient {
    const rpcUrl = this.getRpcUrl(chain);
    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  private getRpcUrl(chain: Chain): string | undefined {
    const envVarMap: Record<number, string> = {
      1: process.env["ETH_RPC_URL"] || "",
      137: process.env["POLYGON_RPC_URL"] || "",
      10: process.env["OPTIMISM_RPC_URL"] || "",
      42161: process.env["ARB_RPC_URL"] || "",
      8453: process.env["BASE_RPC_URL"] || "",
      56: process.env["BSC_RPC_URL"] || "",
      43114: process.env["AVAX_RPC_URL"] || "",
    };

    const customRpc = envVarMap[chain.id];
    if (customRpc) {return customRpc;}

    // Fall back to public RPC
    return undefined;
  }

  getClient(chainName?: SupportedChainName): PublicClient {
    if (!chainName) {
      return this.currentClient;
    }

    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    // Check cache first
    let client = this.clients.get(chain.id);
    if (!client) {
      client = this.createClient(chain);
      this.clients.set(chain.id, client);
    }

    return client;
  }

  getCurrentChain(): Chain {
    return this.currentChain;
  }

  switchChain(chainName: SupportedChainName): void {
    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    this.currentChain = chain;
    this.currentClient = this.getClient(chainName);
  }

  getSupportedChains(): Array<{ name: string; chain: Chain }> {
    return Object.entries(SUPPORTED_CHAINS).map(([name, chain]) => ({
      name,
      chain,
    }));
  }
}
