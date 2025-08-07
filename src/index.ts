#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createPublicClient,
  http,
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
import * as chains from "viem/chains";
import { normalize } from "viem/ens";
import { z } from "zod";
import { registerEVMPrompts } from "./core/prompts.js";

// Helper function to get RPC URL from environment based on provider preference
function getRpcUrl(chainName: string): string | undefined {
  const provider = process.env["RPC_PROVIDER"] || "drpc";

  // Try various environment variable formats
  const envVariants = [
    chainName.toUpperCase(),
    chainName.toUpperCase().replace("-", "_"),
    chainName.toUpperCase().replace(" ", "_"),
    chainName
      .replace(/([A-Z])/g, "_$1")
      .toUpperCase()
      .replace(/^_/, ""), // camelCase to SNAKE_CASE
  ];

  for (const variant of envVariants) {
    // First try provider-specific URL
    const providerUrl = process.env[`${variant}_RPC_URL_${provider.toUpperCase()}`];
    if (providerUrl) {
      return providerUrl;
    }

    // Fall back to generic URL
    const genericUrl = process.env[`${variant}_RPC_URL`];
    if (genericUrl) {
      return genericUrl;
    }
  }

  return undefined;
}

// Create chain name to viem chain mapping from all available chains
const createChainMapping = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapping: Record<string, any> = {};

  // Add all viem chains with their original names
  Object.entries(chains).forEach(([key, chain]) => {
    if (chain && typeof chain === "object" && "id" in chain && "name" in chain) {
      // Add with original export name (camelCase)
      mapping[key] = chain;

      // Add with lowercase version
      mapping[key.toLowerCase()] = chain;

      // Add with kebab-case version
      const kebabCase = key
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "");
      if (kebabCase !== key.toLowerCase()) {
        mapping[kebabCase] = chain;
      }

      // Add common aliases
      if (key === "mainnet") {
        mapping["ethereum"] = chain;
        mapping["eth"] = chain;
      }
      if (key === "bsc") {
        mapping["bnb"] = chain;
        mapping["binance"] = chain;
      }
      if (key === "avalanche") {
        mapping["avax"] = chain;
      }
      if (key === "arbitrum") {
        mapping["arb"] = chain;
      }
      if (key === "optimism") {
        mapping["op"] = chain;
      }
      if (key === "polygon") {
        mapping["matic"] = chain;
      }
      if (key === "fantom") {
        mapping["ftm"] = chain;
      }
      if (key === "klaytn") {
        mapping["kaia"] = chain;
      }
    }
  });

  return mapping;
};

const SUPPORTED_CHAINS = createChainMapping();

type SupportedChainName = string;

// Enhanced client manager with custom RPC support
class ClientManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clients: Map<number, any> = new Map();

  getClient(chainName?: SupportedChainName) {
    const chain = chainName ? SUPPORTED_CHAINS[chainName] : chains.mainnet;

    if (!chain) {
      throw new Error(
        `Unsupported chain: ${chainName}. Use 'listSupportedChains' to see available chains.`
      );
    }

    if (!this.clients.has(chain.id)) {
      // Try to get custom RPC URL from environment
      const customRpcUrl = chainName ? getRpcUrl(chainName) : undefined;

      const transport = customRpcUrl ? http(customRpcUrl) : http(); // Falls back to viem's default public RPC

      this.clients.set(
        chain.id,
        createPublicClient({
          chain,
          transport,
        })
      );

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

  // Get all supported chain names
  getSupportedChains(): string[] {
    return Object.keys(SUPPORTED_CHAINS);
  }
}

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

// Helper functions
function textResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          data,
          (_key, value) => (typeof value === "bigint" ? value.toString() : value),
          2
        ),
      },
    ],
  };
}

function handleError(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
  };
}

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
      includeAvatar: { type: "boolean", description: "If true, also return ENS avatar", default: false },
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
          const value = await client
            .getEnsText({ name: normalized, key })
            .catch(() => null);
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
});

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
        throw new Error("'numberOrTag' is required (e.g., 'latest' or a block number like '12345' or '0xabc')");
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
      to: { type: "string", description: "Recipient address (optional for deploy)", },
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
      type PartialContract = { address: string; abi: unknown[]; functionName: string; args?: unknown[] };
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
        slot: index,
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
        client.readContract({ address: tokenAddress as Address, abi: erc20Abi, functionName: "name" }).catch(
          () => ""
        ),
        client.readContract({ address: tokenAddress as Address, abi: erc20Abi, functionName: "symbol" }).catch(
          () => ""
        ),
        client.readContract({ address: tokenAddress as Address, abi: erc20Abi, functionName: "decimals" }),
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

server.tool(
  "getEnsAvatar",
  "Resolve ENS avatar for a name",
  {
    type: "object",
    properties: {
      name: { type: "string", description: "ENS name (e.g., vitalik.eth)" },
      chain: { type: "string", description: "Chain to use (typically mainnet)" },
    },
    required: ["name"],
  },
  async ({ name, chain }) => {
    try {
      const client = clientManager.getClient(chain ?? "ethereum");
      const avatar = await client.getEnsAvatar({ name: normalize(name) });
      return jsonResponse({ name, avatar });
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getEnsText",
  "Resolve ENS text record for a name",
  {
    type: "object",
    properties: {
      name: { type: "string", description: "ENS name (e.g., vitalik.eth)" },
      key: { type: "string", description: "Text record key (e.g., com.twitter)" },
      chain: { type: "string", description: "Chain to use (typically mainnet)" },
    },
    required: ["name", "key"],
  },
  async ({ name, key, chain }) => {
    try {
      const client = clientManager.getClient(chain ?? "ethereum");
      const text = await client.getEnsText({ name: normalize(name), key });
      return jsonResponse({ name, key, text });
    } catch (error) {
      return handleError(error);
    }
  }
);

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
  async ({ from, to, data, value, gas, maxFeePerGas, maxPriorityFeePerGas, gasPrice, nonce, chain }) => {
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
      const data = encodeDeployData({ abi, bytecode: bytecode as `0x${string}`, args: Array.isArray(args) ? args : [] });
      return jsonResponse({ data });
    } catch (error) {
      return handleError(error);
    }
  }
);
// Dynamic GitHub Docs resources: recursively list MDX files in wevm/viem site/pages/docs and register each as a resource
type GithubTreeEntry = { path: string; mode: string; type: "blob" | "tree"; sha: string; url: string };

function getGithubHeaders(): Record<string, string> {
  // Public access only (no token)
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "viemcp-mcp-server",
  };
}

async function fetchViemDocsTree(): Promise<string[]> {
  const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
  const apiUrl = `https://api.github.com/repos/wevm/viem/git/trees/${branch}?recursive=1`;
  const res = await fetch(apiUrl, { headers: getGithubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub tree fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { tree: GithubTreeEntry[] };
  const base = "site/pages/docs/";
  return data.tree
    .filter((e) => e.type === "blob" && e.path.startsWith(base) && e.path.endsWith(".mdx"))
    .map((e) => e.path.slice(base.length)); // relative path under docs/
}

function registerGithubDocResource(relativePath: string) {
  // Use the relative path as the resource path; include extension for uniqueness
  const uri = `viem://docs/github/${relativePath}`;
  const name = `viem-doc-${relativePath.replace(/\//g, "-")}`;
  server.registerResource(
    name,
    uri,
    {
      title: `Viem Docs (GitHub): ${relativePath}`,
      description: `Live content from wevm/viem/site/pages/docs/${relativePath}`,
      mimeType: "text/markdown",
    },
    async (url) => {
      try {
        const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
        const rawUrl = `https://raw.githubusercontent.com/wevm/viem/${branch}/site/pages/docs/${relativePath}`;
        const res = await fetch(rawUrl, { headers: { "User-Agent": "viemcp-mcp-server" } });
        if (!res.ok) {
          throw new Error(`GitHub raw fetch failed: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        return {
          contents: [
            {
              uri: url.href,
              mimeType: "text/markdown",
              text,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: url.href,
              mimeType: "text/plain",
              text: `Error loading GitHub doc: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}

async function setupGithubDocsResources() {
  try {
    const mdxPaths = await fetchViemDocsTree();
    // Index resource with a list of discovered URIs
    const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
    const indexTextLines = [
      `Viem GitHub docs (branch: ${branch})`,
      "",
      "Discovered MDX files:",
      ...mdxPaths.map((p) => `- viem://docs/github/${p}`),
    ];
    server.registerResource(
      "viem-docs-github-index",
      "viem://docs/github-index",
      {
        title: "Viem Docs (GitHub) Index",
        description: "List of all Viem GitHub docs registered as resources",
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: indexTextLines.join("\n"),
          },
        ],
      })
    );
    // Register each doc resource
    mdxPaths.forEach(registerGithubDocResource);
  } catch (error) {
    console.error(
      "Failed to setup GitHub docs resources:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  // Register GitHub-based Viem docs resources before connecting
  await setupGithubDocsResources();

  // Register prompts (moved to src/core/prompts.ts)
  registerEVMPrompts(server);
  await server.connect(transport);
  console.error("viemcp started successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
