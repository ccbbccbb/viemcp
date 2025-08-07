import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ClientManager } from "../clients/manager.js";
import { ChainNameSchema } from "../utils/validation.js";
import { handleToolError } from "../utils/errors.js";
import { jsonResponse, textResponse } from "../utils/formatting.js";

export function registerMultiChainTools(server: McpServer, clientManager: ClientManager) {
  // List Supported Chains
  server.tool("listSupportedChains", "List all supported blockchain networks", {}, async () => {
    try {
      const chains = clientManager.getSupportedChains();
      const currentChain = clientManager.getCurrentChain();

      return jsonResponse({
        currentChain: {
          name: chains.find((c) => c.chain.id === currentChain.id)?.name || "unknown",
          chainId: currentChain.id,
          displayName: currentChain.name,
          nativeCurrency: currentChain.nativeCurrency,
        },
        supportedChains: chains.map(({ name, chain }) => ({
          name,
          chainId: chain.id,
          displayName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          testnet: chain.testnet || false,
        })),
      });
    } catch (error) {
      return handleToolError(error);
    }
  });

  // Switch Chain
  server.tool(
    "switchChain",
    "Switch the default chain for subsequent operations",
    {
      chain: ChainNameSchema.describe("Chain to switch to"),
    },
    async ({ chain }) => {
      try {
        clientManager.switchChain(chain);
        const currentChain = clientManager.getCurrentChain();

        return textResponse(`Switched to ${currentChain.name} (Chain ID: ${currentChain.id})`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Current Chain
  server.tool(
    "getCurrentChain",
    "Get information about the currently selected chain",
    {},
    async () => {
      try {
        const currentChain = clientManager.getCurrentChain();
        const chains = clientManager.getSupportedChains();
        const chainName = chains.find((c) => c.chain.id === currentChain.id)?.name;

        return jsonResponse({
          name: chainName,
          chainId: currentChain.id,
          displayName: currentChain.name,
          nativeCurrency: currentChain.nativeCurrency,
          rpcUrls: currentChain.rpcUrls,
          blockExplorers: currentChain.blockExplorers,
          testnet: currentChain.testnet || false,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Chain Info
  server.tool(
    "getChainInfo",
    "Get detailed information about a specific chain",
    {
      chain: ChainNameSchema.describe("Chain to get info for"),
    },
    async ({ chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const chainInfo = client.chain;

        if (!chainInfo) {
          throw new Error("Chain information not available");
        }

        // Get current block number
        const blockNumber = await client.getBlockNumber();
        const gasPrice = await client.getGasPrice();

        return jsonResponse({
          name: chain,
          chainId: chainInfo.id,
          displayName: chainInfo.name,
          nativeCurrency: chainInfo.nativeCurrency,
          rpcUrls: chainInfo.rpcUrls,
          blockExplorers: chainInfo.blockExplorers,
          testnet: chainInfo.testnet || false,
          currentBlock: blockNumber.toString(),
          gasPrice: gasPrice.toString(),
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
