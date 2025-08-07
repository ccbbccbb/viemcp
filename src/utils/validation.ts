import { z } from "zod";
import { isAddress } from "viem";

export const AddressSchema = z
  .string()
  .refine((val) => isAddress(val), { message: "Invalid Ethereum address" });

export const HashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const HexSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, "Invalid hex string");

export const ChainIdSchema = z.number().positive();

export const ChainNameSchema = z.enum([
  "ethereum",
  "polygon",
  "optimism",
  "arbitrum",
  "base",
  "bsc",
  "avalanche",
  "fantom",
  "gnosis",
  "moonbeam",
  "celo",
  "aurora",
  "sepolia",
  "mumbai",
]);

export const BlockTagSchema = z.enum(["latest", "earliest", "pending", "safe", "finalized"]);

export const BlockNumberSchema = z.union([z.number().nonnegative(), BlockTagSchema]);

export function validateAddress(address: unknown): string {
  const result = AddressSchema.safeParse(address);
  if (!result.success) {
    throw new Error(`Invalid address: ${result.error.message}`);
  }
  return result.data;
}

export function validateHash(hash: unknown): string {
  const result = HashSchema.safeParse(hash);
  if (!result.success) {
    throw new Error(`Invalid hash: ${result.error.message}`);
  }
  return result.data;
}
