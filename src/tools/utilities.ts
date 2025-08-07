import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  isAddress,
  getAddress,
  keccak256,
  toHex,
  fromHex,
  encodePacked,
  pad,
  slice,
} from "viem";
import { handleToolError } from "../utils/errors.js";
import { jsonResponse, textResponse } from "../utils/formatting.js";

export function registerUtilityTools(server: McpServer) {
  // Parse Ether
  server.tool(
    "parseEther",
    "Convert ETH amount to wei",
    {
      value: z.string().describe("Amount in ETH (e.g., '1.5')"),
    },
    async ({ value }) => {
      try {
        const wei = parseEther(value);
        return textResponse(`${value} ETH = ${wei.toString()} wei`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Format Ether
  server.tool(
    "formatEther",
    "Convert wei to ETH",
    {
      value: z.string().describe("Amount in wei"),
    },
    async ({ value }) => {
      try {
        const eth = formatEther(BigInt(value));
        return textResponse(`${value} wei = ${eth} ETH`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Parse Units
  server.tool(
    "parseUnits",
    "Parse token amount with custom decimals",
    {
      value: z.string().describe("Amount to parse"),
      decimals: z.number().describe("Number of decimals"),
    },
    async ({ value, decimals }) => {
      try {
        const parsed = parseUnits(value, decimals);
        return textResponse(
          `${value} (${decimals} decimals) = ${parsed.toString()} units`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Format Units
  server.tool(
    "formatUnits",
    "Format token amount with custom decimals",
    {
      value: z.string().describe("Amount in smallest unit"),
      decimals: z.number().describe("Number of decimals"),
    },
    async ({ value, decimals }) => {
      try {
        const formatted = formatUnits(BigInt(value), decimals);
        return textResponse(
          `${value} units = ${formatted} (${decimals} decimals)`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Validate Address
  server.tool(
    "isAddress",
    "Check if a string is a valid Ethereum address",
    {
      address: z.string().describe("Address to validate"),
    },
    async ({ address }) => {
      try {
        const valid = isAddress(address);
        return textResponse(
          valid 
            ? `✓ ${address} is a valid Ethereum address`
            : `✗ ${address} is NOT a valid Ethereum address`
        );
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Checksum Address
  server.tool(
    "getAddress",
    "Get checksummed version of an address",
    {
      address: z.string().describe("Address to checksum"),
    },
    async ({ address }) => {
      try {
        const checksummed = getAddress(address);
        return jsonResponse({
          input: address,
          checksummed,
          isValid: isAddress(address),
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Keccak256 Hash
  server.tool(
    "keccak256",
    "Calculate Keccak256 hash of data",
    {
      data: z.string().describe("Data to hash (hex string or UTF-8 text)"),
      encoding: z.enum(["hex", "utf8"]).optional().default("hex")
        .describe("Input encoding"),
    },
    async ({ data, encoding }) => {
      try {
        const input = encoding === "utf8" 
          ? toHex(data)
          : data as `0x${string}`;
        
        const hash = keccak256(input);
        return jsonResponse({
          input: data,
          encoding,
          hash,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // To Hex
  server.tool(
    "toHex",
    "Convert various types to hex string",
    {
      value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
      ]).describe("Value to convert"),
      type: z.enum(["string", "number", "bigint", "boolean"]).optional()
        .describe("Type of the value"),
    },
    async ({ value, type }) => {
      try {
        let hex: string;
        
        if (type === "number" || typeof value === "number") {
          hex = toHex(value as number);
        } else if (type === "bigint") {
          hex = toHex(BigInt(value as string));
        } else if (type === "boolean" || typeof value === "boolean") {
          hex = toHex(value as boolean);
        } else {
          hex = toHex(value as string);
        }
        
        return textResponse(`Hex: ${hex}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // From Hex
  server.tool(
    "fromHex",
    "Convert hex string to various types",
    {
      hex: z.string().describe("Hex string to convert"),
      to: z.enum(["string", "number", "bigint", "boolean"])
        .describe("Target type"),
    },
    async ({ hex, to }) => {
      try {
        const result = fromHex(hex as `0x${string}`, to as any);
        return jsonResponse({
          hex,
          type: to,
          result: to === "bigint" ? result.toString() : result,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Encode Packed
  server.tool(
    "encodePacked",
    "ABI encode packed data",
    {
      types: z.array(z.string()).describe("Array of Solidity types"),
      values: z.array(z.any()).describe("Array of values to encode"),
    },
    async ({ types, values }) => {
      try {
        const encoded = encodePacked(types as any, values as any);
        return jsonResponse({
          types,
          values,
          encoded,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Pad Hex
  server.tool(
    "padHex",
    "Pad a hex string to a specific length",
    {
      hex: z.string().describe("Hex string to pad"),
      size: z.number().describe("Target size in bytes"),
      direction: z.enum(["left", "right"]).optional().default("left")
        .describe("Padding direction"),
    },
    async ({ hex, size, direction }) => {
      try {
        const padded = pad(hex as `0x${string}`, { 
          size: size as any,
          dir: direction,
        });
        return jsonResponse({
          input: hex,
          padded,
          size,
          direction,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Slice Hex
  server.tool(
    "sliceHex",
    "Extract a portion of a hex string",
    {
      hex: z.string().describe("Hex string to slice"),
      start: z.number().optional().describe("Start index"),
      end: z.number().optional().describe("End index"),
    },
    async ({ hex, start, end }) => {
      try {
        const sliced = slice(hex as `0x${string}`, start, end);
        return jsonResponse({
          input: hex,
          sliced,
          start,
          end,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}