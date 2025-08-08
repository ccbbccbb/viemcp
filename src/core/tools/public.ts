import { type Address } from "viem";
import { isAddress } from "viem";
import { ClientManager } from "../clientManager.js";
import { jsonResponse, handleError } from "../responses.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPublicTools(server: McpServer, clientManager: ClientManager) {
  server.tool(
    "getTransactionCount",
    "Get the nonce (transaction count) for an address",
    {
      type: "object",
      properties: {
        address: { type: "string", description: "Ethereum address" },
        blockTag: { type: "string", description: "Block tag (latest, pending, etc.)" },
        chain: { type: "string", description: "Chain to query" },
      },
      required: ["address"],
    },
    async ({ address, blockTag, chain }) => {
      try {
        if (!isAddress(address)) {
          throw new Error("Invalid address");
        }
        const client = clientManager.getClient(chain);
        const count = await client.getTransactionCount({
          address: address as Address,
          blockTag: blockTag as never,
        });
        return jsonResponse({ address, nonce: count, chain: client.chain?.name });
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool(
    "getBlockTransactionCount",
    "Get number of transactions in a block",
    {
      type: "object",
      properties: {
        numberOrTag: { type: "string", description: "Block number (decimal/hex) or tag" },
        chain: { type: "string", description: "Chain to query" },
      },
      required: ["numberOrTag"],
    },
    async ({ numberOrTag, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const input = (numberOrTag ?? "").trim().toLowerCase();
        if (!input) {
          throw new Error("'numberOrTag' is required");
        }
        const tagSet = new Set(["latest", "earliest", "pending"]);
        let count: number;
        if (tagSet.has(input)) {
          count = await client.getBlockTransactionCount({ blockTag: input as never });
        } else {
          if (!/^\d+$/.test(input) && !/^0x[0-9a-fA-F]+$/.test(input)) {
            throw new Error("Invalid block number");
          }
          count = await client.getBlockTransactionCount({ blockNumber: BigInt(input) });
        }
        return jsonResponse({ numberOrTag, count, chain: client.chain?.name });
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.tool(
    "getLogs",
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

  server.tool(
    "getFeeHistory",
    "Get EIP-1559 fee history",
    {
      type: "object",
      properties: {
        blockCount: { type: "string", description: "Number of blocks" },
        newestBlock: { type: "string", description: "Newest block tag or number" },
        rewardPercentiles: { type: "array", description: "Optional reward percentiles" },
        chain: { type: "string", description: "Chain to query" },
      },
      required: ["blockCount", "newestBlock"],
    },
    async ({ blockCount, newestBlock, rewardPercentiles, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const count = Number(blockCount);
        if (!Number.isFinite(count) || count <= 0) {
          throw new Error("Invalid blockCount");
        }
        const nb = /^latest|earliest|pending$/.test(newestBlock)
          ? (newestBlock as never)
          : (BigInt(newestBlock) as never);
        const rewards = Array.isArray(rewardPercentiles) ? (rewardPercentiles as number[]) : [];
        const history = await client.getFeeHistory({
          blockCount: count,
          rewardPercentiles: rewards,
          blockTag: nb,
        });
        return jsonResponse(history);
      } catch (error) {
        return handleError(error);
      }
    }
  );
}
