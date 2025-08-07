import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address } from "viem";
import { normalize } from "viem/ens";
import { ClientManager } from "../clients/manager.js";
import { AddressSchema } from "../utils/validation.js";
import { handleToolError } from "../utils/errors.js";
import { jsonResponse, textResponse } from "../utils/formatting.js";

export function registerEnsTools(server: McpServer, clientManager: ClientManager) {
  // Resolve ENS Name to Address
  server.tool(
    "resolveEnsAddress",
    "Resolve ENS name to Ethereum address",
    {
      name: z.string().describe("ENS name to resolve (e.g., vitalik.eth)"),
    },
    async ({ name }) => {
      try {
        // ENS only works on mainnet
        const client = clientManager.getClient("ethereum");
        const normalizedName = normalize(name);

        const address = await client.getEnsAddress({
          name: normalizedName,
        });

        if (!address) {
          return textResponse(`ENS name "${name}" does not resolve to an address`);
        }

        return textResponse(`${name} resolves to: ${address}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Reverse Resolve Address to ENS Name
  server.tool(
    "resolveEnsName",
    "Reverse resolve Ethereum address to ENS name",
    {
      address: AddressSchema.describe("Ethereum address to reverse resolve"),
    },
    async ({ address }) => {
      try {
        // ENS only works on mainnet
        const client = clientManager.getClient("ethereum");

        const ensName = await client.getEnsName({
          address: address as Address,
        });

        if (!ensName) {
          return textResponse(`Address ${address} does not have an ENS name`);
        }

        return textResponse(`${address} resolves to: ${ensName}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get ENS Avatar
  server.tool(
    "resolveEnsAvatar",
    "Get ENS avatar for a name",
    {
      name: z.string().describe("ENS name (e.g., vitalik.eth)"),
    },
    async ({ name }) => {
      try {
        // ENS only works on mainnet
        const client = clientManager.getClient("ethereum");
        const normalizedName = normalize(name);

        const avatar = await client.getEnsAvatar({
          name: normalizedName,
        });

        if (!avatar) {
          return textResponse(`No avatar set for ${name}`);
        }

        return jsonResponse({
          name,
          avatar,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get ENS Text Record
  server.tool(
    "resolveEnsText",
    "Get ENS text record for a name",
    {
      name: z.string().describe("ENS name (e.g., vitalik.eth)"),
      key: z.string().describe("Text record key (e.g., 'email', 'url', 'twitter', 'github')"),
    },
    async ({ name, key }) => {
      try {
        // ENS only works on mainnet
        const client = clientManager.getClient("ethereum");
        const normalizedName = normalize(name);

        const text = await client.getEnsText({
          name: normalizedName,
          key,
        });

        if (!text) {
          return textResponse(`No "${key}" text record for ${name}`);
        }

        return jsonResponse({
          name,
          key,
          value: text,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get ENS Resolver
  server.tool(
    "getEnsResolver",
    "Get the resolver address for an ENS name",
    {
      name: z.string().describe("ENS name (e.g., vitalik.eth)"),
    },
    async ({ name }) => {
      try {
        // ENS only works on mainnet
        const client = clientManager.getClient("ethereum");
        const normalizedName = normalize(name);

        const resolver = await client.getEnsResolver({
          name: normalizedName,
        });

        if (!resolver) {
          return textResponse(`No resolver found for ${name}`);
        }

        return jsonResponse({
          name,
          resolver,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
