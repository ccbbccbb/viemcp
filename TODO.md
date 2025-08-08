# TODO

## MCP Tools Integration Plan

- [x] Tranche 1 — Core public actions
  - [x] getBlock
  - [x] getTransactionReceipt
  - [x] getGasPrice
  - [x] estimateGas
  - [x] getChainId
  - [x] getBalance
  - [x] getBlockNumber
  - [x] getTransaction
  - [x] listSupportedChains

- [x] Tranche 2 — Contract operations
  - [x] simulateContract
  - [x] estimateContractGas
  - [x] multicall
  - [x] getCode
  - [x] getStorageAt
  - [x] readContract

- [x] Tranche 3 — ERC20
  - [x] getERC20Metadata
  - [x] getERC20Allowance
  - [x] getERC20Balance

- [x] Tranche 4 — ENS
  - [x] getEnsName
  - [x] resolveEnsAddress (now supports `includeAvatar` and `textKeys`; removed `getEnsAvatar` & `getEnsText`)

- [x] Tranche 5 — Tx prep / encoding & utilities
  - [x] prepareTransactionRequest
  - [x] encodeFunctionData
  - [x] encodeDeployData
  - [x] parseEther
  - [x] formatEther
  - [x] isAddress
  - [x] keccak256

## Tools & Resources to Integrate

IMPORTANT:
- Resource: Exposing the way in which a developer should use Viem in their code
- Tool: A function from Viem that an LLM can use to interact with blockchains

## Prompts Plan

- [x] generate_viem_code
  - Goal: Given a requested feature, read `viem://docs/github-index` and relevant `viem://docs/github/{path}` resources to propose correct viem code snippets and integration steps.
  - Inputs: `{ feature: string, hints?: string }`
  - Output: Stepwise codegen plan + code blocks + cited resource URIs

- [x] analyze_transaction
  - Goal: Ask the model to analyze a transaction hash on a chain (structure aligned with evm-mcp-server prompt)
  - Inputs: `{ txHash: string, chain?: string }`
  - Output: Explanatory analysis text

- [x] analyze_address
  - Goal: Ask the model to analyze an address on a chain (balance, nonce, activity overview)
  - Inputs: `{ address: string, chain?: string }`
  - Output: Explanatory analysis text

- [x] search_viem_docs
  - Goal: Ask the model to search/browse our viem docs resources for a topic and summarize with links
  - Inputs: `{ query: string }`
  - Output: Summarized answer with `viem://docs/github/...` links

## Viem Documentation
## Additional Public Actions (Read-only)

- [x] getTransactionCount
  - Implementation: `client.getTransactionCount({ address, blockTag? })`
  - Validation: `isAddress(address)`; `blockTag` in [latest|pending|earliest] or number/hex
  - Output: `{ address, nonce, chain }`
  - viem: `getTransactionCount`

- [x] getBlockTransactionCount
  - Implementation: `client.getBlockTransactionCount({ blockTag|blockNumber })`
  - Validation: `numberOrTag` as tag or number/hex
  - Output: `{ numberOrTag, count, chain }`
  - viem: `getBlockTransactionCount`

- [x] getLogs
  - Implementation: `client.getLogs({ address?, topics?, fromBlock?, toBlock? })`
  - Validation: `isAddress(address)` if provided; block tags or numbers
  - Output: `{ count, logs }`
  - viem: `getLogs`

- [x] getFeeHistory
  - Implementation: `client.getFeeHistory({ blockCount, newestBlock, rewardPercentiles? })`
  - Validation: `blockCount` > 0; `newestBlock` tag or number; `rewardPercentiles` number[]
  - Output: raw fee history JSON
  - viem: `getFeeHistory`

- [x] getEnsResolver
  - Implementation: `client.getEnsResolver({ name })`
  - Validation: `name` string (normalized internally by viem)
  - Output: `{ name, resolver }`
  - viem: `getEnsResolver`


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