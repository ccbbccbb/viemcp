import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register prompts with the MCP server (EVM-focused)
 */
export function registerEVMPrompts(server: McpServer) {
  // Generate viem code from docs
  server.registerPrompt(
    "generate_viem_code",
    {
      title: "Generate viem code",
      description: "Consult viem GitHub docs resources to produce code and integration steps",
      // Cast due to SDK types expecting ZodType union
      argsSchema: {
        feature: z.string().describe("What you want to build with viem"),
        hints: z.string().optional().describe("Optional constraints or libraries to consider"),
      } as unknown as never,
    },
    (({ feature, hints }: { feature: string; hints?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text" as const,
            text:
              `You are assisting in writing TypeScript code using viem.\n` +
              `Consult the following resources to cite correct APIs and patterns:\n` +
              `- viem://docs/github-index (then pick relevant viem://docs/github/... resources)\n\n` +
              `Goal: ${feature}\n` +
              (hints ? `Hints: ${hints}\n` : "") +
              `Deliver:\n` +
              `1) Brief plan\n2) Code snippets with imports\n3) Notes on chain/client setup and error handling\n4) Links to the specific viem://docs/github/... resources used.`,
          },
        },
      ],
    })) as unknown as never
  );

  // Analyze transaction
  server.registerPrompt(
    "analyze_transaction",
    {
      title: "Analyze transaction",
      description: "Analyze a transaction on a chain",
      argsSchema: {
        txHash: z.string().describe("Transaction hash to analyze"),
        chain: z.string().optional().describe("Network name (defaults to ethereum)"),
      } as unknown as never,
    },
    (({ txHash, chain = "ethereum" }: { txHash: string; chain?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text" as const,
            text: `Please analyze transaction ${txHash} on ${chain}. Include purpose, parties, value, gas, and any noteworthy effects.`,
          },
        },
      ],
    })) as unknown as never
  );

  // Analyze address
  server.registerPrompt(
    "analyze_address",
    {
      title: "Analyze address",
      description: "Analyze an address on a chain",
      argsSchema: {
        address: z.string().describe("Address to analyze"),
        chain: z.string().optional().describe("Network name (defaults to ethereum)"),
      } as unknown as never,
    },
    (({ address, chain = "ethereum" }: { address: string; chain?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text" as const,
            text: `Please analyze the address ${address} on ${chain}. Include balance, nonce, recent activity, and potential contract status.`,
          },
        },
      ],
    })) as unknown as never
  );

  // Search viem docs
  server.registerPrompt(
    "search_viem_docs",
    {
      title: "Search viem docs",
      description: "Search the viem docs resources for a topic",
      argsSchema: {
        query: z.string().describe("Search query or topic"),
      } as unknown as never,
    },
    (({ query }: { query: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text" as const,
            text:
              `Search the viem docs resources for: "${query}".\n` +
              `Start at viem://docs/github-index, then gather and cite specific viem://docs/github/... pages. Provide a concise summary and a short how-to snippet if applicable.`,
          },
        },
      ],
    })) as unknown as never
  );
}
