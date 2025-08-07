# viem and MCP Integration

## Executive Summary

viem represents a paradigm shift in Ethereum development as a TypeScript-first interface that solves the "quadrilemma" of developer experience, stability, bundle size, and performance. When integrated with Model Context Protocol (MCP) servers—Anthropic's open standard for AI-tool interaction—it creates powerful opportunities for building next-generation Web3 applications. 

## Understanding viem: A Technical Deep Dive

### Core Architecture and Philosophy

viem is built on four foundational principles that make it uniquely suited for modern blockchain development. First, its **TypeScript-first approach** provides native TypeScript v5.0.4+ support with deep type inference from ABIs and EIP-712 typed data. Second, its **modular and composable** design enables tree-shakable modules that minimize bundle size to just 35kB (compared to 130kB+ for ethers.js). Third, it offers **stateless primitives** as low-level building blocks maintaining flexibility with sensible defaults. Finally, its **documentation-driven development** ensures predictable, stable APIs with 99.8% test coverage.

The architecture centers around three core concepts: **Clients** (interfaces to different backend services), **Transports** (communication layers for executing requests), and **Actions** (composable functions for blockchain interactions). This separation of concerns enables developers to build precisely what they need without unnecessary overhead.

### Distinctive Features and Capabilities

viem's Public Client provides interfaces to "public" JSON-RPC API methods with automatic request batching, multicall support for performance optimization, and configurable caching. The Wallet Client handles account management and transaction signing with seamless integration to browser wallets via EIP-1193 providers. The Test Client offers comprehensive development environment interactions including block mining simulation, account impersonation, and time travel capabilities.

What sets viem apart is its **superior type safety** with compile-time ABI type inference, preventing runtime errors common in blockchain applications. Its **performance optimizations** include native BigInt support, optimized encoding/parsing algorithms, and smart caching strategies. The library also provides **extensive utilities** for ABI encoding/decoding, data conversion, cryptographic functions, and advanced operations like packed encoding and transaction serialization.

### Advanced Capabilities for Innovation

viem excels in **multi-chain support** with pre-configured settings for 100+ EVM-compatible chains and easy custom chain addition. Its **account abstraction readiness** includes built-in support for ERC-4337 and EIP-7702, preparing applications for the smart account future. The **transport system** offers flexible options including HTTP, WebSocket, IPC, and fallback transports with automatic health monitoring and latency-based routing.

## Model Context Protocol (MCP): Enabling AI-Blockchain Integration

### What is MCP?

The Model Context Protocol serves as a "USB-C for AI applications"—a universal standard that enables AI assistants to interact with external tools and data sources through a standardized interface. Developed by Anthropic, MCP replaces fragmented M×N integrations with a single M+N protocol, providing context awareness, modularity, security, and composability.

### Architecture and Implementation

MCP's architecture consists of four core components: the **MCP Host** (user-facing application), **MCP Client** (manages connections with servers), **MCP Server** (exposes specific capabilities), and the **Transport Layer** (communication mechanism). Built on JSON-RPC 2.0, it supports three main capability types: Tools (model-controlled functions), Resources (application-controlled static data), and Prompts (user-controlled templates).

Implementation leverages official SDKs in TypeScript, Python, Java, C#, and Kotlin. The TypeScript SDK (`@modelcontextprotocol/sdk`) provides the most mature implementation with a clean server structure:

```typescript
const server = new McpServer({
  name: 'viemcp-server',
  version: '1.0.0',
  description: 'Blockchain operations via viem'
})

server.tool('eth_getBalance', schema, async ({ address, chain }) => {
  const client = getPublicClient(chain)
  const balance = await client.getBalance({ address })
  return { content: [{ type: 'text', text: formatEther(balance) }] }
})
```

### Security and Best Practices

MCP's security model is evolving from local stdio connections to OAuth 2.1 for remote servers. For blockchain applications, **critical security principles** include never storing private keys in MCP servers, preparing unsigned transactions for user signing, and supporting hardware wallet workflows. The pattern involves MCP servers preparing transaction data while actual signing remains under user control.

## Viemcp Specific MCP Tools & Resources

### Core Blockchain Tools (using viem APIs)

| Tool Name | Description | Viem Method | Key Parameters |
|-----------|-------------|-------------|----------------|
| `getBalance` | Get native token balance | `client.getBalance()` | `address`, `chainId`, `blockNumber?` |
| `getBlock` | Get block information | `client.getBlock()` | `chainId`, `blockNumber?`, `blockTag?` |
| `getTransaction` | Get transaction details | `client.getTransaction()` | `chainId`, `hash` |
| `getTransactionReceipt` | Get transaction receipt | `client.getTransactionReceipt()` | `chainId`, `hash` |
| `getTransactionCount` | Get nonce for address | `client.getTransactionCount()` | `address`, `chainId`, `blockTag?` |
| `getGasPrice` | Get current gas price | `client.getGasPrice()` | `chainId` |
| `estimateGas` | Estimate gas for transaction | `client.estimateGas()` | `chainId`, `transaction` |
| `getChainId` | Get chain ID | `client.getChainId()` | `chainId` |
| `getBlockNumber` | Get latest block number | `client.getBlockNumber()` | `chainId` |

### Smart Contract Interaction Tools

| Tool Name | Description | Viem Method | Key Parameters |
|-----------|-------------|-------------|----------------|
| `readContract` | Read contract state | `client.readContract()` | `address`, `abi`, `functionName`, `args?`, `chainId` |
| `simulateContract` | Simulate contract call | `client.simulateContract()` | `address`, `abi`, `functionName`, `args?`, `chainId` |
| `estimateContractGas` | Estimate gas for contract call | `client.estimateContractGas()` | `address`, `abi`, `functionName`, `args?`, `chainId` |
| `prepareTransactionRequest` | Prepare unsigned transaction | `prepareTransactionRequest()` | `to`, `value?`, `data?`, `chainId` |
| `multicall` | Batch multiple contract calls | `client.multicall()` | `contracts[]`, `chainId` |
| `getCode` | Get contract bytecode | `client.getCode()` | `address`, `chainId`, `blockNumber?` |
| `getStorageAt` | Read storage slot | `client.getStorageAt()` | `address`, `slot`, `chainId`, `blockNumber?` |

### Token Standards (ERC20, ERC721, ERC1155)

| Tool Name | Description | Viem Actions | Key Parameters |
|-----------|-------------|--------------|----------------|
| `getERC20Balance` | Get ERC20 balance | `readContract` with balanceOf | `tokenAddress`, `ownerAddress`, `chainId` |
| `getERC20Metadata` | Get token name, symbol, decimals | `readContract` with metadata calls | `tokenAddress`, `chainId` |
| `getERC20Allowance` | Check spending allowance | `readContract` with allowance | `tokenAddress`, `owner`, `spender`, `chainId` |
| `getERC721Owner` | Get NFT owner | `readContract` with ownerOf | `tokenAddress`, `tokenId`, `chainId` |
| `getERC721Balance` | Get NFT balance | `readContract` with balanceOf | `tokenAddress`, `ownerAddress`, `chainId` |
| `getERC721TokenURI` | Get NFT metadata URI | `readContract` with tokenURI | `tokenAddress`, `tokenId`, `chainId` |
| `getERC1155Balance` | Get ERC1155 balance | `readContract` with balanceOf | `tokenAddress`, `tokenId`, `ownerAddress`, `chainId` |
| `getERC1155URI` | Get ERC1155 metadata URI | `readContract` with uri | `tokenAddress`, `tokenId`, `chainId` |

### ENS Tools

| Tool Name | Description | Viem Method | Key Parameters |
|-----------|-------------|-------------|----------------|
| `resolveEnsAddress` | ENS name to address | `normalize()` + `getEnsAddress()` | `name`, `chainId` |
| `resolveEnsName` | Address to ENS name | `getEnsName()` | `address`, `chainId` |
| `resolveEnsAvatar` | Get ENS avatar | `getEnsAvatar()` | `name`, `chainId` |
| `resolveEnsText` | Get ENS text record | `getEnsText()` | `name`, `key`, `chainId` |

### Event & Log Tools

| Tool Name | Description | Viem Method | Key Parameters |
|-----------|-------------|-------------|----------------|
| `getLogs` | Query event logs | `client.getLogs()` | `address?`, `event?`, `fromBlock?`, `toBlock?`, `chainId` |
| `watchContractEvent` | Subscribe to events | `client.watchContractEvent()` | `address`, `abi`, `eventName`, `chainId` |
| `decodeEventLog` | Decode raw log data | `decodeEventLog()` | `abi`, `data`, `topics` |

### Transaction Preparation Tools (Security-First)

| Tool Name | Description | Viem Method | Key Parameters |
|-----------|-------------|-------------|----------------|
| `prepareTransaction` | Create unsigned transaction | `prepareTransactionRequest()` | `to`, `value?`, `data?`, `gas?`, `chainId` |
| `prepareContractWrite` | Prepare contract interaction | `simulateContract()` + prepare | `address`, `abi`, `functionName`, `args`, `chainId` |
| `encodeDeployData` | Encode deployment data | `encodeDeployData()` | `abi`, `bytecode`, `args?` |
| `encodeFunctionData` | Encode function call data | `encodeFunctionData()` | `abi`, `functionName`, `args` |

### Utility Tools

| Tool Name | Description | Viem Utilities | Key Parameters |
|-----------|-------------|---------------|----------------|
| `parseEther` | Convert ETH to wei | `parseEther()` | `value` |
| `formatEther` | Convert wei to ETH | `formatEther()` | `value` |
| `parseUnits` | Parse token amount | `parseUnits()` | `value`, `decimals` |
| `formatUnits` | Format token amount | `formatUnits()` | `value`, `decimals` |
| `isAddress` | Validate address | `isAddress()` | `address` |
| `getAddress` | Checksum address | `getAddress()` | `address` |
| `keccak256` | Hash data | `keccak256()` | `data` |

## MCP Resources (viem-based URIs)

The server exposes blockchain data through MCP resource URIs. All addresses support ENS resolution via viem's built-in ENS capabilities.

### Chain Resources

| Resource URI Pattern | Description | Viem Data Source |
|-----------|-------------|------------------|
| `viem://chain/{chainId}` | Chain configuration and metadata | `chain` object from viem/chains |
| `viem://chain/{chainId}/block/latest` | Latest block data | `getBlock()` |
| `viem://chain/{chainId}/block/{blockNumber}` | Specific block data | `getBlock({ blockNumber })` |
| `viem://chain/{chainId}/gasPrice` | Current gas price | `getGasPrice()` |
| `viem://chain/{chainId}/blockNumber` | Latest block number | `getBlockNumber()` |

### Address Resources

| Resource URI Pattern | Description | Viem Data Source |
|-----------|-------------|------------------|
| `viem://chain/{chainId}/address/{address}` | Address info & balance | `getBalance()` |
| `viem://chain/{chainId}/address/{address}/nonce` | Transaction count | `getTransactionCount()` |
| `viem://chain/{chainId}/address/{address}/code` | Contract bytecode | `getCode()` |
| `viem://chain/{chainId}/address/{address}/storage/{slot}` | Storage slot value | `getStorageAt()` |

### Transaction Resources

| Resource URI Pattern | Description | Viem Data Source |
|-----------|-------------|------------------|
| `viem://chain/{chainId}/tx/{hash}` | Transaction details | `getTransaction()` |
| `viem://chain/{chainId}/tx/{hash}/receipt` | Transaction receipt | `getTransactionReceipt()` |
| `viem://chain/{chainId}/tx/{hash}/confirmations` | Confirmation count | Calculated from receipt |

### Token Resources

| Resource URI Pattern | Description | Viem Data Source |
|-----------|-------------|------------------|
| `viem://chain/{chainId}/erc20/{token}` | ERC20 metadata | `readContract()` for name, symbol, decimals |
| `viem://chain/{chainId}/erc20/{token}/balance/{address}` | ERC20 balance | `readContract()` with balanceOf |
| `viem://chain/{chainId}/erc721/{token}/{tokenId}` | NFT metadata | `readContract()` with tokenURI |
| `viem://chain/{chainId}/erc721/{token}/{tokenId}/owner` | NFT owner | `readContract()` with ownerOf |
| `viem://chain/{chainId}/erc1155/{token}/{tokenId}` | ERC1155 metadata | `readContract()` with uri |

### ENS Resources

| Resource URI Pattern | Description | Viem Data Source |
|-----------|-------------|------------------|
| `viem://ens/{name}` | ENS name resolution | `getEnsAddress()` |
| `viem://ens/{name}/avatar` | ENS avatar | `getEnsAvatar()` |
| `viem://ens/{name}/text/{key}` | ENS text record | `getEnsText()` |
| `viem://ens/reverse/{address}` | Reverse ENS lookup | `getEnsName()` |

## Project Requirements & Architecture

### Core Requirements

1. **Multi-chain Support**: Support all chains available in viem/chains
2. **Type Safety**: Full TypeScript with strict typing
3. **Security-First**: No private key handling, only unsigned transaction preparation
4. **Performance**: Client pooling, caching, batch operations
5. **Error Handling**: Comprehensive error handling with meaningful messages
6. **Extensibility**: Modular design for easy addition of new tools

### Architecture Overview

```
viemcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # Core MCP server setup
│   ├── tools/                # Tool implementations
│   │   ├── blockchain.ts     # Core blockchain tools
│   │   ├── contracts.ts      # Contract interaction tools
│   │   ├── tokens.ts         # Token standard tools
│   │   ├── ens.ts           # ENS resolution tools
│   │   ├── transactions.ts   # Transaction preparation
│   │   └── utilities.ts      # Utility functions
│   ├── resources/            # Resource implementations
│   │   └── index.ts         # Resource handlers
│   ├── clients/              # Viem client management
│   │   ├── manager.ts       # Client pool manager
│   │   └── chains.ts        # Chain configurations
│   ├── types/               # TypeScript types
│   │   └── index.ts        # Shared type definitions
│   └── utils/               # Utility functions
│       ├── validation.ts    # Input validation
│       ├── formatting.ts    # Data formatting
│       └── errors.ts        # Error handling
├── build/                   # Compiled output
├── .env.example            # Environment variables example
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md              # Documentation
```

### Implementation Phases

1. **Phase 1: Foundation** (Current)
   - Basic MCP server setup
   - Core blockchain reading tools
   - Client management

2. **Phase 2: Contract & Token Support**
   - Smart contract interaction tools
   - ERC20/721/1155 support
   - ENS resolution

3. **Phase 3: Advanced Features**
   - Transaction preparation
   - Event/log queries
   - Batch operations

4. **Phase 4: Optimization**
   - Caching layer
   - Performance monitoring
   - Enhanced error handling

