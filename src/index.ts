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
  erc20Abi,
  isAddress,
  keccak256,
  toHex,
} from "viem";
import * as chains from "viem/chains";
import { normalize } from "viem/ens";
import { z } from "zod";

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
  "Resolve ENS name to address",
  {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "ENS name",
      },
    },
    required: ["name"],
  },
  async ({ name }) => {
    try {
      const client = clientManager.getClient("ethereum");
      const address = await client.getEnsAddress({
        name: normalize(name),
      });

      return textResponse(address ? `${name} → ${address}` : `${name} not found`);
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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("viemcp started successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
