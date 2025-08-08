import { normalize } from "viem/ens";
import { ClientManager } from "../clientManager.js";
import { jsonResponse, handleError } from "../responses.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEnsTools(server: McpServer, clientManager: ClientManager) {
  server.tool(
    "getEnsResolver",
    "Get ENS resolver for a name",
    {
      type: "object",
      properties: {
        name: { type: "string", description: "ENS name" },
        chain: { type: "string", description: "Chain (mainnet typically)" },
      },
      required: ["name"],
    },
    async ({ name, chain }) => {
      try {
        const client = clientManager.getClient(chain ?? "ethereum");
        const resolver = await client.getEnsResolver({ name: normalize(name) });
        return jsonResponse({ name, resolver });
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
