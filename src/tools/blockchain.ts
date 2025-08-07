import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address, type Hash } from "viem";
import { ClientManager } from "../clients/manager.js";
import {
  AddressSchema,
  HashSchema,
  ChainNameSchema,
  BlockNumberSchema,
} from "../utils/validation.js";
import { handleToolError } from "../utils/errors.js";
import {
  formatBalance,
  formatGasPrice,
  formatTimestamp,
  jsonResponse,
  textResponse,
} from "../utils/formatting.js";

export function registerBlockchainTools(server: McpServer, clientManager: ClientManager) {
  // Get Balance
  server.tool(
    "getBalance",
    "Get native token balance for an address",
    {
      address: AddressSchema.describe("Ethereum address or ENS name"),
      chainId: ChainNameSchema.optional().describe("Chain to query (default: current chain)"),
      blockNumber: BlockNumberSchema.optional().describe("Block number to query at"),
    },
    async ({ address, chainId, blockNumber }) => {
      try {
        const client = clientManager.getClient(chainId);
        const balance = await client.getBalance({
          address: address as Address,
          blockNumber: typeof blockNumber === "number" ? BigInt(blockNumber) : blockNumber,
        });

        const chain = chainId ? client.chain : clientManager.getCurrentChain();
        const formatted = formatBalance(balance, 18, chain?.nativeCurrency?.symbol);

        return textResponse(`Balance for ${address} on ${chain?.name}: ${formatted}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Block Number
  server.tool(
    "getBlockNumber",
    "Get the current block number",
    {
      chainId: ChainNameSchema.optional().describe("Chain to query (default: current chain)"),
    },
    async ({ chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const blockNumber = await client.getBlockNumber();
        const chain = chainId ? client.chain : clientManager.getCurrentChain();

        return textResponse(`Current block number on ${chain?.name}: ${blockNumber.toString()}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Block
  server.tool(
    "getBlock",
    "Get block information by number or hash",
    {
      blockIdentifier: z
        .union([
          z.number().describe("Block number"),
          HashSchema.describe("Block hash"),
          z.literal("latest"),
          z.literal("pending"),
          z.literal("safe"),
          z.literal("finalized"),
        ])
        .describe("Block number, hash, or tag"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      includeTransactions: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include full transaction details"),
    },
    async ({ blockIdentifier, chainId, includeTransactions }) => {
      try {
        const client = clientManager.getClient(chainId);

        const blockParams =
          typeof blockIdentifier === "string" && blockIdentifier.startsWith("0x")
            ? { blockHash: blockIdentifier as Hash }
            : typeof blockIdentifier === "number"
              ? { blockNumber: BigInt(blockIdentifier) }
              : { blockTag: blockIdentifier };

        const block = await client.getBlock({
          ...blockParams,
          includeTransactions,
        });

        return jsonResponse({
          number: block.number?.toString(),
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: formatTimestamp(block.timestamp),
          gasUsed: block.gasUsed?.toString(),
          gasLimit: block.gasLimit?.toString(),
          baseFeePerGas: block.baseFeePerGas ? formatGasPrice(block.baseFeePerGas) : null,
          miner: block.miner,
          transactionCount: block.transactions.length,
          transactions: includeTransactions ? block.transactions : undefined,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Transaction
  server.tool(
    "getTransaction",
    "Get transaction details by hash",
    {
      hash: HashSchema.describe("Transaction hash"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ hash, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const transaction = await client.getTransaction({
          hash: hash as Hash,
        });

        return jsonResponse({
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          value: formatBalance(transaction.value),
          gas: transaction.gas?.toString(),
          gasPrice: transaction.gasPrice ? formatGasPrice(transaction.gasPrice) : null,
          maxFeePerGas: transaction.maxFeePerGas ? formatGasPrice(transaction.maxFeePerGas) : null,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
            ? formatGasPrice(transaction.maxPriorityFeePerGas)
            : null,
          nonce: transaction.nonce,
          blockNumber: transaction.blockNumber?.toString(),
          blockHash: transaction.blockHash,
          input: transaction.input,
          type: transaction.type,
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Transaction Receipt
  server.tool(
    "getTransactionReceipt",
    "Get transaction receipt with logs and status",
    {
      hash: HashSchema.describe("Transaction hash"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ hash, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const receipt = await client.getTransactionReceipt({
          hash: hash as Hash,
        });

        return jsonResponse({
          transactionHash: receipt.transactionHash,
          status: receipt.status === "success" ? "success" : "failed",
          blockNumber: receipt.blockNumber.toString(),
          blockHash: receipt.blockHash,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice
            ? formatGasPrice(receipt.effectiveGasPrice)
            : null,
          from: receipt.from,
          to: receipt.to,
          contractAddress: receipt.contractAddress,
          logsCount: receipt.logs.length,
          logs: receipt.logs.map((log) => ({
            address: log.address,
            topics: log.topics,
            data: log.data,
            logIndex: log.logIndex,
            removed: log.removed,
          })),
        });
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Gas Price
  server.tool(
    "getGasPrice",
    "Get current gas price",
    {
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const gasPrice = await client.getGasPrice();
        const chain = chainId ? client.chain : clientManager.getCurrentChain();

        return textResponse(`Current gas price on ${chain?.name}: ${formatGasPrice(gasPrice)}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Transaction Count (Nonce)
  server.tool(
    "getTransactionCount",
    "Get transaction count (nonce) for an address",
    {
      address: AddressSchema.describe("Ethereum address"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
      blockNumber: BlockNumberSchema.optional().describe("Block number to query at"),
    },
    async ({ address, chainId, blockNumber }) => {
      try {
        const client = clientManager.getClient(chainId);
        const count = await client.getTransactionCount({
          address: address as Address,
          blockNumber: typeof blockNumber === "number" ? BigInt(blockNumber) : blockNumber,
        });

        return textResponse(`Transaction count for ${address}: ${count}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Get Chain ID
  server.tool(
    "getChainId",
    "Get the chain ID of the current or specified network",
    {
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const id = await client.getChainId();
        const chain = chainId ? client.chain : clientManager.getCurrentChain();

        return textResponse(`Chain ID for ${chain?.name}: ${id}`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );

  // Estimate Gas
  server.tool(
    "estimateGas",
    "Estimate gas for a transaction",
    {
      to: AddressSchema.describe("Recipient address"),
      from: AddressSchema.optional().describe("Sender address"),
      value: z.string().optional().describe("Value to send in ETH"),
      data: z.string().optional().describe("Transaction data"),
      chainId: ChainNameSchema.optional().describe("Chain to query"),
    },
    async ({ to, from, value, data, chainId }) => {
      try {
        const client = clientManager.getClient(chainId);
        const gas = await client.estimateGas({
          to: to as Address,
          from: from as Address | undefined,
          value: value ? BigInt(value) : undefined,
          data: data as `0x${string}` | undefined,
        });

        return textResponse(`Estimated gas: ${gas.toString()} units`);
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
