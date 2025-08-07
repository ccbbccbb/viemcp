import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClientManager } from "./clients/manager.js";
import { registerBlockchainTools } from "./tools/blockchain.js";
import { registerContractTools } from "./tools/contracts.js";
import { registerTokenTools } from "./tools/tokens.js";
import { registerEnsTools } from "./tools/ens.js";
import { registerUtilityTools } from "./tools/utilities.js";
import { registerMultiChainTools } from "./tools/multichain.js";

export async function createServer() {
  // Initialize client manager
  const clientManager = new ClientManager();

  // Create MCP server
  const server = new McpServer(
    {
      name: "viemcp",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register all tool categories
  registerBlockchainTools(server, clientManager);
  registerContractTools(server, clientManager);
  registerTokenTools(server, clientManager);
  registerEnsTools(server, clientManager);
  registerUtilityTools(server);
  registerMultiChainTools(server, clientManager);

  // Add resources (example)
  server.resource("chains/*", "Get chain information and current state", async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^chains\/(.+)$/);

    if (!match) {
      throw new Error("Invalid chain resource URI");
    }

    const chainName = match[1];

    try {
      const client = clientManager.getClient(chainName as any);
      const chain = client.chain;

      if (!chain) {
        throw new Error(`Chain ${chainName} not found`);
      }

      const blockNumber = await client.getBlockNumber();
      const gasPrice = await client.getGasPrice();

      return {
        contents: [
          {
            uri: `chains/${chainName}`,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                name: chainName,
                chainId: chain.id,
                displayName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                currentBlock: blockNumber.toString(),
                gasPrice: gasPrice.toString(),
                rpcUrls: chain.rpcUrls,
                blockExplorers: chain.blockExplorers,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Error getting chain info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  return server;
}

export async function startServer() {
  try {
    const server = await createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Log to stderr to avoid interfering with stdio transport
    console.error("viemcp started successfully");
    console.error("Server is running on stdio transport");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
