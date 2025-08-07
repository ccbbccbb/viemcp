import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address, erc20Abi, erc721Abi } from "viem";
import { ClientManager } from "../clients/manager.js";
import { AddressSchema, ChainNameSchema } from "../utils/validation.js";
import { handleToolError } from "../utils/errors.js";
import { formatBalance, jsonResponse, textResponse } from "../utils/formatting.js";

// ERC1155 ABI subset
const erc1155Abi = [
  {
    inputs: [{ name: "account", type: "address" }, { name: "id", type: "uint256" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "uri",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function registerTokenTools(server: McpServer, clientManager: ClientManager) {
  // ERC20 Balance
  server.tool(
    "getERC20Balance",
    "Get ERC20 token balance for an address",
    {
      tokenAddress: AddressSchema.describe("ERC20 token contract address"),
      ownerAddress: AddressSchema.describe("Address to check balance for"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, ownerAddress, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
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
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "symbol",
          }).catch(() => "TOKEN"), // Fallback if symbol fails
        ]);
        
        const formatted = formatBalance(balance, Number(decimals), symbol);
        
        return textResponse(
          `ERC20 balance for ${ownerAddress}: ${formatted} (${balance.toString()} raw)`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC20 Metadata
  server.tool(
    "getERC20Metadata",
    "Get ERC20 token metadata (name, symbol, decimals, totalSupply)",
    {
      tokenAddress: AddressSchema.describe("ERC20 token contract address"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "name",
          }).catch(() => "Unknown"),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "symbol",
          }).catch(() => "UNKNOWN"),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "decimals",
          }),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "totalSupply",
          }).catch(() => 0n),
        ]);
        
        return jsonResponse({
          address: tokenAddress,
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: formatBalance(totalSupply, Number(decimals)),
          chain: client.chain?.name,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC20 Allowance
  server.tool(
    "getERC20Allowance",
    "Check ERC20 token spending allowance",
    {
      tokenAddress: AddressSchema.describe("ERC20 token contract address"),
      owner: AddressSchema.describe("Token owner address"),
      spender: AddressSchema.describe("Spender address"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, owner, spender, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const [allowance, decimals, symbol] = await Promise.all([
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [owner as Address, spender as Address],
          }),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "decimals",
          }),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: "symbol",
          }).catch(() => "TOKEN"),
        ]);
        
        const formatted = formatBalance(allowance, Number(decimals), symbol);
        
        return textResponse(
          `Allowance from ${owner} to ${spender}: ${formatted}`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC721 Owner
  server.tool(
    "getERC721Owner",
    "Get the owner of an ERC721 NFT",
    {
      tokenAddress: AddressSchema.describe("ERC721 token contract address"),
      tokenId: z.string().describe("Token ID"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, tokenId, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const owner = await client.readContract({
          address: tokenAddress as Address,
          abi: erc721Abi,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        });
        
        return textResponse(
          `Owner of token #${tokenId}: ${owner}`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC721 Balance
  server.tool(
    "getERC721Balance",
    "Get ERC721 NFT balance for an address",
    {
      tokenAddress: AddressSchema.describe("ERC721 token contract address"),
      ownerAddress: AddressSchema.describe("Address to check balance for"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, ownerAddress, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const balance = await client.readContract({
          address: tokenAddress as Address,
          abi: erc721Abi,
          functionName: "balanceOf",
          args: [ownerAddress as Address],
        });
        
        return textResponse(
          `ERC721 balance for ${ownerAddress}: ${balance.toString()} NFTs`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC721 Token URI
  server.tool(
    "getERC721TokenURI",
    "Get the metadata URI for an ERC721 NFT",
    {
      tokenAddress: AddressSchema.describe("ERC721 token contract address"),
      tokenId: z.string().describe("Token ID"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, tokenId, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const [tokenURI, name, symbol] = await Promise.all([
          client.readContract({
            address: tokenAddress as Address,
            abi: erc721Abi,
            functionName: "tokenURI",
            args: [BigInt(tokenId)],
          }),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc721Abi,
            functionName: "name",
          }).catch(() => "Unknown"),
          client.readContract({
            address: tokenAddress as Address,
            abi: erc721Abi,
            functionName: "symbol",
          }).catch(() => "UNKNOWN"),
        ]);
        
        return jsonResponse({
          tokenId,
          tokenURI,
          collection: {
            address: tokenAddress,
            name,
            symbol,
          },
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC1155 Balance
  server.tool(
    "getERC1155Balance",
    "Get ERC1155 token balance",
    {
      tokenAddress: AddressSchema.describe("ERC1155 token contract address"),
      tokenId: z.string().describe("Token ID"),
      ownerAddress: AddressSchema.describe("Address to check balance for"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, tokenId, ownerAddress, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const balance = await client.readContract({
          address: tokenAddress as Address,
          abi: erc1155Abi,
          functionName: "balanceOf",
          args: [ownerAddress as Address, BigInt(tokenId)],
        });
        
        return textResponse(
          `ERC1155 balance for token #${tokenId}: ${balance.toString()}`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // ERC1155 URI
  server.tool(
    "getERC1155URI",
    "Get the metadata URI for an ERC1155 token",
    {
      tokenAddress: AddressSchema.describe("ERC1155 token contract address"),
      tokenId: z.string().describe("Token ID"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ tokenAddress, tokenId, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        
        const uri = await client.readContract({
          address: tokenAddress as Address,
          abi: erc1155Abi,
          functionName: "uri",
          args: [BigInt(tokenId)],
        });
        
        return jsonResponse({
          tokenId,
          uri,
          address: tokenAddress,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}