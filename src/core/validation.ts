import { z, ZodError } from "zod";
import { isAddress } from "viem";
import { SUPPORTED_CHAINS } from "./chains.js";

// Common Ethereum types
export const AddressSchema = z
  .string()
  .refine((val) => isAddress(val), { message: "Invalid Ethereum address" });

export const HashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash (must be 0x-prefixed 32-byte hex)");

export const HexDataSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/, "Invalid hex data (must be 0x-prefixed hex string)");

export const BlockTagSchema = z.enum(["latest", "earliest", "pending"]);

export const BlockNumberOrTagSchema = z.union([
  BlockTagSchema,
  z.string().regex(/^\d+$/, "Block number must be decimal string"),
  z.string().regex(/^0x[0-9a-fA-F]+$/, "Block number must be 0x-hex string"),
]);

export const ChainNameSchema = z.string().refine((chainName) => chainName in SUPPORTED_CHAINS, {
  message: "Unsupported chain. Use 'listSupportedChains' tool to see available chains.",
});

export const OptionalChainSchema = ChainNameSchema.optional();

// Numeric values (as strings for BigInt compatibility)
export const WeiValueSchema = z.union([
  z.string().regex(/^\d+$/, "Value must be decimal string in wei"),
  z.string().regex(/^0x[0-9a-fA-F]+$/, "Value must be 0x-hex string in wei"),
]);

export const GasLimitSchema = WeiValueSchema;

// Tool-specific schemas
export const GetBalanceSchema = z.object({
  address: AddressSchema,
  chain: OptionalChainSchema,
});

export const GetBlockNumberSchema = z.object({
  chain: OptionalChainSchema,
});

export const GetTransactionSchema = z.object({
  hash: HashSchema,
  chain: OptionalChainSchema,
});

export const GetBlockSchema = z.object({
  numberOrTag: BlockNumberOrTagSchema.default("latest"),
  includeTransactions: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const GetTransactionReceiptSchema = z.object({
  hash: HashSchema,
  chain: OptionalChainSchema,
});

export const GetGasPriceSchema = z.object({
  chain: OptionalChainSchema,
});

export const EstimateGasSchema = z.object({
  from: AddressSchema.optional(),
  to: AddressSchema.optional(),
  data: HexDataSchema.optional(),
  value: WeiValueSchema.optional(),
  chain: OptionalChainSchema,
});

export const GetChainIdSchema = z.object({
  chain: OptionalChainSchema,
});

export const ReadContractSchema = z.object({
  address: AddressSchema,
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.any()).optional(),
  chain: OptionalChainSchema,
});

export const SimulateContractSchema = z.object({
  address: AddressSchema,
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.any()).optional(),
  from: AddressSchema.optional(),
  value: WeiValueSchema.optional(),
  chain: OptionalChainSchema,
});

export const EstimateContractGasSchema = SimulateContractSchema;

export const MulticallSchema = z.object({
  contracts: z
    .array(
      z.object({
        address: AddressSchema,
        abi: z.array(z.any()),
        functionName: z.string(),
        args: z.array(z.any()).optional(),
      })
    )
    .min(1, "At least one contract call is required"),
  allowFailure: z.boolean().optional().default(true),
  chain: OptionalChainSchema,
});

export const GetCodeSchema = z.object({
  address: AddressSchema,
  chain: OptionalChainSchema,
});

export const GetStorageAtSchema = z.object({
  address: AddressSchema,
  slot: z.union([
    z.string().regex(/^\d+$/, "Slot must be decimal string"),
    z.string().regex(/^0x[0-9a-fA-F]+$/, "Slot must be 0x-hex string"),
  ]),
  blockTag: BlockTagSchema.optional(),
  chain: OptionalChainSchema,
});

export const GetERC20BalanceSchema = z.object({
  tokenAddress: AddressSchema,
  ownerAddress: AddressSchema,
  chain: OptionalChainSchema,
});

export const GetERC20MetadataSchema = z.object({
  tokenAddress: AddressSchema,
  chain: OptionalChainSchema,
});

export const GetERC20AllowanceSchema = z.object({
  tokenAddress: AddressSchema,
  owner: AddressSchema,
  spender: AddressSchema,
  chain: OptionalChainSchema,
});

export const ResolveEnsAddressSchema = z.object({
  name: z.string().min(1, "ENS name is required"),
  chain: OptionalChainSchema,
  includeAvatar: z.boolean().optional(),
  textKeys: z.array(z.string()).optional(),
});

export const GetEnsNameSchema = z.object({
  address: AddressSchema,
  chain: OptionalChainSchema,
});

export const GetEnsResolverSchema = z.object({
  name: z.string().min(1, "ENS name is required"),
  chain: OptionalChainSchema,
});

export const PrepareTransactionRequestSchema = z.object({
  from: AddressSchema.optional(),
  to: AddressSchema.optional(),
  data: HexDataSchema.optional(),
  value: WeiValueSchema.optional(),
  gas: GasLimitSchema.optional(),
  maxFeePerGas: WeiValueSchema.optional(),
  maxPriorityFeePerGas: WeiValueSchema.optional(),
  gasPrice: WeiValueSchema.optional(),
  nonce: z
    .union([
      z.string().regex(/^\d+$/, "Nonce must be decimal string"),
      z.string().regex(/^0x[0-9a-fA-F]+$/, "Nonce must be 0x-hex string"),
    ])
    .optional(),
  chain: OptionalChainSchema,
});

export const EncodeFunctionDataSchema = z.object({
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.any()).optional(),
});

export const EncodeDeployDataSchema = z.object({
  abi: z.array(z.any()),
  bytecode: HexDataSchema,
  args: z.array(z.any()).optional(),
});

export const ParseEtherSchema = z.object({
  value: z.string().min(1, "ETH value is required"),
});

export const FormatEtherSchema = z.object({
  value: z.string().min(1, "Wei value is required"),
});

export const IsAddressSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

export const Keccak256Schema = z.object({
  data: z.string().min(1, "Data is required"),
});

// =============================
// Consolidated tool Zod schemas
// =============================

export const BlockInfoSchema = z.object({
  numberOrTag: BlockNumberOrTagSchema.default("latest").optional(),
  includeTxCount: z.boolean().optional(),
  includeFullTransactions: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const TransactionInfoSchema = z.object({
  hash: HashSchema,
  includeReceipt: z.boolean().optional(),
  includeLogs: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const AccountInfoSchema = z.object({
  address: AddressSchema,
  blockTag: BlockTagSchema.optional(),
  historicalBalanceAt: BlockNumberOrTagSchema.optional(),
  includeNonce: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const GasInfoHistorySchema = z.object({
  blockCount: z.string().regex(/^\d+$/, "blockCount must be decimal string"),
  newestBlock: z.union([
    BlockTagSchema,
    z.string().regex(/^0x[0-9a-fA-F]+$/, "newestBlock must be 0x-hex"),
    z.string().regex(/^\d+$/, "newestBlock must be decimal string"),
  ]),
  rewardPercentiles: z.array(z.number()).optional(),
});

export const GasInfoSchema = z.object({
  includePrice: z.boolean().optional(),
  history: GasInfoHistorySchema.optional(),
  chain: OptionalChainSchema,
});

export const EnsInfoSchema = z.object({
  lookupType: z.enum(["name", "address"]),
  value: z.string().min(1),
  includeAddress: z.boolean().optional(),
  includeName: z.boolean().optional(),
  includeResolver: z.boolean().optional(),
  includeAvatar: z.boolean().optional(),
  textKeys: z.array(z.string()).optional(),
  chain: OptionalChainSchema,
});

export const Erc20InfoSchema = z.object({
  token: AddressSchema,
  owner: AddressSchema.optional(),
  spender: AddressSchema.optional(),
  includeMetadata: z.boolean().optional(),
  includeBalance: z.boolean().optional(),
  includeAllowance: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const ContractStateSchema = z.object({
  address: AddressSchema,
  slots: z
    .array(
      z.union([
        z.string().regex(/^\d+$/, "Slot must be decimal string"),
        z.string().regex(/^0x[0-9a-fA-F]+$/, "Slot must be 0x-hex string"),
      ])
    )
    .optional(),
  blockTag: BlockTagSchema.optional(),
  includeCode: z.boolean().optional(),
  includeStorage: z.boolean().optional(),
  chain: OptionalChainSchema,
});

export const EncodeDataSchema = z
  .object({
    mode: z.enum(["function", "deploy"]),
    abi: z.array(z.any()),
    functionName: z.string().optional(),
    args: z.array(z.any()).optional(),
    bytecode: HexDataSchema.optional(),
    constructorArgs: z.array(z.any()).optional(),
  })
  .refine((v) => (v.mode === "function" ? Boolean(v.functionName) : true), {
    message: "functionName is required when mode=function",
  })
  .refine((v) => (v.mode === "deploy" ? Boolean(v.bytecode) : true), {
    message: "bytecode is required when mode=deploy",
  });

export const ContractActionSchema = z.object({
  action: z.enum(["read", "simulate", "estimateGas"]),
  address: AddressSchema,
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.any()).optional(),
  account: AddressSchema.optional(),
  value: WeiValueSchema.optional(),
  blockTag: BlockTagSchema.optional(),
  chain: OptionalChainSchema,
});

export const TransactionBuildSchema = z.object({
  mode: z.enum(["estimateGas", "prepare"]),
  from: AddressSchema.optional(),
  to: AddressSchema.optional(),
  data: HexDataSchema.optional(),
  value: WeiValueSchema.optional(),
  gas: GasLimitSchema.optional(),
  maxFeePerGas: WeiValueSchema.optional(),
  maxPriorityFeePerGas: WeiValueSchema.optional(),
  gasPrice: WeiValueSchema.optional(),
  nonce: z
    .union([
      z.string().regex(/^\d+$/, "Nonce must be decimal string"),
      z.string().regex(/^0x[0-9a-fA-F]+$/, "Nonce must be 0x-hex string"),
    ])
    .optional(),
  chain: OptionalChainSchema,
});

export const ChainInfoSchema = z.object({
  includeSupported: z.boolean().optional(),
  includeRpcUrl: z.boolean().optional(),
  chain: OptionalChainSchema,
});

// Helper function to validate with better error messages
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const zodError = error as ZodError<unknown>;
      const errors = zodError.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join(".") + ": " : "";
          return `${path}${issue.message}`;
        })
        .join(", ");
      throw new Error(`Validation failed: ${errors}`);
    }
    throw new Error("Validation failed: Unknown validation error");
  }
}
