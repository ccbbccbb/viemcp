# PRIORITY REVISIONS (Based on August 2025 Audit)

## 🚨 CRITICAL - Type Safety Issues
**Priority**: Must fix before production

### 1. Replace `as never` Assertions (22+ instances)
- **src/core/tools/consolidated.ts** (11 occurrences):
  - Lines: 58, 68, 147, 153, 201, 202, 395, 408, 505, 508, 512, 516, 596, 600
  - Replace with proper viem parameter types
- **src/core/prompts.ts** (8 occurrences):
  - Lines: 18, 44, 56, 70, 82, 96, 107, 129
  - Define proper resource object types
- **src/index.ts:248** + **src/core/tools/public.ts** (3 occurrences):
  - Replace with specific contract/parameter interfaces

### 2. Replace Generic `Record<string, unknown>` Types
- **src/core/tools/consolidated.ts**:
  - Lines: 193, 250, 309, 391, 492, 563 (tool output objects)
  - Create specific interfaces: `BlockInfoOutput`, `TransactionInfoOutput`, etc.
- **src/core/chains.ts**:
  - Lines: 58, 79 (chain validation)
  - Use viem's Chain type properly
- **src/core/tools/public.ts:25**:
  - Define `LogParameters` interface

## 🔧 HIGH PRIORITY - Code Quality

### 3. Error Handling Improvements
- Add error codes for programmatic handling
- Include parameter context in validation failures
- Structured error responses with actionable guidance

### 4. Resource Management
- Implement disposal pattern for client connections
- Add graceful shutdown handling
- Consider LRU cache for client manager

## 📋 MEDIUM PRIORITY - Features

### 5. Enhanced Validation
- Unify consolidated tool input validation under Zod schemas
- Add parameter context to error messages
- Implement request validation middleware

### 6. Testing Expansion
- Add tests for consolidated tool surfaces
- Test parity between single-purpose and consolidated tools
- Integration tests for MCP protocol compliance

### 7. Performance Optimizations
- Implement request deduplication
- Add caching for immutable data (contract metadata)
- Consider connection pooling

## 📝 LOW PRIORITY - Documentation & UX

### 8. Tool Deprecation Strategy
- Add deprecation notes for single-purpose tools
- Optional aliases that forward to consolidated tools
- Log usage statistics for migration planning

### 9. Enhanced Documentation
- Add JSDoc comments for public APIs
- Architecture documentation
- Usage examples for each consolidated tool

---

## Implementation Notes

### Type Safety Strategy
1. **Create Interface Definitions**:
   ```typescript
   interface BlockInfoOutput {
     number: bigint;
     hash: Hash;
     transactionCount?: number;
     transactions?: Transaction[];
   }
   ```

2. **Replace Assertions**:
   ```typescript
   // Instead of: blockTag: input as never
   // Use: blockTag: input as BlockTag | bigint
   ```

3. **Viem Integration**:
   - Import proper types from viem
   - Use viem's type utilities where available
   - Leverage viem's built-in validation

### Previous Achievements ✅
- Comprehensive test suite implemented (Vitest)
- Zod validation standardization complete
- Tool consolidation deployed successfully  
- Version synchronization fixed (0.0.4)

---

# Implementation Status (Private-Key-Less Tools)

## Implemented (with tool IDs)

- Account
  - getBalance — viemGetBalance
  - getTransactionCount — viemGetTransactionCount
- Block
  - getBlock — viemGetBlock
  - getBlockNumber — viemGetBlockNumber
  - getBlockTransactionCount — viemGetBlockTransactionCount
- Chain
  - getChainId — viemGetChainId
- Fee
  - estimateGas — viemEstimateGas
  - getFeeHistory — viemGetFeeHistory
  - getGasPrice — viemGetGasPrice
- Filters & Logs
  - getLogs — viemGetLogs
- Transaction
  - prepareTransactionRequest — viemPrepareTransactionRequest
  - getTransaction — viemGetTransaction
  - getTransactionReceipt — viemGetTransactionReceipt
- Contract Actions
  - estimateContractGas — viemEstimateContractGas
  - getCode — viemGetCode
  - getStorageAt — viemGetStorageAt
  - multicall — viemMulticall
  - readContract — viemReadContract
  - simulateContract — viemSimulateContract
- Contract Utilities
  - encodeDeployData — viemEncodeDeployData
  - encodeFunctionData — viemEncodeFunctionData
- ENS Actions
  - getEnsName — viemGetEnsName
  - getEnsResolver — viemGetEnsResolver
  - getEnsAddress — covered by viemResolveEnsAddress
  - getEnsAvatar — covered by viemResolveEnsAddress (includeAvatar)
  - getEnsText — covered by viemResolveEnsAddress (textKeys)
- Address Utilities
  - isAddress — viemIsAddress
- Unit Utilities
  - formatEther — viemFormatEther
  - parseEther — viemParseEther

## Remaining (to implement)

- Access List: createAccessList
- Block: simulateBlocks, watchBlockNumber, watchBlocks
- Calls: call, simulateCalls
- EIP-712: getEip712Domain
- Fee: estimateFeesPerGas, estimateMaxPriorityFeePerGas, getBlobBaseFee
- Filters & Logs: createBlockFilter, createEventFilter, createPendingTransactionFilter, getFilterChanges, getFilterLogs, watchEvent, uninstallFilter
- Proof: getProof
- Signature: verifyMessage, verifyTypedData
- Transaction: getTransactionConfirmations, waitForTransactionReceipt, watchPendingTransactions
- Contract Actions: createContractEventFilter, getContractEvents, watchContractEvent
- Contract Utilities: decodeDeployData, decodeErrorResult, decodeEventLog, decodeFunctionData, decodeFunctionResult, encodeErrorResult, encodeEventTopics, encodeFunctionResult, parseEventLogs
- ENS Utilities: labelhash, namehash, normalize
- SIWE Actions: verifySiweMessage
- SIWE Utilities: createSiweMessage, generateSiweNonce, parseSiweMessage, validateSiweMessage
- ABI Actions: decodeAbiParameters, encodeAbiParameters, encodePacked, getAbiItem, parseAbi, parseAbiItem, parseAbiParameter, parseAbiParameters
- EIP-7702 Actions: prepareAuthorization
- EIP-7702 Utilities: hashAuthorization, recoverAuthorizationAddress, verifyAuthorization
- Address Utilities: getAddress, getContractAddress, isAddressEqual
- Blob Utilities: blobsToProofs, blobsToCommitments, commitmentsToVersionedHashes, commitmentToVersionedHash, fromBlobs, sidecarsToVersionedHashes, toBlobs, toBlobSidecars
- Chain Utilities: extractChain
- Data Utilities: concat, isBytes, isHex, pad, slice, size, trim
- Encoding Utilities: fromBytes, fromHex, fromRlp, toBytes, toHex, toRlp
- Hash Utilities: isHash, ripemd160, sha256, toEventHash, toEventSelector, toEventSignature, toFunctionHash, toFunctionSelector, toFunctionSignature
- KZG Utilities: setupKzg
- Signature Utilities: compactSignatureToSignature, hashMessage, hashTypedData, isErc6492Signature, parseCompactSignature, parseErc6492Signature, parseSignature, recoverAddress, recoverMessageAddress, recoverPublicKey, recoverTransactionAddress, recoverTypedDataAddress, serializeCompactSignature, serializeErc6492Signature, serializeSignature, signatureToCompactSignature, verifyMessage, verifyTypedData
- Transaction Utilities: parseTransaction, serializeTransaction
- Unit Utilities: formatGwei, formatUnits, parseGwei, parseUnits
- Test Actions (Environment Manipulation): getAutomine, increaseTime, mine, removeBlockTimestampInterval, setAutomine, setIntervalMining, setBlockTimestampInterval, setBlockGasLimit, setNextBlockBaseFeePerGas, setNextBlockTimestamp, setCoinbase, setMinGasPrice, reset, setLoggingEnabled, setRpcUrl, dumpState, loadState, revert, snapshot

---

I scanned our MCP session capabilities and updated the viemcp tool inventory to reflect the current, shipped set. This replaces the older mcp_viemcp_* naming and adds the consolidated tool suite.

### Current tools (single‑purpose)
- `viemGetBalance`: Get native token balance for an address
- `viemGetBlockNumber`: Get current block number
- `viemGetTransaction`: Get transaction details
- `viemReadContract`: Read from smart contract
- `viemGetERC20Balance`: Get ERC20 token balance
- `viemResolveEnsAddress`: Resolve ENS name to address. Optionally include avatar and specific text records.
- `viemParseEther`: Convert ETH to wei
- `viemFormatEther`: Convert wei to ETH
- `viemIsAddress`: Validate Ethereum address
- `viemKeccak256`: Hash data with Keccak256
- `viemListSupportedChains`: List supported chains
- `viemGetBlock`: Get block by number or tag
- `viemGetTransactionReceipt`: Get transaction receipt by hash
- `viemGetGasPrice`: Get current gas price
- `viemEstimateGas`: Estimate gas for a transaction request
- `viemGetChainId`: Get chain ID
- `viemSimulateContract`: Simulate a contract call (no state change)
- `viemEstimateContractGas`: Estimate gas for a contract call
- `viemMulticall`: Batch multiple contract reads (no state change)
- `viemGetCode`: Get contract bytecode at an address
- `viemGetStorageAt`: Read raw storage slot at an address
- `viemGetERC20Metadata`: Get ERC20 token metadata (name, symbol, decimals)
- `viemGetERC20Allowance`: Get ERC20 allowance (spender allowance granted by owner)
- `viemGetEnsName`: Reverse resolve an address to ENS name
- `viemPrepareTransactionRequest`: Prepare a transaction request (no signing)
- `viemEncodeFunctionData`: Encode function call data for a contract
- `viemEncodeDeployData`: Encode deployment data for a contract
- `viemGetTransactionCount`: Get the nonce (transaction count) for an address
- `viemGetBlockTransactionCount`: Get number of transactions in a block
- `viemGetLogs`: Get logs by address/topics and block range
- `viemGetFeeHistory`: Get EIP-1559 fee history
- `viemGetEnsResolver`: Get ENS resolver for a name

### Consolidated tool suite (implemented)
- **`viemBlockInfo`**
  - Replaces: `viemGetBlockNumber`, `viemGetBlock`, `viemGetBlockTransactionCount`
  - Inputs: `numberOrTag?` (default `latest`), `chain?`
  - Flags: `includeTxCount?`, `includeFullTransactions?`
  - Output: block header; plus `transactionCount` and/or `transactions[]` when requested

- **`viemTransactionInfo`**
  - Replaces: `viemGetTransaction`, `viemGetTransactionReceipt`
  - Inputs: `hash`, `chain?`
  - Flags: `includeReceipt?`, `includeLogs?`
  - Output: `{ transaction, receipt?, logs? }`

- **`viemAccountInfo`**
  - Replaces: `viemGetBalance`, `viemGetTransactionCount`
  - Inputs: `address`, `blockTag?`, `chain?`
  - Flags: `includeNonce?`, `historicalBalanceAt?` (tag or block number)
  - Output: `{ address, balance (raw + formatted), nonce? }`

- **`viemGasInfo`**
  - Replaces: `viemGetGasPrice`, `viemGetFeeHistory`
  - Inputs: `chain?`
  - Flags: `includePrice?` (default true), `history?` object `{ blockCount, newestBlock, rewardPercentiles? }`
  - Output: `{ price?, feeHistory? }`

- **`viemEnsInfo`**
  - Replaces: `viemResolveEnsAddress`, `viemGetEnsResolver`, `viemGetEnsName`
  - Inputs: `lookupType` (`name` | `address`), `value`, `chain?`
  - Flags: `includeAddress?`, `includeName?`, `includeResolver?`, `includeAvatar?`, `textKeys?` (string[])
  - Output: Combined ENS view based on flags

- **`viemErc20Info`**
  - Replaces: `viemGetERC20Metadata`, `viemGetERC20Balance`, `viemGetERC20Allowance`
  - Inputs: `token`, `owner?`, `spender?`, `chain?`
  - Flags: `includeMetadata?` (default true), `includeBalance?`, `includeAllowance?`
  - Output: `{ metadata?, balance?, allowance? }`

- **`viemContractState`**
  - Replaces: `viemGetCode`, `viemGetStorageAt`
  - Inputs: `address`, `slots?` (string[]), `blockTag?`, `chain?`
  - Flags: `includeCode?` (default true), `includeStorage?`
  - Output: `{ code?, storage?: Record<string, string> }`

- **`viemEncodeData`**
  - Replaces: `viemEncodeFunctionData`, `viemEncodeDeployData`
  - Inputs: `mode` (`function` | `deploy`), `abi`, `functionName?`, `args?`, `bytecode?`, `constructorArgs?`
  - Output: `{ data }`

- **`viemContractAction`**
  - Replaces: `viemReadContract`, `viemSimulateContract`, `viemEstimateContractGas`
  - Inputs: `action` (`read` | `simulate` | `estimateGas`), `address`, `abi`, `functionName`, `args?`, `account?`, `value?`, `blockTag?`, `chain?`
  - Output: Read result, simulation result, or gas estimate

- **`viemTransactionBuild`**
  - Replaces: `viemEstimateGas`, `viemPrepareTransactionRequest`
  - Inputs: `{ from?, to?, data?, value?, gas?, maxFeePerGas?, maxPriorityFeePerGas?, gasPrice?, nonce? }`, `chain?`
  - Flags: `mode` (`estimateGas` | `prepare`)
  - Output: `{ gas? }` or a prepared transaction request

- **`viemChainInfo`**
  - Replaces: `viemGetChainId`, `viemListSupportedChains`
  - Inputs: `chain?`
  - Flags: `includeSupported?`, `includeRpcUrl?`
  - Output: `{ chainId?, supportedChains?[], rpcUrl? }`

- Still explicit: `viemGetLogs`, `viemMulticall`

### Migration map (single‑purpose → consolidated)
- `viemGetBlockNumber`, `viemGetBlock`, `viemGetBlockTransactionCount` → `viemBlockInfo`
- `viemGetTransaction`, `viemGetTransactionReceipt` → `viemTransactionInfo`
- `viemGetBalance`, `viemGetTransactionCount` → `viemAccountInfo`
- `viemGetGasPrice`, `viemGetFeeHistory` → `viemGasInfo`
- `viemResolveEnsAddress`, `viemGetEnsResolver`, `viemGetEnsName` → `viemEnsInfo`
- `viemGetERC20Metadata`, `viemGetERC20Balance`, `viemGetERC20Allowance` → `viemErc20Info`
- `viemGetCode`, `viemGetStorageAt` → `viemContractState`
- `viemEncodeFunctionData`, `viemEncodeDeployData` → `viemEncodeData`
- `viemReadContract`, `viemSimulateContract`, `viemEstimateContractGas` → `viemContractAction`
- `viemEstimateGas`, `viemPrepareTransactionRequest` → `viemTransactionBuild`
- `viemGetChainId`, `viemListSupportedChains` → `viemChainInfo`

### MCP integration notes
- All single‑purpose tools remain available and are registered in `src/index.ts` and `src/core/tools/*.ts`.
- Consolidated tools are implemented in `src/core/tools/consolidated.ts` and registered during startup.
- Validation is performed via `src/core/validation.ts` for most single‑purpose tools; consolidated tools perform targeted runtime checks and can be unified behind Zod in a follow‑up.
- Responses are JSON/text with BigInt stringification via `jsonResponse`/`textResponse`.

Key registration call sites:

```114:136:/Users/codex/mcp/viemcp/src/index.ts
  registerEVMPrompts(server);
  // Register modular tools
  registerPublicTools(server, clientManager);
  registerEnsTools(server, clientManager);
  registerConsolidatedTools(server, clientManager);
  await server.connect(transport);
```
