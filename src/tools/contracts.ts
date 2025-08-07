import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address, type Abi, encodeFunctionData, decodeFunctionResult } from "viem";
import { ClientManager } from "../clients/manager.js";
import { AddressSchema, ChainNameSchema, BlockNumberSchema } from "../utils/validation.js";
import { handleToolError } from "../utils/errors.js";
import { jsonResponse, textResponse } from "../utils/formatting.js";

export function registerContractTools(server: McpServer, clientManager: ClientManager) {
  // Read Contract
  server.tool(
    "readContract",
    "Read data from a smart contract (view/pure functions)",
    {
      address: AddressSchema.describe("Contract address"),
      abi: z.array(z.any()).describe("Contract ABI (JSON array)"),
      functionName: z.string().describe("Function name to call"),
      args: z.array(z.any()).optional().describe("Function arguments"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      blockNumber: BlockNumberSchema.optional().describe("Block number to query at"),
    },
    async ({ address, abi, functionName, args, chainId, blockNumber }) => {
      try {
        const client = clientManager.getClient(chainId);
        const result = await client.readContract({
          address: address as Address,
          abi: abi as Abi,
          functionName,
          args: args || [],
          blockNumber: typeof blockNumber === "number" ? BigInt(blockNumber) : blockNumber,
        });

        return jsonResponse({
          function: functionName,
          result,
          address,
          chain: client.chain?.name,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Simulate Contract
  server.tool(
    "simulateContract",
    "Simulate a contract call to check if it would succeed",
    {
      address: AddressSchema.describe("Contract address"),
      abi: z.array(z.any()).describe("Contract ABI"),
      functionName: z.string().describe("Function name to call"),
      args: z.array(z.any()).optional().describe("Function arguments"),
      account: AddressSchema.optional().describe("Account to simulate from"),
      value: z.string().optional().describe("Value to send with the call"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ address, abi, functionName, args, account, value, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const result = await client.simulateContract({
          address: address as Address,
          abi: abi as Abi,
          functionName,
          args: args || [],
          account: account as Address | undefined,
          value: value ? BigInt(value) : undefined,
        });

        return jsonResponse({
          function: functionName,
          result: result.result,
          request: {
            to: result.request.to,
            data: result.request.data,
            value: result.request.value?.toString(),
          },
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Estimate Contract Gas
  server.tool(
    "estimateContractGas",
    "Estimate gas for a contract call",
    {
      address: AddressSchema.describe("Contract address"),
      abi: z.array(z.any()).describe("Contract ABI"),
      functionName: z.string().describe("Function name to call"),
      args: z.array(z.any()).optional().describe("Function arguments"),
      account: AddressSchema.optional().describe("Account to call from"),
      value: z.string().optional().describe("Value to send"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ address, abi, functionName, args, account, value, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const gas = await client.estimateContractGas({
          address: address as Address,
          abi: abi as Abi,
          functionName,
          args: args || [],
          account: account as Address | undefined,
          value: value ? BigInt(value) : undefined,
        });

        return textResponse(`Estimated gas for ${functionName}(): ${gas.toString()} units`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Multicall
  server.tool(
    "multicall",
    "Batch multiple contract calls into a single request",
    {
      contracts: z
        .array(
          z.object({
            address: AddressSchema.describe("Contract address"),
            abi: z.array(z.any()).describe("Contract ABI"),
            functionName: z.string().describe("Function name"),
            args: z.array(z.any()).optional().describe("Function arguments"),
          })
        )
        .describe("Array of contract calls"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      allowFailure: z.boolean().optional().default(true).describe("Allow individual calls to fail"),
    },
    async ({ contracts, chainId, allowFailure }) => {
      try {
        const client = clientManager.getClient(chainId);
        const results = await client.multicall({
          contracts: contracts.map((c) => ({
            address: c.address as Address,
            abi: c.abi as Abi,
            functionName: c.functionName,
            args: c.args || [],
          })),
          allowFailure,
        });

        return jsonResponse({
          results: results.map((result, index) => ({
            contract: contracts[index]?.address,
            function: contracts[index]?.functionName,
            result: result.status === "success" ? result.result : null,
            error: result.status === "failure" ? result.error.message : null,
          })),
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Contract Code
  server.tool(
    "getCode",
    "Get the bytecode of a contract",
    {
      address: AddressSchema.describe("Contract address"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      blockNumber: BlockNumberSchema.optional().describe("Block number to query at"),
    },
    async ({ address, chainId, blockNumber }) => {
      try {
        const client = clientManager.getClient(chainId);
        const code = await client.getCode({
          address: address as Address,
          blockNumber: typeof blockNumber === "number" ? BigInt(blockNumber) : blockNumber,
        });

        if (!code || code === "0x") {
          return textResponse(`No contract found at address ${address}`);
        }

        return jsonResponse({
          address,
          hasCode: true,
          codeLength: (code.length - 2) / 2, // Subtract 0x and divide by 2 for bytes
          code: code.slice(0, 66) + "...", // Show first 32 bytes
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Storage At
  server.tool(
    "getStorageAt",
    "Read a storage slot from a contract",
    {
      address: AddressSchema.describe("Contract address"),
      slot: z.union([z.string(), z.number()]).describe("Storage slot"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      blockNumber: BlockNumberSchema.optional().describe("Block number to query at"),
    },
    async ({ address, slot, chainId, blockNumber }) => {
      try {
        const client = clientManager.getClient(chainId);
        const slotHex =
          typeof slot === "number"
            ? (`0x${slot.toString(16).padStart(64, "0")}` as `0x${string}`)
            : (slot as `0x${string}`);

        const value = await client.getStorageAt({
          address: address as Address,
          slot: slotHex,
          blockNumber: typeof blockNumber === "number" ? BigInt(blockNumber) : blockNumber,
        });

        return jsonResponse({
          address,
          slot: slotHex,
          value,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Encode Function Data
  server.tool(
    "encodeFunctionData",
    "Encode function call data for a contract interaction",
    {
      abi: z.array(z.any()).describe("Contract ABI"),
      functionName: z.string().describe("Function name"),
      args: z.array(z.any()).optional().describe("Function arguments"),
    },
    async ({ abi, functionName, args }) => {
      try {
        const data = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: args || [],
        });

        return jsonResponse({
          functionName,
          encodedData: data,
          args,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Decode Function Result
  server.tool(
    "decodeFunctionResult",
    "Decode the result of a contract function call",
    {
      abi: z.array(z.any()).describe("Contract ABI"),
      functionName: z.string().describe("Function name"),
      data: z.string().describe("Encoded result data"),
    },
    async ({ abi, functionName, data }) => {
      try {
        const result = decodeFunctionResult({
          abi: abi as Abi,
          functionName,
          data: data as `0x${string}`,
        });

        return jsonResponse({
          functionName,
          decodedResult: result,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
