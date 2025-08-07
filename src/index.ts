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
  erc721Abi,
  isAddress,
  getAddress,
  keccak256,
  toHex,
} from "viem";
import { mainnet, polygon, optimism, arbitrum, base, sepolia, polygonMumbai } from "viem/chains";
import { normalize } from "viem/ens";
import { z } from "zod";

// Supported chains mapping
const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  polygon: polygon,
  optimism: optimism,
  arbitrum: arbitrum,
  base: base,
  sepolia: sepolia,
  mumbai: polygonMumbai,
} as const;

type SupportedChainName = keyof typeof SUPPORTED_CHAINS;

// Client manager
class ClientManager {
  private clients: Map<number, any> = new Map();

  getClient(chainName?: SupportedChainName) {
    const chain = chainName ? SUPPORTED_CHAINS[chainName] : mainnet;
    if (!this.clients.has(chain.id)) {
      this.clients.set(
        chain.id,
        createPublicClient({
          chain,
          transport: http(),
        })
      );
    }
    return this.clients.get(chain.id)!;
  }
}

const clientManager = new ClientManager();

// Validation schemas
const AddressSchema = z.string().refine((val) => isAddress(val), {
  message: "Invalid Ethereum address",
});
const HashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid hash");
const ChainNameSchema = z.enum([
  "ethereum",
  "polygon",
  "optimism",
  "arbitrum",
  "base",
  "sepolia",
  "mumbai",
]);

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
    content: [{ type: "text", text }],
  };
}

function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          data,
          (key, value) => (typeof value === "bigint" ? value.toString() : value),
          null,
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
        type: "text",
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
    address: AddressSchema.describe("Ethereum address"),
    chain: ChainNameSchema.optional().describe("Chain to query"),
  },
  async ({ address, chain }) => {
    try {
      const client = clientManager.getClient(chain);
      const balance = await client.getBalance({
        address: address as Address,
      });

      return textResponse(`Balance: ${formatEther(balance)} ${client.chain.nativeCurrency.symbol}`);
    } catch (error) {
      return handleError(error);
    }
  }
);

server.tool(
  "getBlockNumber",
  "Get current block number",
  {
    chain: ChainNameSchema.optional().describe("Chain to query"),
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
    hash: HashSchema.describe("Transaction hash"),
    chain: ChainNameSchema.optional().describe("Chain to query"),
  },
  async ({ hash, chain }) => {
    try {
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
    address: AddressSchema.describe("Contract address"),
    abi: z.array(z.any()).describe("Contract ABI"),
    functionName: z.string().describe("Function name"),
    args: z.array(z.any()).optional().describe("Function arguments"),
    chain: ChainNameSchema.optional().describe("Chain to query"),
  },
  async ({ address, abi, functionName, args, chain }) => {
    try {
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
    tokenAddress: AddressSchema.describe("Token contract address"),
    ownerAddress: AddressSchema.describe("Owner address"),
    chain: ChainNameSchema.optional().describe("Chain to query"),
  },
  async ({ tokenAddress, ownerAddress, chain }) => {
    try {
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
    name: z.string().describe("ENS name"),
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
    value: z.string().describe("ETH amount"),
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
    value: z.string().describe("Wei amount"),
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
    address: z.string().describe("Address to validate"),
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
    data: z.string().describe("Data to hash"),
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
server.tool("listSupportedChains", "List supported chains", {}, async () => {
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
