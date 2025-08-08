/**
 * Embedded viem/wagmi patterns for fast, offline reference
 * These patterns are commonly used and provide instant access without network calls
 */

export const VIEM_PATTERNS = {
  // Contract Interactions
  readContract: `
// Basic contract read
const balance = await client.readContract({
  address: '0x...',
  abi: contractABI,
  functionName: 'balanceOf',
  args: [userAddress],
})`,

  writeContract: `
// Contract write (requires wallet client)
const hash = await walletClient.writeContract({
  address: '0x...',
  abi: contractABI,
  functionName: 'transfer',
  args: [recipient, amount],
})`,

  multicall: `
// Batch multiple reads
const results = await client.multicall({
  contracts: [
    { address: '0x...', abi, functionName: 'name' },
    { address: '0x...', abi, functionName: 'symbol' },
    { address: '0x...', abi, functionName: 'decimals' },
  ],
})`,

  // Transaction Building
  prepareTransaction: `
// Prepare transaction
const request = await client.prepareTransactionRequest({
  to: '0x...',
  value: parseEther('0.1'),
  data: '0x...',
})`,

  estimateGas: `
// Estimate gas
const gas = await client.estimateGas({
  to: '0x...',
  value: parseEther('0.1'),
})`,

  // Event Handling
  watchEvents: `
// Watch for events
const unwatch = client.watchEvent({
  address: '0x...',
  event: parseAbiItem('event Transfer(address,address,uint256)'),
  onLogs: (logs) => console.log(logs),
})`,

  getLogs: `
// Get historical logs
const logs = await client.getLogs({
  address: '0x...',
  event: parseAbiItem('event Transfer(address,address,uint256)'),
  fromBlock: 'earliest',
  toBlock: 'latest',
})`,

  // ENS
  ensResolve: `
// Resolve ENS name
const address = await client.getEnsAddress({
  name: 'vitalik.eth',
})

// Reverse resolve
const name = await client.getEnsName({
  address: '0x...',
})`,

  // Encoding/Decoding
  encodeFunctionData: `
// Encode function call
const data = encodeFunctionData({
  abi: contractABI,
  functionName: 'transfer',
  args: [recipient, amount],
})`,

  decodeFunctionResult: `
// Decode function result
const result = decodeFunctionResult({
  abi: contractABI,
  functionName: 'balanceOf',
  data: '0x...',
})`,
}

export const WAGMI_PATTERNS = {
  // Account Management
  useAccount: `
// Get account info
import { useAccount } from 'wagmi'

function Component() {
  const { address, isConnecting, isDisconnected } = useAccount()
  
  if (isConnecting) return <div>Connecting...</div>
  if (isDisconnected) return <div>Disconnected</div>
  
  return <div>Connected to {address}</div>
}`,

  useConnect: `
// Connect wallet
import { useConnect } from 'wagmi'

function Component() {
  const { connect, connectors, error, isLoading } = useConnect()
  
  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={!connector.ready}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}`,

  // Contract Interactions
  useContractRead: `
// Read from contract
import { useContractRead } from 'wagmi'

function Component() {
  const { data, isError, isLoading } = useContractRead({
    address: '0x...',
    abi: contractABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })
  
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error reading contract</div>
  
  return <div>Balance: {data?.toString()}</div>
}`,

  useContractWrite: `
// Write to contract
import { useContractWrite, usePrepareContractWrite } from 'wagmi'

function Component() {
  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    args: [recipient, amount],
  })
  
  const { write, isLoading } = useContractWrite(config)
  
  return (
    <button onClick={() => write?.()} disabled={!write || isLoading}>
      Transfer
    </button>
  )
}`,

  useContractEvent: `
// Watch contract events
import { useContractEvent } from 'wagmi'

function Component() {
  useContractEvent({
    address: '0x...',
    abi: contractABI,
    eventName: 'Transfer',
    listener(log) {
      console.log('Transfer event:', log)
    },
  })
  
  return <div>Watching for events...</div>
}`,

  // Transactions
  useWaitForTransaction: `
// Wait for transaction
import { useWaitForTransaction } from 'wagmi'

function Component({ hash }) {
  const { data, isError, isLoading } = useWaitForTransaction({
    hash,
  })
  
  if (isLoading) return <div>Processing...</div>
  if (isError) return <div>Transaction failed</div>
  
  return <div>Transaction confirmed!</div>
}`,

  // Balance
  useBalance: `
// Get balance
import { useBalance } from 'wagmi'

function Component() {
  const { data, isError, isLoading } = useBalance({
    address: '0x...',
  })
  
  if (isLoading) return <div>Fetching balance...</div>
  if (isError) return <div>Error fetching balance</div>
  
  return (
    <div>
      Balance: {data?.formatted} {data?.symbol}
    </div>
  )
}`,

  // ENS
  useEnsName: `
// Get ENS name
import { useEnsName } from 'wagmi'

function Component({ address }) {
  const { data, isError, isLoading } = useEnsName({
    address,
  })
  
  if (isLoading) return <div>Loading ENS...</div>
  if (isError) return <div>Error resolving ENS</div>
  
  return <div>{data || address}</div>
}`,

  // Network
  useNetwork: `
// Get network info
import { useNetwork, useSwitchNetwork } from 'wagmi'

function Component() {
  const { chain } = useNetwork()
  const { chains, switchNetwork } = useSwitchNetwork()
  
  return (
    <div>
      <div>Connected to {chain?.name}</div>
      {chains.map((x) => (
        <button
          key={x.id}
          onClick={() => switchNetwork?.(x.id)}
        >
          Switch to {x.name}
        </button>
      ))}
    </div>
  )
}`,

  // Signing
  useSignMessage: `
// Sign message
import { useSignMessage } from 'wagmi'

function Component() {
  const { data, isError, isLoading, signMessage } = useSignMessage({
    message: 'Hello from wagmi!',
  })
  
  return (
    <div>
      <button onClick={() => signMessage()}>Sign Message</button>
      {data && <div>Signature: {data}</div>}
    </div>
  )
}`,
}

export const COMMON_PATTERNS = {
  // Setup
  viemClient: `
// Create viem client
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})`,

  wagmiConfig: `
// Wagmi config
import { createConfig, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient,
})`,

  // Common Issues
  bigIntSerialization: `
// Handle BigInt serialization
JSON.stringify(data, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
)`,

  checksumAddress: `
// Ensure checksum address
import { getAddress } from 'viem'

const checksummed = getAddress(address.toLowerCase())`,

  parseUnits: `
// Parse token amounts
import { parseUnits, formatUnits } from 'viem'

// Parse 1.5 tokens with 18 decimals
const amount = parseUnits('1.5', 18)

// Format back to human readable
const formatted = formatUnits(amount, 18)`,

  errorHandling: `
// Handle contract errors
try {
  const result = await client.readContract({...})
} catch (error) {
  if (error.name === 'ContractFunctionRevertedError') {
    const reason = error.reason
    console.log('Revert reason:', reason)
  }
}`,
}

export function getPattern(
  category: string,
  pattern: string,
): string | undefined {
  const patterns: Record<string, any> = {
    viem: VIEM_PATTERNS,
    wagmi: WAGMI_PATTERNS,
    common: COMMON_PATTERNS,
  }

  return patterns[category]?.[pattern]
}

export function searchPatterns(
  query: string,
): Array<{ category: string; pattern: string; code: string }> {
  const results: Array<{ category: string; pattern: string; code: string }> = []
  const searchTerm = query.toLowerCase()

  for (const [category, patterns] of Object.entries({
    viem: VIEM_PATTERNS,
    wagmi: WAGMI_PATTERNS,
    common: COMMON_PATTERNS,
  })) {
    for (const [name, code] of Object.entries(patterns)) {
      if (
        name.toLowerCase().includes(searchTerm) ||
        (code as string).toLowerCase().includes(searchTerm)
      ) {
        results.push({ category, pattern: name, code })
      }
    }
  }

  return results
}
