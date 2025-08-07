import { createPublicClient, http } from "viem";
import { SUPPORTED_CHAINS, getRpcUrl } from "./chains.js";

export type SupportedChainName = string;

export class ClientManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clients: Map<number, any> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient(chainName?: SupportedChainName): any {
    // default to mainnet
    const chain = chainName ? SUPPORTED_CHAINS[chainName] : SUPPORTED_CHAINS["mainnet"];
    if (!chain) {
      throw new Error(
        `Unsupported chain: ${chainName}. Use 'listSupportedChains' to see available chains.`
      );
    }
    if (!this.clients.has(chain.id)) {
      const customRpcUrl = chainName ? getRpcUrl(chainName) : undefined;
      const transport = customRpcUrl ? http(customRpcUrl) : http();
      const client = createPublicClient({ chain, transport });
      this.clients.set(chain.id, client);
      if (customRpcUrl) {
        console.error(`Using custom RPC for ${chainName}: ${customRpcUrl}`);
      }
    }
    const client = this.clients.get(chain.id);
    if (!client) {
      throw new Error(`Client for chain ${chain.id} not found`);
    }
    return client;
  }

  getSupportedChains(): string[] {
    return Object.keys(SUPPORTED_CHAINS);
  }
}


