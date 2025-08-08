#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type Address,
  type Hash,
  parseEther,
  formatEther,
  formatGwei,
  erc20Abi,
  isAddress,
  keccak256,
  toHex,
  encodeFunctionData,
  encodeDeployData,
} from "viem";
import { normalize } from "viem/ens";
import { z } from "zod";
import { registerEVMPrompts } from "./core/prompts.js";
import { registerPublicTools } from "./core/tools/public.js";
import { registerEnsTools } from "./core/tools/ens.js";
import { registerConsolidatedTools } from "./core/tools/consolidated.js";
import { ClientManager } from "./core/clientManager.js";
import { setupGithubDocsResources } from "./core/resources/docs.js";
import { jsonResponse, textResponse, handleError } from "./core/responses.js";
import { SUPPORTED_CHAINS } from "./core/chains.js";

// RPC URL resolution moved to core/chains.ts

const clientManager = new ClientManager();

// Validation schemas
const _AddressSchema = z.string().refine((val) => isAddress(val), {
  message: "Invalid Ethereum address",
});
const _HashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid hash");
// Create dynamic chain name schema from supported chains
const _ChainNameSchema = z.string().refine((chainName: string) => chainName in SUPPORTED_CHAINS, {
  message: "Unsupported chain. Use 'listSupportedChains' tool to see available chains.",
});

// Create server instance
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

// Additional read-only tools (Public Actions)
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
      const resolver = await client.getEnsResolver({ name });
      return jsonResponse({ name, resolver });
    } catch (error) {
      return handleError(error);
    }
  }
);
// Helper functions moved to core/responses

// Helper to stringify JSON with BigInt support (prefix underscore to avoid unused rule)
function _toJsonString(data: unknown) {
  return JSON.stringify(
    data,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
}

// Core Blockchain Tools
server.tool(
  "getBalance",
  "Get native token balance for an address",
  {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Ethereum address",
      },
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: ["address"],
  },
  async ({ address, chain }) => {
    try {
      // Validate address
      if (!isAddress(address)) {
        throw new Error("Invalid Ethereum address");
      }

      const client = clientManager.getClient(chain);
      const balance = await client.getBalance({
        address: address as Address,
      });

      return textResponse(
        `Balance: ${formatEther(balance)} ${client.chain?.nativeCurrency.symbol || "ETH"}`
      );
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getBlockNumber",
  "Get current block number",
  {
    type: "object",
    properties: {
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: [],
  },
  async ({ chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const blockNumber = await client.getBlockNumber();

      return textResponse(`Block number: ${blockNumber.toString()}`);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getTransaction",
  "Get transaction details",
  {
    type: "object",
    properties: {
      hash: {
        type: "string",
        pattern: "^0x[a-fA-F0-9]{64}$",
        description: "Transaction hash",
      },
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: ["hash"],
  },
  async ({ hash, chain }) => {
    try {
      // Validate hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
        throw new Error("Invalid transaction hash format");
      }

      const client = clientManager.getClient(chain);
      const tx = await client.getTransaction({ hash: hash as Hash });

      return jsonResponse({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: formatEther(tx.value),
        gasPrice: tx.gasPrice?.toString(),
        blockNumber: tx.blockNumber?.toString(),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Contract Tools
server.tool(
  "readContract",
  "Read from smart contract",
  {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Contract address",
      },
      abi: {
        type: "array",
        description: "Contract ABI",
      },
      functionName: {
        type: "string",
        description: "Function name",
      },
      args: {
        type: "array",
        description: "Function arguments",
      },
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: ["address", "abi", "functionName"],
  },
  async ({ address, abi, functionName, args, chain }) => {
    try {
      // Validate address
      if (!isAddress(address)) {
        throw new Error("Invalid contract address");
      }

      const client = clientManager.getClient(chain);
      const result = await client.readContract({
        address: address as Address,
        abi,
        functionName,
        args: args || [],
      });

      return jsonResponse({ function: functionName, result });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Token Tools
server.tool(
  "getERC20Balance",
  "Get ERC20 token balance",
  {
    type: "object",
    properties: {
      tokenAddress: {
        type: "string",
        description: "Token contract address",
      },
      ownerAddress: {
        type: "string",
        description: "Owner address",
      },
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: ["tokenAddress", "ownerAddress"],
  },
  async ({ tokenAddress, ownerAddress, chain }) => {
    try {
      // Validate addresses
      if (!isAddress(tokenAddress)) {
        throw new Error("Invalid token contract address");
      }
      if (!isAddress(ownerAddress)) {
        throw new Error("Invalid owner address");
      }

      const client = clientManager.getClient(chain);

      const [balance, decimals, symbol] = await Promise.all([
        client.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [ownerAddress as Address],
        }),
        client.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: "decimals",
        }),
        client
          .readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "symbol",
          })
          .catch(() => "TOKEN"),
      ]);

      const formatted = Number(balance) / Math.pow(10, Number(decimals));

      return textResponse(`Balance: ${formatted} ${symbol}`);
    } catch (error) {
      return handleError(error);
    }
  }
);

// ENS Tools
server.tool(
  "resolveEnsAddress",
  "Resolve ENS name to address. Optionally include avatar and specific text records.",
  {
    type: "object",
    properties: {
      name: { type: "string", description: "ENS name (e.g., vitalik.eth)" },
      chain: { type: "string", description: "Chain to use (defaults to ethereum)" },
      includeAvatar: {
        type: "boolean",
        description: "If true, also return ENS avatar",
        default: false,
      },
      textKeys: {
        type: "array",
        description: "If provided, return these ENS text records (e.g., com.twitter, url)",
        items: { type: "string" },
      },
    },
    required: ["name"],
  },
  async ({ name, chain, includeAvatar, textKeys }) => {
    try {
      const client = clientManager.getClient(chain ?? "ethereum");
      const normalized = normalize(name);

      const address = await client.getEnsAddress({ name: normalized });

      // Optionals
      let avatar: string | null | undefined = undefined;
      if (includeAvatar) {
        avatar = await client.getEnsAvatar({ name: normalized }).catch(() => null);
      }

      let texts: Record<string, string | null> | undefined = undefined;
      if (Array.isArray(textKeys) && textKeys.length > 0) {
        texts = {};
        for (const key of textKeys) {
          // catch per-key to avoid failing the whole request
          const value = await client.getEnsText({ name: normalized, key }).catch(() => null);
          texts[key] = value as string | null;
        }
      }

      return jsonResponse({
        name: normalized,
        chain: client.chain?.name ?? chain ?? "ethereum",
        address: address ?? null,
        avatar,
        texts,
      });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Utility Tools
server.tool(
  "parseEther",
  "Convert ETH to wei",
  {
    type: "object",
    properties: {
      value: {
        type: "string",
        description: "ETH amount",
      },
    },
    required: ["value"],
  },
  async ({ value }) => {
    try {
      const wei = parseEther(value);
      return textResponse(`${value} ETH = ${wei.toString()} wei`);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "formatEther",
  "Convert wei to ETH",
  {
    type: "object",
    properties: {
      value: {
        type: "string",
        description: "Wei amount",
      },
    },
    required: ["value"],
  },
  async ({ value }) => {
    try {
      const eth = formatEther(BigInt(value));
      return textResponse(`${value} wei = ${eth} ETH`);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "isAddress",
  "Validate Ethereum address",
  {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Address to validate",
      },
    },
    required: ["address"],
  },
  async ({ address }) => {
    try {
      const valid = isAddress(address);
      return textResponse(valid ? "Valid address" : "Invalid address");
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "keccak256",
  "Hash data with Keccak256",
  {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "Data to hash",
      },
    },
    required: ["data"],
  },
  async ({ data }) => {
    try {
      const hash = keccak256(toHex(data));
      return textResponse(`Hash: ${hash}`);
    } catch (error) {
      return handleError(error);
    }
  }
);

// Multi-chain Tools
server.tool(
  "listSupportedChains",
  "List supported chains",
  {
    type: "object",
    properties: {},
    required: [],
  },
  async () => {
    const chains = Object.entries(SUPPORTED_CHAINS).map(([name, chain]) => ({
      name,
      chainId: chain.id,
      displayName: chain.name,
      nativeCurrency: chain.nativeCurrency.symbol,
    }));

    return jsonResponse({ supportedChains: chains });
  }
);

// Tranche 1 — Core public actions
server.tool(
  "getBlock",
  "Get block by number or tag",
  {
    type: "object",
    properties: {
      numberOrTag: {
        type: "string",
        description: "Block number as decimal string or tag (latest, earliest, pending)",
      },
      includeTransactions: {
        type: "boolean",
        description: "Whether to include full transactions in the block",
      },
      chain: {
        type: "string",
        description: "Chain to query",
      },
    },
    required: ["numberOrTag"],
  },
  async ({ numberOrTag, includeTransactions, chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const input = (numberOrTag ?? "").trim().toLowerCase();
      if (!input) {
        throw new Error(
          "'numberOrTag' is required (e.g., 'latest' or a block number like '12345' or '0xabc')"
        );
      }

      const tagSet = new Set(["latest", "earliest", "pending"]);
      let block;
      if (tagSet.has(input)) {
        block = await client.getBlock({
          blockTag: input as "latest" | "earliest" | "pending",
          includeTransactions: Boolean(includeTransactions),
        });
      } else {
        // Accept decimal or 0x-prefixed bigint strings
        if (!/^\d+$/.test(input) && !/^0x[0-9a-fA-F]+$/.test(input)) {
          throw new Error(
            "'numberOrTag' must be a decimal number, 0x-hex number, or one of: latest | earliest | pending"
          );
        }
        const bn = BigInt(input);
        block = await client.getBlock({
          blockNumber: bn,
          includeTransactions: Boolean(includeTransactions),
        });
      }

      return jsonResponse(block);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getTransactionReceipt",
  "Get transaction receipt by hash",
  {
    type: "object",
    properties: {
      hash: {
        type: "string",
        pattern: "^0x[a-fA-F0-9]{64}$",
        description: "Transaction hash",
      },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["hash"],
  },
  async ({ hash, chain }) => {
    try {
      if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
        throw new Error("Invalid or missing 'hash'. Expected 0x-prefixed 32-byte hash.");
      }
      const client = clientManager.getClient(chain);
      const receipt = await client.getTransactionReceipt({ hash: hash as Hash });
      return jsonResponse(receipt);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getGasPrice",
  "Get current gas price",
  {
    type: "object",
    properties: {
      chain: { type: "string", description: "Chain to query" },
    },
    required: [],
  },
  async ({ chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const price = await client.getGasPrice();
      const gwei = formatGwei(price);
      return jsonResponse({ wei: price.toString(), gwei, chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "estimateGas",
  "Estimate gas for a transaction request",
  {
    type: "object",
    properties: {
      from: { type: "string", description: "Sender address" },
      to: { type: "string", description: "Recipient address (optional for deploy)" },
      data: { type: "string", description: "Calldata (0x...)" },
      value: { type: "string", description: "Value in wei as string" },
      chain: { type: "string", description: "Chain to query" },
    },
    required: [],
  },
  async ({ from, to, data, value, chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const request: Record<string, unknown> = {};
      if (from) {
        if (!isAddress(from)) {
          throw new Error("Invalid from address");
        }
        request["from"] = from as Address;
      }
      if (to) {
        if (!isAddress(to)) {
          throw new Error("Invalid to address");
        }
        request["to"] = to as Address;
      }
      if (data) {
        if (!/^0x[0-9a-fA-F]*$/.test(data)) {
          throw new Error("'data' must be a 0x-prefixed hex string");
        }
        request["data"] = data as `0x${string}`;
      }
      if (value) {
        if (!/^\d+$/.test(value) && !/^0x[0-9a-fA-F]+$/.test(value)) {
          throw new Error("'value' must be a decimal or 0x-hex string in wei");
        }
        request["value"] = BigInt(value);
      }
      const gas = await client.estimateGas(request);
      return jsonResponse({ gas: gas.toString(), chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getChainId",
  "Get chain ID",
  {
    type: "object",
    properties: {
      chain: { type: "string", description: "Chain to query" },
    },
    required: [],
  },
  async ({ chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const id = await client.getChainId();
      return jsonResponse({ chainId: id, chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tranche 2 — Contract operations
server.tool(
  "simulateContract",
  "Simulate a contract call (no state change)",
  {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      abi: { type: "array", description: "ABI JSON array" },
      functionName: { type: "string", description: "Function name" },
      args: { type: "array", description: "Function arguments" },
      chain: { type: "string", description: "Chain to query" },
      from: { type: "string", description: "Optional caller address (for context)" },
      value: { type: "string", description: "Optional msg.value in wei (decimal or 0x-hex)" },
    },
    required: ["address", "abi", "functionName"],
  },
  async ({ address, abi, functionName, args, chain, from, value }) => {
    try {
      const client = clientManager.getClient(chain);
      if (!isAddress(address)) {
        throw new Error("Invalid contract address");
      }
      const request: Record<string, unknown> = {
        address: address as Address,
        abi,
        functionName,
        args: Array.isArray(args) ? args : [],
      };
      if (from) {
        if (!isAddress(from)) {
          throw new Error("Invalid from address");
        }
        request["account"] = from as Address;
      }
      if (value) {
        if (!/^\d+$/.test(value) && !/^0x[0-9a-fA-F]+$/.test(value)) {
          throw new Error("'value' must be a decimal or 0x-hex string in wei");
        }
        request["value"] = BigInt(value);
      }
      const result = await client.simulateContract(request as never);
      return jsonResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "estimateContractGas",
  "Estimate gas for a contract call",
  {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      abi: { type: "array", description: "ABI JSON array" },
      functionName: { type: "string", description: "Function name" },
      args: { type: "array", description: "Function arguments" },
      chain: { type: "string", description: "Chain to query" },
      from: { type: "string", description: "Optional caller address (for context)" },
      value: { type: "string", description: "Optional msg.value in wei (decimal or 0x-hex)" },
    },
    required: ["address", "abi", "functionName"],
  },
  async ({ address, abi, functionName, args, chain, from, value }) => {
    try {
      const client = clientManager.getClient(chain);
      if (!isAddress(address)) {
        throw new Error("Invalid contract address");
      }
      const request: Record<string, unknown> = {
        address: address as Address,
        abi,
        functionName,
        args: Array.isArray(args) ? args : [],
      };
      if (from) {
        if (!isAddress(from)) {
          throw new Error("Invalid from address");
        }
        request["account"] = from as Address;
      }
      if (value) {
        if (!/^\d+$/.test(value) && !/^0x[0-9a-fA-F]+$/.test(value)) {
          throw new Error("'value' must be a decimal or 0x-hex string in wei");
        }
        request["value"] = BigInt(value);
      }
      const gas = await client.estimateContractGas(request as never);
      return jsonResponse({ gas: gas.toString(), chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "multicall",
  "Batch multiple contract reads (no state change)",
  {
    type: "object",
    properties: {
      contracts: {
        type: "array",
        description: "Array of { address, abi, functionName, args }",
      },
      allowFailure: {
        type: "boolean",
        description: "If true (default), failed calls return errors instead of failing the batch",
      },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["contracts"],
  },
  async ({ contracts, allowFailure, chain }) => {
    try {
      const client = clientManager.getClient(chain);
      if (!Array.isArray(contracts) || contracts.length === 0) {
        throw new Error("'contracts' must be a non-empty array");
      }
      // Basic validation and shape normalization
      type PartialContract = {
        address: string;
        abi: unknown[];
        functionName: string;
        args?: unknown[];
      };
      const normalized = (contracts as PartialContract[]).map((c) => {
        if (!c || !isAddress(c.address)) {
          throw new Error("Each contract must have a valid 'address'");
        }
        if (!Array.isArray(c.abi)) {
          throw new Error("Each contract must include an 'abi' array");
        }
        if (!c.functionName || typeof c.functionName !== "string") {
          throw new Error("Each contract must include a 'functionName'");
        }
        return {
          address: c.address as Address,
          abi: c.abi,
          functionName: c.functionName,
          args: Array.isArray(c.args) ? c.args : [],
        };
      });
      const result = await client.multicall({
        contracts: normalized as never,
        allowFailure: allowFailure !== false,
      });
      return jsonResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getCode",
  "Get contract bytecode at an address",
  {
    type: "object",
    properties: {
      address: { type: "string", description: "Address to query" },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["address"],
  },
  async ({ address, chain }) => {
    try {
      if (!isAddress(address)) {
        throw new Error("Invalid address");
      }
      const client = clientManager.getClient(chain);
      const code = await client.getCode({ address: address as Address });
      return jsonResponse({ code, address, chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getStorageAt",
  "Read raw storage slot at an address",
  {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      slot: { type: "string", description: "Storage slot (0x-hex or decimal)" },
      blockTag: {
        type: "string",
        description: "Optional block tag (latest, earliest, pending)",
      },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["address", "slot"],
  },
  async ({ address, slot, blockTag, chain }) => {
    try {
      if (!isAddress(address)) {
        throw new Error("Invalid address");
      }
      const input = (slot ?? "").trim().toLowerCase();
      if (!/^\d+$/.test(input) && !/^0x[0-9a-fA-F]+$/.test(input)) {
        throw new Error("'slot' must be decimal or 0x-hex");
      }
      const index = BigInt(input);
      const client = clientManager.getClient(chain);
      const value = await client.getStorageAt({
        address: address as Address,
        slot: index as unknown as `0x${string}`,
        blockTag: blockTag as never,
      });
      return jsonResponse({ slot: input, value, address, chain: client.chain?.name });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tranche 3 — ERC20
server.tool(
  "getERC20Metadata",
  "Get ERC20 token metadata (name, symbol, decimals)",
  {
    type: "object",
    properties: {
      tokenAddress: { type: "string", description: "ERC20 contract address" },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["tokenAddress"],
  },
  async ({ tokenAddress, chain }) => {
    try {
      if (!isAddress(tokenAddress)) {
        throw new Error("Invalid token address");
      }
      const client = clientManager.getClient(chain);
      const [name, symbol, decimals] = await Promise.all([
        client
          .readContract({ address: tokenAddress as Address, abi: erc20Abi, functionName: "name" })
          .catch(() => ""),
        client
          .readContract({ address: tokenAddress as Address, abi: erc20Abi, functionName: "symbol" })
          .catch(() => ""),
        client.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);
      return jsonResponse({ tokenAddress, name, symbol, decimals: Number(decimals) });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getERC20Allowance",
  "Get ERC20 allowance (spender allowance granted by owner)",
  {
    type: "object",
    properties: {
      tokenAddress: { type: "string", description: "ERC20 contract address" },
      owner: { type: "string", description: "Owner address" },
      spender: { type: "string", description: "Spender address" },
      chain: { type: "string", description: "Chain to query" },
    },
    required: ["tokenAddress", "owner", "spender"],
  },
  async ({ tokenAddress, owner, spender, chain }) => {
    try {
      if (!isAddress(tokenAddress)) {
        throw new Error("Invalid token address");
      }
      if (!isAddress(owner)) {
        throw new Error("Invalid owner address");
      }
      if (!isAddress(spender)) {
        throw new Error("Invalid spender address");
      }
      const client = clientManager.getClient(chain);
      const allowance = await client.readContract({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner as Address, spender as Address],
      });
      return jsonResponse({ tokenAddress, owner, spender, allowance: allowance.toString() });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tranche 4 — ENS
server.tool(
  "getEnsName",
  "Reverse resolve an address to ENS name",
  {
    type: "object",
    properties: {
      address: { type: "string", description: "Ethereum address" },
      chain: { type: "string", description: "Chain to use (typically mainnet)" },
    },
    required: ["address"],
  },
  async ({ address, chain }) => {
    try {
      if (!isAddress(address)) {
        throw new Error("Invalid address");
      }
      const client = clientManager.getClient(chain ?? "ethereum");
      const name = await client.getEnsName({ address: address as Address });
      return jsonResponse({ address, name });
    } catch (error) {
      return handleError(error);
    }
  }
);

// Removed getEnsAvatar/getEnsText as resolveEnsAddress covers these via flags

// Tranche 5 — Tx prep / encoding
server.tool(
  "prepareTransactionRequest",
  "Prepare a transaction request (no signing)",
  {
    type: "object",
    properties: {
      from: { type: "string", description: "Sender address (optional)" },
      to: { type: "string", description: "Recipient address (omit for deploy)" },
      data: { type: "string", description: "Calldata (0x...)" },
      value: { type: "string", description: "Value in wei (decimal or 0x-hex)" },
      gas: { type: "string", description: "Gas limit (decimal or 0x-hex)" },
      maxFeePerGas: { type: "string", description: "EIP-1559: max fee per gas (wei)" },
      maxPriorityFeePerGas: { type: "string", description: "EIP-1559: priority fee (wei)" },
      gasPrice: { type: "string", description: "Legacy gas price (wei)" },
      nonce: { type: "string", description: "Transaction nonce (decimal or 0x-hex)" },
      chain: { type: "string", description: "Chain to prepare against" },
    },
    required: [],
  },
  async ({
    from,
    to,
    data,
    value,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
    nonce,
    chain,
  }) => {
    try {
      const client = clientManager.getClient(chain);
      const req: Record<string, unknown> = {};

      const toBigIntIf = (v?: string) => (v ? BigInt(v) : undefined);

      if (from) {
        if (!isAddress(from)) {
          throw new Error("Invalid from address");
        }
        req["from"] = from as Address;
      }
      if (to) {
        if (!isAddress(to)) {
          throw new Error("Invalid to address");
        }
        req["to"] = to as Address;
      }
      if (data) {
        if (!/^0x[0-9a-fA-F]*$/.test(data)) {
          throw new Error("'data' must be 0x-hex");
        }
        req["data"] = data as `0x${string}`;
      }
      if (value) {
        req["value"] = toBigIntIf(value);
      }
      if (gas) {
        req["gas"] = toBigIntIf(gas);
      }
      if (gasPrice) {
        req["gasPrice"] = toBigIntIf(gasPrice);
      }
      if (maxFeePerGas) {
        req["maxFeePerGas"] = toBigIntIf(maxFeePerGas);
      }
      if (maxPriorityFeePerGas) {
        req["maxPriorityFeePerGas"] = toBigIntIf(maxPriorityFeePerGas);
      }
      if (nonce) {
        req["nonce"] = Number(nonce);
      }

      // Let viem fill defaults (e.g., gas, fees) via estimate / fee market if missing
      const prepared = await client.prepareTransactionRequest(req as never);
      // Ensure BigInts are stringified
      return jsonResponse(prepared);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "encodeFunctionData",
  "Encode function call data for a contract",
  {
    type: "object",
    properties: {
      abi: { type: "array", description: "ABI JSON array" },
      functionName: { type: "string", description: "Function name" },
      args: { type: "array", description: "Function arguments" },
    },
    required: ["abi", "functionName"],
  },
  async ({ abi, functionName, args }) => {
    try {
      const data = encodeFunctionData({ abi, functionName, args: Array.isArray(args) ? args : [] });
      return jsonResponse({ data });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "encodeDeployData",
  "Encode deployment data for a contract",
  {
    type: "object",
    properties: {
      abi: { type: "array", description: "Contract ABI" },
      bytecode: { type: "string", description: "0x-hex bytecode" },
      args: { type: "array", description: "Constructor args" },
    },
    required: ["abi", "bytecode"],
  },
  async ({ abi, bytecode, args }) => {
    try {
      if (!/^0x[0-9a-fA-F]*$/.test(bytecode)) {
        throw new Error("'bytecode' must be 0x-hex");
      }
      const data = encodeDeployData({
        abi,
        bytecode: bytecode as `0x${string}`,
        args: Array.isArray(args) ? args : [],
      });
      return jsonResponse({ data });
    } catch (error) {
      return handleError(error);
    }
  }
);
// Docs helpers moved to core/resources/docs.ts

// Docs resources moved to core/resources/docs.ts

// Start server
async function main() {
  const transport = new StdioServerTransport();
  // Register GitHub-based Viem docs resources before connecting
  await setupGithubDocsResources(server);

  // Register prompts (moved to src/core/prompts.ts)
  registerEVMPrompts(server);
  // Register modular tools
  registerPublicTools(server, clientManager);
  registerEnsTools(server, clientManager);
  registerConsolidatedTools(server, clientManager);
  await server.connect(transport);
  console.error("viemcp started successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
