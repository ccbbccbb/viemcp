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

  // TODO: Add resources (currently commented out due to MCP SDK typing issues)
  // server.resource("chains/*", "Get chain information and current state", async (uri) => {
  //   // Implementation here...
  // });

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
