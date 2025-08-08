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

Below is the complete list of tools currently implemented.

### Core Blockchain Tools

- `getBalance` — Get native token balance for an address
- `getBlock` — Get block by number (decimal or 0x-hex) or tag (`latest`, `earliest`, `pending`)
- `getBlockNumber` — Get the latest block number
- `getTransaction` — Get transaction details by hash
- `getTransactionReceipt` — Get transaction receipt by hash
- `getGasPrice` — Get current gas price (wei and gwei)
- `estimateGas` — Estimate gas for a transaction request
- `getChainId` — Get the chain ID for the client
- `listSupportedChains` — List currently supported chain aliases and metadata
- `getTransactionCount` — Get account nonce (transaction count)
- `getBlockTransactionCount` — Number of transactions in a given block
- `getLogs` — Filter logs by address/topics and block range
- `getFeeHistory` — EIP-1559 fee history for recent blocks

### Smart Contract Tools

- `readContract` — Read a contract function
- `simulateContract` — Simulate a call (no state change)
- `estimateContractGas` — Estimate gas for a contract call
- `multicall` — Batch multiple read calls
- `getCode` — Get contract bytecode at an address
- `getStorageAt` — Read raw storage slot at an address

### Token Tools

#### ERC20

- `getERC20Balance` — Get token balance for `ownerAddress`
- `getERC20Metadata` — Get token name, symbol, and decimals
- `getERC20Allowance` — Get allowance granted by `owner` to `spender`

Note: ERC721/1155 tools are not currently implemented.

### ENS Tools

- `resolveEnsAddress` — Resolve ENS name to address, with options to include avatar and selected text records
- `getEnsName` — Reverse lookup an address to ENS name
- `getEnsResolver` — Get ENS resolver for a name

### Transaction Tools

- `prepareTransactionRequest` — Prepare an unsigned transaction request (no signing)
- `encodeFunctionData` — Encode function call data for a contract
- `encodeDeployData` — Encode deployment data for a contract

### Utility Tools

- `parseEther` — Convert ETH to wei
- `formatEther` — Convert wei to ETH
- `isAddress` — Validate Ethereum address format
- `keccak256` — Hash data using Keccak-256

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
// Resolve ENS then fetch balance
const { address } = await callTool("resolveEnsAddress", { name: "vitalik.eth" })
  .then(r => JSON.parse(r.content[0].text));
await callTool("getBalance", { address, chain: "ethereum" });
```

### Read Smart Contract
```javascript
await callTool("readContract", {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  abi: [...], // ERC20 ABI
  functionName: "balanceOf",
  args: ["0x..."],
  chain: "ethereum"
});
```

### Prepare Transaction Request
```javascript
await callTool("prepareTransactionRequest", {
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
await callTool("listSupportedChains", {});
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
│       └── tools/
│           ├── public.ts     # Logs/fees/tx count utilities
│           └── ens.ts        # ENS resolver utility
├── build/                    # Compiled output
└── tests/                    # Test files
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgements

- [viem](https://viem.sh) - TypeScript Interface for Ethereum
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification by Anthropic