I scanned our MCP session capabilities and enumerated the viemcp tools available. Listing them with brief descriptions.

### viemcp tools available
- **`mcp_viemcp_getBlockNumber`**: Get current block number
- **`mcp_viemcp_getChainId`**: Get chain ID
- **`mcp_viemcp_listSupportedChains`**: List supported chains
- **`mcp_viemcp_getGasPrice`**: Get current gas price
- **`mcp_viemcp_getFeeHistory`**: Get EIP-1559 fee history
- **`mcp_viemcp_getBlock`**: Get block by number or tag
- **`mcp_viemcp_getBlockTransactionCount`**: Get number of transactions in a block
- **`mcp_viemcp_getTransaction`**: Get transaction details
- **`mcp_viemcp_getTransactionReceipt`**: Get transaction receipt by hash
- **`mcp_viemcp_getTransactionCount`**: Get nonce (transaction count) for an address
- **`mcp_viemcp_getLogs`**: Get logs by address/topics and block range
- **`mcp_viemcp_getCode`**: Get contract bytecode at an address
- **`mcp_viemcp_getStorageAt`**: Read raw storage slot at an address
- **`mcp_viemcp_readContract`**: Read from smart contract
- **`mcp_viemcp_simulateContract`**: Simulate a contract call (no state change)
- **`mcp_viemcp_estimateContractGas`**: Estimate gas for a contract call
- **`mcp_viemcp_estimateGas`**: Estimate gas for a transaction request
- **`mcp_viemcp_prepareTransactionRequest`**: Prepare a transaction request (no signing)
- **`mcp_viemcp_encodeFunctionData`**: Encode function call data for a contract
- **`mcp_viemcp_encodeDeployData`**: Encode deployment data for a contract
- **`mcp_viemcp_multicall`**: Batch multiple contract reads (no state change)
- **`mcp_viemcp_getBalance`**: Get native token balance for an address
- **`mcp_viemcp_getERC20Metadata`**: Get ERC20 token metadata (name, symbol, decimals)
- **`mcp_viemcp_getERC20Balance`**: Get ERC20 token balance
- **`mcp_viemcp_getERC20Allowance`**: Get ERC20 allowance
- **`mcp_viemcp_isAddress`**: Validate Ethereum address
- **`mcp_viemcp_parseEther`**: Convert ETH to wei
- **`mcp_viemcp_formatEther`**: Convert wei to ETH
- **`mcp_viemcp_keccak256`**: Hash data with Keccak256
- **`mcp_viemcp_resolveEnsAddress`**: Resolve ENS name to address
- **`mcp_viemcp_getEnsResolver`**: Get ENS resolver for a name
- **`mcp_viemcp_getEnsName`**: Reverse resolve an address to ENS name

- Listed 32 viemcp tools with 1-line descriptions.

### Proposed tool consolidations (for review; not implemented yet)

- **viemBlockInfo**
  - Replaces: `getBlockNumber`, `getBlock`, `getBlockTransactionCount`
  - Inputs: `numberOrTag?` (default `latest`), `chain?`
  - Flags: `includeTxCount?`, `includeFullTransactions?`
  - Output: block header; plus `transactionCount` and/or `transactions[]` when requested

- **viemTransactionInfo**
  - Replaces: `getTransaction`, `getTransactionReceipt`
  - Inputs: `hash`, `chain?`
  - Flags: `includeReceipt?`, `includeLogs?`
  - Output: `{ transaction, receipt?, logs? }`

- **viemAccountInfo**
  - Replaces: `getBalance`, `getTransactionCount`
  - Inputs: `address`, `blockTag?`, `chain?`
  - Flags: `includeNonce?`, `historicalBalanceAt?` (tag or block number)
  - Output: `{ balance, nonce? }`

- **viemGasInfo**
  - Replaces: `getGasPrice`, `getFeeHistory`
  - Inputs: `chain?`
  - Flags: `includePrice?` (default true), `history?` object `{ blockCount, newestBlock, rewardPercentiles? }`
  - Output: `{ price?, feeHistory? }`

- **viemEnsInfo**
  - Replaces: `resolveEnsAddress`, `getEnsResolver`, `getEnsName`
  - Inputs: `lookupType` (`name` | `address`), `value`, `chain?`
  - Flags: `includeAddress?`, `includeName?`, `includeResolver?`, `includeAvatar?`, `textKeys?` (string[])
  - Output: Combined ENS view based on flags

- **viemErc20Info**
  - Replaces: `getERC20Metadata`, `getERC20Balance`, `getERC20Allowance`
  - Inputs: `token`, `owner?`, `spender?`, `chain?`
  - Flags: `includeMetadata?` (default true), `includeBalance?`, `includeAllowance?`
  - Output: `{ metadata?, balance?, allowance? }`

- **viemContractState**
  - Replaces: `getCode`, `getStorageAt`
  - Inputs: `address`, `slots?` (string[]), `blockTag?`, `chain?`
  - Flags: `includeCode?` (default true), `includeStorage?`
  - Output: `{ code?, storage?: Record<string, string> }`

- **viemEncodeData**
  - Replaces: `encodeFunctionData`, `encodeDeployData`
  - Inputs: `mode` (`function` | `deploy`), `abi`, `functionName?`, `args?`, `bytecode?`, `constructorArgs?`
  - Output: `{ data }`

- **viemContractAction**
  - Replaces: `readContract`, `simulateContract`, `estimateContractGas`
  - Inputs: `action` (`read` | `simulate` | `estimateGas`), `address`, `abi`, `functionName`, `args?`, `account?`, `value?`, `blockTag?`, `chain?`
  - Flags: `returnDecoded?`, `decodeLogs?`
  - Output: Read result, simulation result, or gas estimate

- **viemTransactionBuild**
  - Replaces: `estimateGas`, `prepareTransactionRequest`
  - Inputs: `{ from?, to?, data?, value?, gas?, maxFeePerGas?, maxPriorityFeePerGas? }`, `chain?`
  - Flags: `action` (`estimateGas` | `prepare`), `includeNonce?`, `includeChainId?`
  - Output: `{ gas? }` or a prepared transaction request

- **viemChainInfo**
  - Replaces: `getChainId`, `listSupportedChains`
  - Inputs: `chain?`
  - Flags: `includeSupported?`, `includeRpcUrl?`
  - Output: `{ chainId?, supportedChains?[], rpcUrl? }`

-  - `viemGetLogs` (flexible filter surface best left explicit)
-  - `viemMulticall` (batching primitive)

Rationale
- Reduce 32 tools to roughly 12–14 higher-level tools with optional flags while preserving clarity.
- Maintain backwards compatibility with thin aliases for a deprecation window.
- Flags only add fields; defaults mirror current single-purpose tools.

Multicall notes
- viemMulticall is read-only via eth_call simulations; it does not send a transaction and does not require a private key.
- Input is an array of { address, abi, functionName, args? }, optional `allowFailure`, optional block tag/number; output contains per-call results/status.