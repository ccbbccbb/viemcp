import { createPublicClient, http } from "viem";
import type { Chain } from "viem/chains";
import { SUPPORTED_CHAINS, getRpcUrl, findChainByIdLocal, resolveChainById, registerChain, loadCustomChainsFromEnv } from "./chains.js";

export type SupportedChainName = string;

export class ClientManager {
  private clients: Map<number, ReturnType<typeof createPublicClient>> = new Map();

  getClient(chainName?: SupportedChainName) {
    // Load custom chains from env once
    loadCustomChainsFromEnv();
    // default to mainnet
    const chain: Chain | undefined = chainName ? SUPPORTED_CHAINS[chainName] : SUPPORTED_CHAINS["mainnet"];
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
      // Auto-detect chainId and register when unknown alias used
      (async () => {
        try {
          const id = await client.getChainId();
          const existing = findChainByIdLocal(id) || (await resolveChainById(id));
          if (existing && !SUPPORTED_CHAINS[existing.name]) {
            registerChain(existing);
          }
        } catch {
          // ignore detection errors
        }
      })();
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


