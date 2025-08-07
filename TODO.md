# TODO

## MCP Tools Integration Plan

- [x] Tranche 1 — Core public actions
  - [x] getBlock
  - [x] getTransactionReceipt
  - [x] getGasPrice
  - [x] estimateGas
  - [x] getChainId
  - [x] getBalance (migrated from Tranche 0)
  - [x] getBlockNumber (migrated from Tranche 0)
  - [x] getTransaction (migrated from Tranche 0)
  - [x] listSupportedChains (migrated from Tranche 0)

- [x] Tranche 2 — Contract operations
  - [x] simulateContract
  - [x] estimateContractGas
  - [x] multicall
  - [x] getCode
  - [x] getStorageAt
  - [x] readContract (migrated from Tranche 0)

- [x] Tranche 3 — ERC20
  - [x] getERC20Metadata
  - [x] getERC20Allowance
  - [x] getERC20Balance (migrated from Tranche 0)

- [x] Tranche 4 — ENS
  - [x] getEnsName
  - [x] getEnsAvatar
  - [x] getEnsText
  - [x] resolveEnsAddress (migrated from Tranche 0)

- [x] Tranche 5 — Tx prep / encoding
  - [x] prepareTransactionRequest
  - [x] encodeFunctionData
  - [x] encodeDeployData
  - [x] parseEther (migrated from Tranche 0)
  - [x] formatEther (migrated from Tranche 0)
  - [x] isAddress (migrated from Tranche 0)
  - [x] keccak256 (migrated from Tranche 0)

## Overlap and Migration Notes (from Tranche 0)

- getBalance → Tranche 1 (Public Actions: Account)
- getBlockNumber → Tranche 1 (Public Actions: Block)
- getTransaction → Tranche 1 (Public Actions: Transaction)
- listSupportedChains → Tranche 1 (Discovery)
- readContract → Tranche 2 (Contract)
- getERC20Balance → Tranche 3 (ERC20)
- resolveEnsAddress → Tranche 4 (ENS)
- parseEther, formatEther, isAddress, keccak256 → Tranche 5 (Utilities)

## Tranche 0 — Already Implemented Tools (not in Tranche 1 or later)

- [x] getBalance
  - Implementation: `clientManager.getClient(chain)` → `client.getBalance({ address })`
  - Validation: `isAddress(address)`
  - Output: formatted with `formatEther`, includes native symbol when available
  - viem: `getBalance`, `formatEther`

- [x] getBlockNumber
  - Implementation: `client.getBlockNumber()`
  - Output: stringified block number
  - viem: `getBlockNumber`

- [x] getTransaction
  - Implementation: `client.getTransaction({ hash })`
  - Validation: `^0x[0-9a-fA-F]{64}$` for `hash`
  - Output: JSON with `hash, from, to, value (formatted), gasPrice, blockNumber`
  - viem: `getTransaction`, `formatEther`

- [x] readContract
  - Implementation: `client.readContract({ address, abi, functionName, args })`
  - Validation: `isAddress(address)`; ABI passed-through; args optional array
  - Output: JSON `{ function, result }`
  - viem: `readContract`

- [x] getERC20Balance
  - Implementation: ERC20 reads: `balanceOf(owner)`, `decimals()`, `symbol()` (fallback to "TOKEN")
  - Validation: `isAddress(tokenAddress)`, `isAddress(ownerAddress)`
  - Output: humanized balance using `decimals`
  - viem: `erc20Abi`, `readContract`

- [x] resolveEnsAddress
  - Implementation: `client.getEnsAddress({ name: normalize(name) })` on `ethereum`
  - Output: `name → address` or `not found`
  - viem: `getEnsAddress`, `normalize`

- [x] parseEther
  - Implementation: `parseEther(value)`
  - Output: `"<eth> ETH = <wei> wei"`
  - viem: `parseEther`

- [x] formatEther
  - Implementation: `formatEther(BigInt(value))`
  - Output: `"<wei> wei = <eth> ETH"`
  - viem: `formatEther`

- [x] isAddress
  - Implementation: `isAddress(address)`
  - Output: `Valid address` | `Invalid address`
  - viem: `isAddress`

- [x] keccak256
  - Implementation: `keccak256(toHex(data))`
  - Output: `Hash: 0x...`
  - viem: `keccak256`, `toHex`

- [x] listSupportedChains
  - Implementation: enumerates internal `SUPPORTED_CHAINS` (viem chains + aliases)
  - Output: JSON `{ name, chainId, displayName, nativeCurrency }[]`
  - viem: `viem/chains` catalog (read at startup)

## Tools & Resources to Integrate

IMPORTANT:
- Resource: Exposing the way in which a developer should use Viem in their code
- Tool: A function from Viem that an LLM can use to interact with blockchains

## Viem Documentation

Introduction
- Why Viem
- Installation
- Getting Started
- Platform Compatibility
- FAQ

Guides
- Migration Guide
- Ethers v5 → viem
- TypeScript
- Error Handling
- EIP-7702
  -- Overview
  -- Contract Writes
  -- Sending Transactions
- Blob Transactions

Clients & Transports
- Introduction
- Public Client
- Wallet Client
- Test Client
- Build your own Client
- Transports
  -- HTTP
  -- WebSocket
  -- Custom (EIP-1193)
  -- IPC
  -- Fallback

Public Actions
- Introduction
- Access List
  -- createAccessList
- Account
  -- getBalance
  -- getTransactionCount
- Block
  -- getBlock
  -- getBlockNumber
  -- getBlockTransactionCount
  -- simulateBlocks
  -- watchBlockNumber
  -- watchBlocks
- Calls
  -- call
  -- simulateCalls
- Chain
  -- getChainId
- EIP-712
  -- getEip712Domain
- Fee
  -- estimateFeesPerGas
  -- estimateGas
  -- estimateMaxPriorityFeePerGas
  -- getBlobBaseFee
  -- getFeeHistory
  -- getGasPrice
- Filters & Logs
  -- createBlockFilter
  -- createEventFilter
  -- createPendingTransactionFilter
  -- getFilterChanges
  -- getFilterLogs
  -- getLogs
  -- watchEvent
  -- uninstallFilter
- Proof
  -- getProof
- Signature
  -- verifyMessage
  -- verifyTypedData
- Transaction
  -- prepareTransactionRequest
  -- getTransaction
  -- getTransactionConfirmations
  -- getTransactionReceipt
  -- sendRawTransaction
  -- waitForTransactionReceipt
  -- watchPendingTransactions

Wallet Actions
  - Introduction
  - Account
  -- getAddresses
  -- requestAddresses
- Assets
  -- watchAsset
- Call Bundles (EIP-5792)
  -- getCallsStatus
  -- getCapabilities
  -- sendCalls
  -- showCallsStatus
  -- waitForCallsStatus
- Chain
  -- addChain
  -- switchChain
- Data
  -- signMessage
  -- signTypedData
- Permissions
  -- getPermissions
  -- requestPermissions
- Transaction
  -- prepareTransactionRequest
  -- sendRawTransaction
  -- sendTransaction
  -- signTransaction

Test Actions
  - Introduction
  - Account
  -- impersonateAccount
  -- setBalance
  -- setCode
  -- setNonce
  -- setStorageAt
  -- stopImpersonatingAccount
- Block
  -- getAutomine
  -- increaseTime
  -- mine
  -- removeBlockTimestampInterval
  -- setAutomine
  -- setIntervalMining
  -- setBlockTimestampInterval
  -- setBlockGasLimit
  -- setNextBlockBaseFeePerGas
  -- setNextBlockTimestamp
- Node
  -- setCoinbase
  -- setMinGasPrice
- Settings
  -- reset
  -- setLoggingEnabled
  -- setRpcUrl
- State
  -- dumpState
  -- loadState
  -- revert
  -- snapshot
- Transaction
  -- dropTransaction
  -- getTxpoolContent
  -- getTxpoolStatus
  -- inspectTxpool
  -- sendUnsignedTransaction

Accounts
- JSON-RPC Account
- Local Accounts
  -- Private Key
  -- Mnemonic
  -- Hierarchical Deterministic (HD)
  -- Custom
  -- Utilities
  --- createNonceManager
  --- signMessage
  --- signTransaction
  --- signTypedData

Chains
- Introduction
- Configuration
  -- Fees
  -- Formatters
  -- Serializers
- Implementations
  -- Celo
  -- OP Stack
  -- ZKsync

Contract
- Contract Instances
  -- Actions
  --- createContractEventFilter
  -- deployContract
  -- estimateContractGas
  -- getCode
  -- getContractEvents
  -- getStorageAt
  -- multicall
  -- readContract
  -- simulateContract
  -- writeContract
  -- watchContractEvent
- Utilities
  -- decodeDeployData
  -- decodeErrorResult
  -- decodeEventLog
  -- decodeFunctionData
  -- decodeFunctionResult
  -- encodeDeployData
  -- encodeErrorResult
  -- encodeEventTopics
  -- encodeFunctionData
  -- encodeFunctionResult
  -- parseEventLogs

ENS
- Actions
  -- getEnsAddress
  -- getEnsAvatar
  -- getEnsName
  -- getEnsResolver
  -- getEnsText
- Utilities
  -- labelhash
  -- namehash
  -- normalize

SIWE
- Actions
  -- verifySiweMessage
- Utilities
  -- createSiweMessage
  -- generateSiweNonce
  -- parseSiweMessage
  -- validateSiweMessage

ABI
- Actions
  -- decodeAbiParameters
  -- encodeAbiParameters
  -- encodePacked
  -- getAbiItem
  -- parseAbi
  -- parseAbiItem
  -- parseAbiParameter
  -- parseAbiParameters

EIP-7702
- Overview
- Guides
  -- Contract Writes
  -- Sending Transactions
- Actions
  -- prepareAuthorization
  -- signAuthorization
- Utilities
  -- hashAuthorization
  -- recoverAuthorizationAddress
  -- verifyAuthorization

Utilities
- Addresses
  -- getAddress
  -- getContractAddress
  -- isAddress
  -- isAddressEqual
- Blob
  -- blobsToProofs
  -- blobsToCommitments
  -- commitmentsToVersionedHashes
  -- commitmentToVersionedHash
  -- fromBlobs
  -- sidecarsToVersionedHashes
  -- toBlobs
  -- toBlobSidecars
- Chain
  -- extractChain
- Data
  -- concat
  -- isBytes
  -- isHex
  -- pad
  -- slice
  -- size
  -- trim
- Encoding
  -- fromBytes
  -- fromHex
  -- fromRlp
  -- toBytes
  -- toHex
  -- toRlp
- Hash
  -- isHash
  -- keccak256
  -- ripemd160
  -- sha256
  -- toEventHash
  -- toEventSelector
  -- toEventSignature
  -- toFunctionHash
  -- toFunctionSelector
  -- toFunctionSignature
- KZG
  -- setupKzg
- Signature
  -- compactSignatureToSignature
  -- hashMessage
  -- hashTypedData
  -- isErc6492Signature
  -- parseCompactSignature
  -- parseErc6492Signature
  -- parseSignature
  -- recoverAddress
  -- recoverMessageAddress
  -- recoverPublicKey
  -- recoverTransactionAddress
  -- recoverTypedDataAddress
  -- serializeCompactSignature
  -- serializeErc6492Signature
  -- serializeSignature
  -- signatureToCompactSignature
  -- verifyMessage
  -- verifyTypedData
- Transaction
  -- parseTransaction
  -- serializeTransaction
- Units
  -- formatEther
  -- formatGwei
  -- formatUnits
  -- parseEther
  -- parseGwei
  -- parseUnits

Glossary
- Terms
- Types
- Errors