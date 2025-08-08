<div align="center">

  <img src="site/public/viemcp-logo-white.png" alt="viemcp" />

  <p>
    A Model Context Protocol (MCP) server that provides blockchain interaction capabilities through
    <a href="https://viem.sh">viem</a> and <a href="https://wagmi.sh">wagmi</a>, enabling AI assistants to help with
    integration of both frameworks as well as read onchain data &amp; view smart contract state.
  </p>

</div>

## Features

- **Multi-chain Support**: Access EVM chains via viem; minimal defaults with dynamic chain resolution
- **Read Operations**: Query balances, blocks, transactions, logs, storage, and smart contract state
- **Token Standards**: ERC20 read operations (balance, metadata, allowance)
- **ENS**: Resolve ENS names, reverse lookups, and fetch resolvers
- **Tx Prep & Encoding**: Prepare transaction requests; encode function and deploy data
- **Embedded Patterns**: Instant access to viem/wagmi code patterns (offline, zero-latency)
- **Wagmi Support**: React hooks patterns and code generation for Web3 UIs
- **Docs Resources**: Live viem docs from GitHub + embedded pattern library
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

## Deployment

See `DEPLOYMENT.md` for publishing to npm and deploying the `site/` app to Vercel, including required secrets and example GitHub Actions workflows. Example environment variables are in `env.example`.

## Configuration

### Environment Variables

Create a `.env` file in the project root. RPC URLs can be provided per-chain and per-provider. **As of v0.0.5, the server includes default public RPC URLs for common chains as fallbacks.**

```env
# RPC provider selector (optional; default: drpc)
RPC_PROVIDER=drpc

# RPC endpoints (optional - defaults available for major chains)
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

### Default Chain Support (v0.0.5+)

The server includes default public RPC URLs for these chains (no configuration needed):
- Ethereum/Mainnet (`mainnet`, `ethereum`, `eth`)
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- BSC (Binance Smart Chain)
- Gnosis
- Fantom
- Celo
- Moonbeam
- Aurora

Custom RPC URLs in environment variables always take precedence over defaults.

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

The server provides 17 tools, all with the `viem` prefix. Tools have been consolidated to reduce complexity while maintaining comprehensive blockchain interaction capabilities.

### Consolidated Tools (12 tools)

- viemBlockInfo — Block header plus optional tx count/full txs
    ```ts
    args: { numberOrTag?: string, includeTxCount?: boolean, includeFullTransactions?: boolean, chain?: string }
    ```
- viemTransactionInfo — Transaction plus optional receipt/logs
    ```ts
    args: { hash: string, includeReceipt?: boolean, includeLogs?: boolean, chain?: string }
    ```
- viemAccountInfo — Account balance and optional nonce
    ```ts
    args: { address: string, blockTag?: string, historicalBalanceAt?: string, includeNonce?: boolean, chain?: string }
    ```
- viemGasInfo — Gas price and/or fee history
    ```ts
    args: { includePrice?: boolean, history?: { blockCount?: string, newestBlock?: string, rewardPercentiles?: number[] }, chain?: string }
    ```
- viemEnsInfo — Resolve ENS data for name/address (address, name, resolver, avatar, text records)
    ```ts
    args: { lookupType: "name" | "address", value: string, includeAddress?: boolean, includeName?: boolean, includeResolver?: boolean, includeAvatar?: boolean, textKeys?: string[], chain?: string }
    ```
- viemErc20Info — Combined ERC20 metadata/balance/allowance
    ```ts
    args: { token: string, owner?: string, spender?: string, includeMetadata?: boolean, includeBalance?: boolean, includeAllowance?: boolean, chain?: string }
    ```
- viemContractState — Get contract code and/or storage slots
    ```ts
    args: { address: string, slots?: string[], blockTag?: string, includeCode?: boolean, includeStorage?: boolean, chain?: string }
    ```
- viemEncodeData — Encode function/deploy data
    ```ts
    args: { mode: "function" | "deploy", abi: unknown[], functionName?: string, args?: unknown[], bytecode?: string, constructorArgs?: unknown[] }
    ```
- viemContractAction — Read/simulate/estimateGas for a function
    ```ts
    args: { action: "read" | "simulate" | "estimateGas", address: string, abi: unknown[], functionName: string, args?: unknown[], account?: string, value?: string, blockTag?: string, chain?: string }
    ```
- viemTransactionBuild — Estimate gas or prepare tx
    ```ts
    args: { mode: "estimateGas" | "prepare", from?: string, to?: string, data?: string, value?: string, gas?: string, maxFeePerGas?: string, maxPriorityFeePerGas?: string, gasPrice?: string, nonce?: string, chain?: string }
    ```
- viemChainInfo — Chain id and optionally supported chains/RPC URL
    ```ts
    args: { includeSupported?: boolean, includeRpcUrl?: boolean, chain?: string }
    ```
- viemGetLogs — Filter logs by address/topics and range
    ```ts
    args: { address?: string, topics?: unknown[], fromBlock?: string, toBlock?: string, chain?: string }
    ```

### Utility Tools (5 tools)

- viemParseEther — Convert ETH to wei
    ```ts
    args: { value: string }
    ```
- viemFormatEther — Convert wei to ETH
    ```ts
    args: { value: string }
    ```
- viemMulticall — Batch multiple contract reads
    ```ts
    args: { contracts: { address: string, abi: unknown[], functionName: string, args?: unknown[] }[], allowFailure?: boolean, chain?: string }
    ```
- viemIsAddress — Validate Ethereum address
    ```ts
    args: { address: string }
    ```
- viemKeccak256 — Hash data with Keccak256
    ```ts
    args: { data: string }
    ```

## Available Resources

In addition to tools, this server exposes live documentation resources for viem. These are fetched directly from GitHub and exposed under the `viem://docs/*` URI scheme.

### Documentation Resources

#### Viem Documentation (GitHub-based)
- `viem://docs/github-index` — Lists all available viem docs pages
- `viem://docs/github/{path}.mdx` — Raw content of a specific viem docs page

#### Embedded Pattern Library (Offline, Zero-latency)
- `viem://patterns` — Common viem code patterns
- `wagmi://patterns` — Wagmi React hooks patterns  
- `web3://common-patterns` — Common Web3 development patterns
- `patterns://search?q=QUERY` — Search all patterns
- `wagmi://docs/getting-started` — Wagmi documentation links

## Available Prompts

Prompts are higher-level assistants bundled with the server:

### Code Generation
- `generate_viem_code`
  - **Args**: `feature` (string), `hints` (optional string)
  - **Behavior**: Generates viem code consulting docs resources
  - **Attached resource**: `viem://docs/github-index`

- `generate_wagmi_code` *(New in v0.0.5)*
  - **Args**: `feature` (string), `hints` (optional string)  
  - **Behavior**: Generates React components with wagmi hooks
  - **Uses**: Embedded wagmi patterns for instant reference

- `viem_wagmi_pattern` *(New in v0.0.5)*
  - **Args**: `pattern` (string), `category` (optional: 'viem'|'wagmi'|'common')
  - **Behavior**: Retrieves specific pattern with explanation
  - **Uses**: Embedded pattern library

### Analysis
- `analyze_transaction`
  - **Args**: `txHash` (string), `chain` (optional; defaults to `ethereum`)
  - **Behavior**: Human-style transaction analysis

- `analyze_address`
  - **Args**: `address` (string), `chain` (optional; defaults to `ethereum`)
  - **Behavior**: Human-style address analysis

- `search_viem_docs`
  - **Args**: `query` (string)
  - **Behavior**: Searches viem docs and summarizes findings
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