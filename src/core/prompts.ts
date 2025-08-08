/* @ts-nocheck */
/* eslint-disable */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register prompts with the MCP server (EVM-focused)
 */
export function registerEVMPrompts(server: McpServer) {
  // Generate viem code from docs
  {
    server.registerPrompt(
      "generate_viem_code",
      {
        title: "Generate viem code",
        description:
          "Consult viem GitHub docs resources to produce code and integration steps",
        argsSchema: { feature: z.string(), hints: z.string().optional() } as any,
      },
      ((args: any, _extra: unknown) => {
        const { feature, hints } = z
          .object({ feature: z.string(), hints: z.string().optional() })
          .parse(args);
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text:
                  `You are assisting in writing TypeScript code using viem.\n` +
                  `Consult the attached Viem docs index to locate relevant pages, and cite specific viem://docs/github/... resources.\n` +
                  `Use ONLY these local (cached) viem:// resources as the source of truth — do not use external web search.\n\n` +
                  `Goal: ${feature}\n` +
                  (hints ? `Hints: ${hints}\n` : "") +
                  `Deliver:\n` +
                  `1) Brief plan\n2) Code snippets with imports\n3) Notes on chain/client setup and error handling\n4) Links to the specific viem://docs/github/... resources used.`,
              },
            },
            {
              role: "user",
              content: { type: "resource", resource: { uri: "viem://docs/github-index" } },
            },
          ],
        };
      }) as any
    );
  }

  // Analyze transaction
  {
    server.registerPrompt(
      "analyze_transaction",
      {
        title: "Analyze transaction",
        description: "Analyze a transaction on a chain",
        argsSchema: { txHash: z.string(), chain: z.string().optional() } as any,
      },
      ((args: any, _extra: unknown) => {
        const { txHash, chain = "ethereum" } = z
          .object({ txHash: z.string(), chain: z.string().optional() })
          .parse(args);
        return {
          messages: [
            {
              role: "user",
              content: { type: "text", text: `Please analyze transaction ${txHash} on ${chain}. Include purpose, parties, value, gas, and any noteworthy effects.` },
            },
          ],
        };
      }) as any
    );
  }

  // Analyze address
  {
    server.registerPrompt(
      "analyze_address",
      {
        title: "Analyze address",
        description: "Analyze an address on a chain",
        argsSchema: { address: z.string(), chain: z.string().optional() } as any,
      },
      ((args: any, _extra: unknown) => {
        const { address, chain = "ethereum" } = z
          .object({ address: z.string(), chain: z.string().optional() })
          .parse(args);
        return {
          messages: [
            {
              role: "user",
              content: { type: "text", text: `Please analyze the address ${address} on ${chain}. Include balance, nonce, recent activity, and potential contract status.` },
            },
          ],
        };
      }) as any
    );
  }

  // Search viem docs
  {
    server.registerPrompt(
      "search_viem_docs",
      {
        title: "Search viem docs",
        description: "Search the viem docs resources for a topic",
        argsSchema: { query: z.string() } as any,
      },
      ((args: any, _extra: unknown) => {
        const { query } = z.object({ query: z.string() }).parse(args);
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text:
                  `Search the Viem docs resources for: "${query}". Use the attached index to locate relevant pages, then gather and cite specific viem://docs/github/... pages.\n` +
                  `Use ONLY local (cached) viem:// resources — avoid external web search.\n` +
                  `Provide a concise summary and a short how-to snippet if applicable.`,
              },
            },
            { role: "user", content: { type: "resource", resource: { uri: "viem://docs/github-index" } } },
          ],
        };
      }) as any
    );
  }
}
