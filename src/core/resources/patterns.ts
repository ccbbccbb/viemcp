import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  COMMON_PATTERNS,
  searchPatterns,
  VIEM_PATTERNS,
  WAGMI_PATTERNS,
} from '../knowledge/patterns.js'

export function setupPatternResources(server: McpServer) {
  // Register viem patterns as a resource
  server.registerResource(
    'viem-patterns',
    'viem://patterns',
    {
      title: 'Viem Code Patterns',
      description:
        'Common viem patterns and best practices (embedded, offline)',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const patterns = Object.entries(VIEM_PATTERNS)
        .map(
          ([name, code]) =>
            `## ${name}\n\`\`\`typescript\n${code.trim()}\n\`\`\``,
        )
        .join('\n\n')

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# Viem Patterns\n\nCommon patterns for using viem in your applications.\n\n${patterns}`,
          },
        ],
      }
    },
  )

  // Register wagmi patterns as a resource
  server.registerResource(
    'wagmi-patterns',
    'wagmi://patterns',
    {
      title: 'Wagmi React Patterns',
      description: 'Common wagmi React hooks patterns (embedded, offline)',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const patterns = Object.entries(WAGMI_PATTERNS)
        .map(
          ([name, code]) =>
            `## ${name}\n\`\`\`typescript\n${code.trim()}\n\`\`\``,
        )
        .join('\n\n')

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# Wagmi Patterns\n\nCommon patterns for using wagmi React hooks.\n\n${patterns}`,
          },
        ],
      }
    },
  )

  // Register common patterns as a resource
  server.registerResource(
    'web3-common-patterns',
    'web3://common-patterns',
    {
      title: 'Common Web3 Patterns',
      description: 'Common patterns for Web3 development (embedded, offline)',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const patterns = Object.entries(COMMON_PATTERNS)
        .map(
          ([name, code]) =>
            `## ${name}\n\`\`\`typescript\n${code.trim()}\n\`\`\``,
        )
        .join('\n\n')

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# Common Web3 Patterns\n\nCommon patterns and solutions for Web3 development.\n\n${patterns}`,
          },
        ],
      }
    },
  )

  // Register pattern search as a resource
  server.registerResource(
    'pattern-search',
    'patterns://search',
    {
      title: 'Search Code Patterns',
      description: 'Search all embedded patterns',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      // Parse query from URI
      const url = new URL(uri.href)
      const query = url.searchParams.get('q') || ''

      if (!query) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/markdown',
              text: '# Pattern Search\n\nUse `patterns://search?q=YOUR_QUERY` to search patterns.',
            },
          ],
        }
      }

      const results = searchPatterns(query)
      const text =
        results.length > 0
          ? `# Search Results for "${query}"\n\n${results
              .map(
                (r) =>
                  `## ${r.category}/${r.pattern}\n\`\`\`typescript\n${r.code.trim()}\n\`\`\``,
              )
              .join('\n\n')}`
          : `# No results found for "${query}"`

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text,
          },
        ],
      }
    },
  )

  // Register Wagmi documentation link
  server.registerResource(
    'wagmi-docs-link',
    'wagmi://docs/getting-started',
    {
      title: 'Wagmi Documentation',
      description: 'Link to official Wagmi documentation',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# Wagmi Documentation

## Official Documentation
The official Wagmi documentation is available at: https://wagmi.sh/react/getting-started

## Quick Links
- [Getting Started](https://wagmi.sh/react/getting-started)
- [Configuration](https://wagmi.sh/react/config)
- [Hooks Reference](https://wagmi.sh/react/hooks/useAccount)
- [TypeScript](https://wagmi.sh/react/typescript)
- [Examples](https://wagmi.sh/examples/connect-wallet)

## Key Concepts
- **Hooks-based**: Wagmi provides React hooks for all Web3 interactions
- **TypeScript-first**: Full TypeScript support with inferred types
- **Chain-agnostic**: Works with any EVM-compatible chain
- **Provider-agnostic**: Works with MetaMask, WalletConnect, Coinbase Wallet, etc.

## Common Patterns
Use the \`wagmi://patterns\` resource to see common implementation patterns.`,
          },
        ],
      }
    },
  )
}
