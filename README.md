# viemcp

A Model Context Protocol (MCP) server that provides blockchain interaction capabilities through [viem](https://viem.sh), enabling AI assistants to read onchain data, interact with smart contracts, and prepare transactions across multiple EVM chains.

## Features

- **Multi-chain Support**: Access any EVM-compatible blockchain supported by viem
- **Read Operations**: Query balances, blocks, transactions, and smart contract state
- **Token Standards**: Full support for ERC20, ERC721, and ERC1155 tokens
- **ENS Resolution**: Resolve ENS names and reverse lookups
- **Transaction Preparation**: Create unsigned transactions for user signing
- **Type Safety**: Full TypeScript support with viem's type inference
- **Security-First**: No private key handling, only read operations and transaction preparation

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

Create a `.env` file in the project root:

```env
# RPC endpoints (optional - defaults to public endpoints)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY

# Default chain ID (optional - defaults to 1 for Ethereum mainnet)
DEFAULT_CHAIN_ID=1

# Enable debug logging (optional)
DEBUG=true
```

### MCP Client Configuration

Add to your MCP client settings (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "viemcp": {
      "command": "node",
      "args": ["/path/to/viemcp/build/index.js"],
      "env": {
        "ETH_RPC_URL": "your_rpc_url_here"
      }
    }
  }
}
```

## Available Tools

### Core Blockchain Tools

- `getBalance` - Get native token balance for an address
- `getBlock` - Get block information by number or tag
- `getTransaction` - Get transaction details by hash
- `getTransactionReceipt` - Get transaction receipt with logs
- `getGasPrice` - Get current gas price
- `estimateGas` - Estimate gas for a transaction
- `getChainId` - Get the chain ID
- `getBlockNumber` - Get the latest block number

### Smart Contract Tools

- `readContract` - Read data from a smart contract
- `simulateContract` - Simulate a contract call
- `estimateContractGas` - Estimate gas for a contract call
- `multicall` - Batch multiple contract calls
- `getCode` - Get contract bytecode
- `getStorageAt` - Read raw storage slot

### Token Tools

#### ERC20
- `getERC20Balance` - Get token balance
- `getERC20Metadata` - Get token name, symbol, decimals
- `getERC20Allowance` - Check spending allowance

#### ERC721 (NFTs)
- `getERC721Owner` - Get NFT owner
- `getERC721Balance` - Get NFT balance for address
- `getERC721TokenURI` - Get NFT metadata URI

#### ERC1155
- `getERC1155Balance` - Get token balance
- `getERC1155URI` - Get metadata URI

### ENS Tools

- `resolveEnsAddress` - Resolve ENS name to address
- `resolveEnsName` - Reverse lookup address to ENS
- `resolveEnsAvatar` - Get ENS avatar
- `resolveEnsText` - Get ENS text records

### Transaction Tools

- `prepareTransaction` - Create unsigned transaction
- `prepareContractWrite` - Prepare contract interaction
- `encodeFunctionData` - Encode function call data
- `encodeDeployData` - Encode contract deployment

### Utility Tools

- `parseEther` - Convert ETH to wei
- `formatEther` - Convert wei to ETH
- `parseUnits` - Parse token amounts
- `formatUnits` - Format token amounts
- `isAddress` - Validate Ethereum address
- `getAddress` - Checksum an address
- `keccak256` - Hash data

## Available Resources

Resources provide read-only access to blockchain data via URIs:

### Chain Resources
- `viem://chain/{chainId}` - Chain configuration
- `viem://chain/{chainId}/block/latest` - Latest block
- `viem://chain/{chainId}/block/{number}` - Specific block
- `viem://chain/{chainId}/gasPrice` - Current gas price

### Address Resources
- `viem://chain/{chainId}/address/{address}` - Address info & balance
- `viem://chain/{chainId}/address/{address}/nonce` - Transaction count
- `viem://chain/{chainId}/address/{address}/code` - Contract bytecode

### Transaction Resources
- `viem://chain/{chainId}/tx/{hash}` - Transaction details
- `viem://chain/{chainId}/tx/{hash}/receipt` - Transaction receipt

### Token Resources
- `viem://chain/{chainId}/erc20/{token}` - ERC20 metadata
- `viem://chain/{chainId}/erc20/{token}/balance/{address}` - ERC20 balance
- `viem://chain/{chainId}/erc721/{token}/{tokenId}` - NFT metadata
- `viem://chain/{chainId}/erc721/{token}/{tokenId}/owner` - NFT owner

### ENS Resources
- `viem://ens/{name}` - Resolve ENS name
- `viem://ens/{name}/avatar` - ENS avatar
- `viem://ens/reverse/{address}` - Reverse ENS lookup

## Usage Examples

### Get ETH Balance
```javascript
// Using tool
await callTool("getBalance", {
  address: "vitalik.eth",
  chainId: 1
});

// Using resource
await getResource("viem://chain/1/address/vitalik.eth");
```

### Read Smart Contract
```javascript
await callTool("readContract", {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  abi: [...], // ERC20 ABI
  functionName: "balanceOf",
  args: ["0x..."],
  chainId: 1
});
```

### Prepare Transaction
```javascript
await callTool("prepareTransaction", {
  to: "0x...",
  value: "1000000000000000000", // 1 ETH in wei
  chainId: 1
});
```

## Supported Chains

Viemcp supports all chains available in viem including:
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- BSC
- And 100+ more EVM chains

## Security Considerations

- **No Private Keys**: This server never handles private keys
- **Read-Only**: Focuses on reading blockchain state
- **Transaction Preparation**: Only prepares unsigned transactions
- **Input Validation**: All inputs are validated before processing
- **Rate Limiting**: Implements request throttling (configurable)

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format
```

## Architecture

```
viemcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── tools/                # Tool implementations
│   ├── resources/            # Resource handlers
│   ├── clients/              # Viem client management
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
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