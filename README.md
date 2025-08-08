# viemcp

A Model Context Protocol (MCP) server that provides blockchain interaction capabilities through [viem](https://viem.sh), enabling AI assistants to read onchain data, interact with smart contracts, and prepare transactions across multiple EVM chains.

## Features

- **Multi-chain Support**: Access EVM chains via viem; minimal defaults with dynamic chain resolution
- **Read Operations**: Query balances, blocks, transactions, logs, storage, and smart contract state
- **Token Standards**: ERC20 read operations (balance, metadata, allowance)
- **ENS**: Resolve ENS names, reverse lookups, and fetch resolvers
- **Tx Prep & Encoding**: Prepare transaction requests; encode function and deploy data
- **Docs Resources**: Live, queryable resources for viem documentation from GitHub
- **Type Safety**: TypeScript throughout with viem's type inference
  - Centralized types in `src/core/types.ts` for tool outputs and parameters
- **Security-First**: Read-only; prepares unsigned transactions only (no key management)

## Installation

```bash
# Install dependencies
bun install

# Build the server
bun run build

# Start the server
bun run start
```

## Configuration

### Environment Variables

Create a `.env` file in the project root. RPC URLs can be provided per-chain and per-provider. By default, provider is `drpc`.

```env
# RPC provider selector (optional; default: drpc)
RPC_PROVIDER=drpc

# RPC endpoints (examples; either generic or provider-specific)
# Generic naming (preferred):
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/KEY
MAINNET_RPC_URL=https://eth.llamarpc.com

# Provider-specific naming (takes precedence if RPC_PROVIDER matches):
ETHEREUM_RPC_URL_DRPC=https://lb.drpc.org/ogrpc?network=ethereum&dkey=KEY
MAINNET_RPC_URL_DRPC=https://lb.drpc.org/ogrpc?network=ethereum&dkey=KEY

# Dynamic docs branch for resources (optional; default: main)
VIEM_DOCS_BRANCH=main

# Enable/disable dynamic chain resolution from viem (optional; default: enabled)
VIEM_ENABLE_DYNAMIC_CHAIN_RESOLUTION=true

# Register custom chains (optional). JSON array of viem Chain objects
VIEM_CUSTOM_CHAINS=[
  { "id": 8453, "name": "Base", "nativeCurrency": {"name":"Ether","symbol":"ETH","decimals":18}, "rpcUrls": {"default": {"http": ["https://mainnet.base.org"]}} }
]
```

### MCP Client Configuration

Add to your MCP client settings (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "viemcp": {
      "command": "node",
      "args": ["/absolute/path/to/viemcp/build/index.js"],
      "env": {
        "ETHEREUM_RPC_URL": "https://eth.llamarpc.com"
      }
    }
  }
}
```

## Available Tools

All tool IDs are viem-prefixed. The server now prioritizes consolidated tools to reduce surface area. Below is the current set with argument shapes.

### Consolidated Tools

- viemBlockInfo — Block header plus optional tx count/full txs
  - args: { numberOrTag?: string, includeTxCount?: boolean, includeFullTransactions?: boolean, chain?: string }
- viemTransactionInfo — Transaction plus optional receipt/logs
  - args: { hash: string, includeReceipt?: boolean, includeLogs?: boolean, chain?: string }
- viemAccountInfo — Account balance and optional nonce
  - args: { address: string, blockTag?: string, historicalBalanceAt?: string, includeNonce?: boolean, chain?: string }
- viemGasInfo — Gas price and/or fee history
  - args: { includePrice?: boolean, history?: { blockCount?: string, newestBlock?: string, rewardPercentiles?: number[] }, chain?: string }
- viemEnsInfo — Resolve ENS data for name/address (address, name, resolver, avatar, text records)
  - args: { lookupType: "name" | "address", value: string, includeAddress?: boolean, includeName?: boolean, includeResolver?: boolean, includeAvatar?: boolean, textKeys?: string[], chain?: string }
- viemErc20Info — Combined ERC20 metadata/balance/allowance
  - args: { token: string, owner?: string, spender?: string, includeMetadata?: boolean, includeBalance?: boolean, includeAllowance?: boolean, chain?: string }
- viemContractState — Get contract code and/or storage slots
  - args: { address: string, slots?: string[], blockTag?: string, includeCode?: boolean, includeStorage?: boolean, chain?: string }
- viemEncodeData — Encode function/deploy data
  - args: { mode: "function" | "deploy", abi: unknown[], functionName?: string, args?: unknown[], bytecode?: string, constructorArgs?: unknown[] }
- viemContractAction — Read/simulate/estimateGas for a function
  - args: { action: "read" | "simulate" | "estimateGas", address: string, abi: unknown[], functionName: string, args?: unknown[], account?: string, value?: string, blockTag?: string, chain?: string }
- viemTransactionBuild — Estimate gas or prepare tx
  - args: { mode: "estimateGas" | "prepare", from?: string, to?: string, data?: string, value?: string, gas?: string, maxFeePerGas?: string, maxPriorityFeePerGas?: string, gasPrice?: string, nonce?: string, chain?: string }
- viemChainInfo — Chain id and optionally supported chains/RPC URL
  - args: { includeSupported?: boolean, includeRpcUrl?: boolean, chain?: string }

### Public primitives

- viemGetLogs — Filter logs by address/topics and range
  - args: { address?: string, topics?: unknown[], fromBlock?: string, toBlock?: string, chain?: string }
- viemMulticall — Batch multiple contract reads
  - args: { contracts: { address: string, abi: unknown[], functionName: string, args?: unknown[] }[], allowFailure?: boolean, chain?: string }

### Utilities

- viemParseEther — Convert ETH to wei
  - args: { value: string }
- viemFormatEther — Convert wei to ETH
  - args: { value: string }
- viemIsAddress — Validate Ethereum address
  - args: { address: string }
- viemKeccak256 — Hash data with Keccak256
  - args: { data: string }

## Available Resources

In addition to tools, this server exposes live documentation resources for viem. These are fetched directly from GitHub and exposed under the `viem://docs/*` URI scheme.

### Docs Resources
- `viem://docs/github-index` — Lists all available viem docs pages (from the configured branch)
- `viem://docs/github/{path}.mdx` — Raw content of a specific viem docs page

Note: Chain/address/tx resources are not currently implemented. Use tools for onchain data.

## Available Prompts

Prompts are higher-level assistants bundled with the server:

- `generate_viem_code`
  - **Args**: `feature` (string), `hints` (optional string)
  - **Behavior**: Instructs the model to consult viem docs resources and output a plan, code, setup notes, and citations
  - **Attached resource**: `viem://docs/github-index`
- `analyze_transaction`
  - **Args**: `txHash` (string), `chain` (optional; defaults to `ethereum`)
  - **Behavior**: Requests a human-style analysis of a transaction
- `analyze_address`
  - **Args**: `address` (string), `chain` (optional; defaults to `ethereum`)
  - **Behavior**: Requests a human-style analysis of an address
- `search_viem_docs`
  - **Args**: `query` (string)
  - **Behavior**: Searches the registered viem docs resources and summarizes findings
  - **Attached resource**: `viem://docs/github-index`

## Usage Examples

### Get ETH Balance
```javascript
// Resolve ENS via consolidated tool then fetch balance
const { address } = await callTool("viemEnsInfo", { lookupType: "name", value: "vitalik.eth", includeAddress: true, includeAvatar: true, textKeys: ["com.twitter"] })
  .then(r => JSON.parse(r.content[0].text));
await callTool("viemAccountInfo", { address, chain: "ethereum" });
```

### Read Smart Contract
```javascript
await callTool("viemContractAction", {
  action: "read",
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  abi: [...], // ERC20 ABI
  functionName: "balanceOf",
  args: ["0x..."],
  chain: "ethereum"
});
```

### Prepare Transaction Request
```javascript
await callTool("viemTransactionBuild", {
  mode: "prepare",
  to: "0x...",
  value: "1000000000000000000", // 1 ETH in wei
  chain: "ethereum"
});
```

### Docs Resources Index
```javascript
await getResource("viem://docs/github-index");
```

## Supported Chains

The server ships with a minimal default set (Ethereum mainnet aliases: `mainnet`, `ethereum`, `eth`) to keep footprint small. It can:

- Load custom RPC URLs from environment (see Configuration)
- Dynamically resolve chains by ID from `viem` if `VIEM_ENABLE_DYNAMIC_CHAIN_RESOLUTION` is not set to `false`
- Register additional custom chains via `VIEM_CUSTOM_CHAINS`

List what is currently available at runtime with:

```javascript
await callTool("viemChainInfo", { includeSupported: true });
```

## Security Considerations

- **No Private Keys**: This server never handles private keys
- **Read-Only**: Focuses on reading blockchain state
- **Transaction Preparation**: Only prepares unsigned transactions
- **Input Validation**: All inputs are validated before processing

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Type-check
bun run typecheck

# Lint code
bun run lint

# Format code
bun run format
```

## Architecture

```
viemcp/
├── src/
│   ├── index.ts              # Entry point & tool registrations
│   └── core/
│       ├── chains.ts         # Chain registry & RPC resolution
│       ├── clientManager.ts  # Viem client lifecycle & cache
│       ├── prompts.ts        # Prompt registrations
│       ├── resources/
│       │   └── docs.ts       # GitHub-backed viem docs resources
│       ├── responses.ts      # Response helpers
│       ├── types.ts          # Shared output/param types (GasInfoOutput, EnsInfoOutput, LogParameters, etc.)
│       └── tools/
│           ├── public.ts     # Logs/fees/tx count utilities
│           └── ens.ts        # ENS resolver utility
├── build/                    # Compiled output
└── tests/                    # Test files
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Type Safety Notes

- All `as never` assertions were removed in favor of specific viem types (e.g., `BlockTag`, `Abi`, typed params for contract actions).
- Generic `Record<string, unknown>` outputs were replaced with named interfaces:
  - `GasInfoOutput`, `EnsInfoOutput`, `Erc20InfoOutput`, `ContractStateOutput`, `ChainInfoOutput`.
- `viemGetLogs` parameters are typed via `LogParameters` with `fromBlock/toBlock` as `bigint | BlockTag`.
- Prompts use explicit zod parsing of raw args to avoid unsafe casts while satisfying MCP SDK constraints.

## License

MIT

## Acknowledgements

- [viem](https://viem.sh) - TypeScript Interface for Ethereum
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification by Anthropic