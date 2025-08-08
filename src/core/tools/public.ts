import { type Address, isAddress } from "viem";
import { ClientManager } from "../clientManager.js";
import { jsonResponse, handleError } from "../responses.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPublicTools(server: McpServer, clientManager: ClientManager) {
  // Keep only explicit public primitive not covered by consolidated tools
  server.tool(
    "viemGetLogs",
    "Get logs by address/topics and block range",
    {
      type: "object",
      properties: {
        address: { type: "string", description: "Contract address (optional)" },
        topics: { type: "array", description: "Array of topics (optional)" },
        fromBlock: { type: "string", description: "From block (tag or number)" },
        toBlock: { type: "string", description: "To block (tag or number)" },
        chain: { type: "string", description: "Chain to query" },
      },
      required: [],
    },
    async ({ address, topics, fromBlock, toBlock, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const params: Record<string, unknown> = {};
        if (address) {
          if (!isAddress(address)) {
            throw new Error("Invalid address");
          }
          params["address"] = address as Address;
        }
        if (Array.isArray(topics)) {
          params["topics"] = topics as unknown[];
        }
        const parseBlock = (v?: string) =>
          v && (/^0x/.test(v) || /^\d+$/.test(v)) ? BigInt(v) : (v as never);
        if (fromBlock) {
          params["fromBlock"] = parseBlock(fromBlock);
        }
        if (toBlock) {
          params["toBlock"] = parseBlock(toBlock);
        }
        const logs = await client.getLogs(params as never);
        return jsonResponse({ count: logs.length, logs });
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
