import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ClientManager } from "../clientManager.js";
import { jsonResponse, handleError, textResponse } from "../responses.js";
import { isAddress, type Address, type Hash, formatEther, erc20Abi } from "viem";

export function registerConsolidatedTools(server: McpServer, clientManager: ClientManager) {
  // viemBlockInfo
  server.tool(
    "viemBlockInfo",
    "Get block header and optionally tx count/full transactions",
    {
      type: "object",
      properties: {
        numberOrTag: {
          type: "string",
          description: "Block number (dec/hex) or tag (latest/earliest/pending)",
        },
        includeTxCount: { type: "boolean", description: "Include transaction count" },
        includeFullTransactions: {
          type: "boolean",
          description: "Include full transactions array",
        },
        chain: { type: "string", description: "Chain to query" },
      },
      required: [],
    },
    async ({ numberOrTag, includeTxCount, includeFullTransactions, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const input = (numberOrTag ?? "latest").trim().toLowerCase();
        const tagSet = new Set(["latest", "earliest", "pending"]);
        const isTag = tagSet.has(input);
        const block = isTag
          ? await client.getBlock({
              blockTag: input as never,
              includeTransactions: Boolean(includeFullTransactions),
            })
          : await client.getBlock({
              blockNumber: BigInt(input),
              includeTransactions: Boolean(includeFullTransactions),
            });
        let transactionCount: number | undefined = undefined;
        if (includeTxCount) {
          transactionCount = isTag
            ? await client.getBlockTransactionCount({ blockTag: input as never })
            : await client.getBlockTransactionCount({ blockNumber: BigInt(input) });
        }
        return jsonResponse({ block, transactionCount });
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemTransactionInfo
  server.tool(
    "viemTransactionInfo",
    "Get transaction details and optionally receipt/logs",
    {
      type: "object",
      properties: {
        hash: { type: "string", description: "Transaction hash (0x...)" },
        includeReceipt: { type: "boolean", description: "Include transaction receipt" },
        includeLogs: {
          type: "boolean",
          description: "Include logs from receipt (implies includeReceipt)",
        },
        chain: { type: "string", description: "Chain to query" },
      },
      required: ["hash"],
    },
    async ({ hash, includeReceipt, includeLogs, chain }) => {
      try {
        if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
          throw new Error("Invalid transaction hash");
        }
        const client = clientManager.getClient(chain);
        const tx = await client.getTransaction({ hash: hash as Hash });
        let receipt: unknown | undefined;
        let logs: unknown[] | undefined;
        if (includeReceipt || includeLogs) {
          const r = await client.getTransactionReceipt({ hash: hash as Hash });
          receipt = r;
          if (includeLogs) {
            const candidate: unknown = (r as unknown as { logs?: unknown[] }).logs;
            logs = Array.isArray(candidate) ? candidate : [];
          }
        }
        return jsonResponse({ transaction: tx, receipt, logs });
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemAccountInfo
  server.tool(
    "viemAccountInfo",
    "Get account balance and optionally nonce",
    {
      type: "object",
      properties: {
        address: { type: "string", description: "Ethereum address" },
        blockTag: { type: "string", description: "Optional block tag for balance/nonce" },
        historicalBalanceAt: {
          type: "string",
          description: "Block tag or number for historical balance lookup",
        },
        includeNonce: { type: "boolean", description: "Include nonce (transaction count)" },
        chain: { type: "string", description: "Chain to query" },
      },
      required: ["address"],
    },
    async ({ address, blockTag, historicalBalanceAt, includeNonce, chain }) => {
      try {
        if (!isAddress(address)) {
          throw new Error("Invalid address");
        }
        const client = clientManager.getClient(chain);
        const balance = await client.getBalance({
          address: address as Address,
          blockTag: (historicalBalanceAt ?? blockTag) as never,
        });
        let nonce: number | undefined;
        if (includeNonce) {
          nonce = await client.getTransactionCount({
            address: address as Address,
            blockTag: blockTag as never,
          });
        }
        return jsonResponse({
          address,
          balance: balance.toString(),
          formatted: formatEther(balance),
          nonce,
        });
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemGasInfo
  server.tool(
    "viemGasInfo",
    "Get gas price and/or EIP-1559 fee history",
    {
      type: "object",
      properties: {
        includePrice: { type: "boolean", description: "Include current gas price" },
        history: {
          type: "object",
          description: "Include fee history if provided",
          properties: {
            blockCount: { type: "string" },
            newestBlock: { type: "string" },
            rewardPercentiles: { type: "array" },
          },
        },
        chain: { type: "string", description: "Chain to query" },
      },
      required: [],
    },
    async ({ includePrice, history, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const out: Record<string, unknown> = {};
        if (includePrice !== false) {
          const price = await client.getGasPrice();
          out["price"] = { wei: price.toString() };
        }
        if (history && history.blockCount && history.newestBlock) {
          const count = Number(history.blockCount);
          const newest = /^latest|earliest|pending$/.test(history.newestBlock)
            ? (history.newestBlock as never)
            : (BigInt(history.newestBlock) as never);
          const rewards = Array.isArray(history.rewardPercentiles)
            ? (history.rewardPercentiles as number[])
            : [];
          out["feeHistory"] = await client.getFeeHistory({
            blockCount: count,
            blockTag: newest,
            rewardPercentiles: rewards,
          });
        }
        return jsonResponse(out);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemEnsInfo
  server.tool(
    "viemEnsInfo",
    "Resolve ENS data (name <-> address, resolver, avatar, text records)",
    {
      type: "object",
      properties: {
        lookupType: { type: "string", description: "'name' or 'address'" },
        value: { type: "string", description: "ENS name or address" },
        includeAddress: { type: "boolean" },
        includeName: { type: "boolean" },
        includeResolver: { type: "boolean" },
        includeAvatar: { type: "boolean" },
        textKeys: { type: "array" },
        chain: { type: "string" },
      },
      required: ["lookupType", "value"],
    },
    async ({
      lookupType,
      value,
      includeAddress,
      includeName,
      includeResolver,
      includeAvatar,
      textKeys,
      chain,
    }) => {
      try {
        const client = clientManager.getClient(chain ?? "ethereum");
        const out: Record<string, unknown> = { lookupType };
        if (lookupType === "name") {
          const address =
            includeAddress !== false ? await client.getEnsAddress({ name: value }) : undefined;
          out["address"] = address ?? null;
          if (includeResolver) {
            out["resolver"] = await client.getEnsResolver({ name: value });
          }
          if (includeAvatar) {
            out["avatar"] = await client.getEnsAvatar({ name: value }).catch(() => null);
          }
          if (Array.isArray(textKeys) && textKeys.length) {
            const texts: Record<string, string | null> = {};
            for (const key of textKeys) {
              texts[key] = (await client.getEnsText({ name: value, key }).catch(() => null)) as
                | string
                | null;
            }
            out["texts"] = texts;
          }
        } else if (lookupType === "address") {
          if (!isAddress(value)) {
            throw new Error("Invalid address");
          }
          out["name"] = includeName
            ? await client.getEnsName({ address: value as Address })
            : undefined;
        } else {
          throw new Error("lookupType must be 'name' or 'address'");
        }
        return jsonResponse(out);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemErc20Info
  server.tool(
    "viemErc20Info",
    "Get ERC20 metadata/balance/allowance",
    {
      type: "object",
      properties: {
        token: { type: "string" },
        owner: { type: "string" },
        spender: { type: "string" },
        includeMetadata: { type: "boolean" },
        includeBalance: { type: "boolean" },
        includeAllowance: { type: "boolean" },
        chain: { type: "string" },
      },
      required: ["token"],
    },
    async ({ token, owner, spender, includeMetadata, includeBalance, includeAllowance, chain }) => {
      try {
        if (!isAddress(token)) {
          throw new Error("Invalid token");
        }
        const client = clientManager.getClient(chain);
        const out: Record<string, unknown> = { token };
        if (includeMetadata !== false) {
          const [name, symbol, decimals] = await Promise.all([
            client
              .readContract({
                address: token as Address,
                abi: erc20Abi,
                functionName: "name",
                args: [],
              })
              .catch(() => ""),
            client
              .readContract({
                address: token as Address,
                abi: erc20Abi,
                functionName: "symbol",
                args: [],
              })
              .catch(() => ""),
            client.readContract({
              address: token as Address,
              abi: erc20Abi,
              functionName: "decimals",
              args: [],
            }),
          ]);
          out["metadata"] = { name, symbol, decimals: Number(decimals) };
        }
        if (includeBalance && owner) {
          if (!isAddress(owner)) {
            throw new Error("Invalid owner");
          }
          const balance = (await client.readContract({
            address: token as Address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [owner as Address],
          })) as bigint;
          out["balance"] = { raw: balance.toString() };
        }
        if (includeAllowance && owner && spender) {
          if (!isAddress(owner) || !isAddress(spender)) {
            throw new Error("Invalid owner/spender");
          }
          const allowance = (await client.readContract({
            address: token as Address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [owner as Address, spender as Address],
          })) as bigint;
          out["allowance"] = allowance.toString();
        }
        return jsonResponse(out);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemContractState
  server.tool(
    "viemContractState",
    "Get contract code and/or storage slots",
    {
      type: "object",
      properties: {
        address: { type: "string" },
        slots: { type: "array" },
        blockTag: { type: "string" },
        includeCode: { type: "boolean" },
        includeStorage: { type: "boolean" },
        chain: { type: "string" },
      },
      required: ["address"],
    },
    async ({ address, slots, blockTag, includeCode, includeStorage, chain }) => {
      try {
        if (!isAddress(address)) {
          throw new Error("Invalid address");
        }
        const client = clientManager.getClient(chain);
        const out: Record<string, unknown> = { address };
        if (includeCode !== false) {
          out["code"] = await client.getCode({
            address: address as Address,
            blockTag: blockTag as never,
          });
        }
        if (includeStorage && Array.isArray(slots) && slots.length) {
          const result: Record<string, string> = {};
          for (const s of slots as string[]) {
            const input = (s ?? "").trim().toLowerCase();
            if (!/^\d+$/.test(input) && !/^0x[0-9a-fA-F]+$/.test(input)) {
              throw new Error("slot must be dec or 0x-hex");
            }
            const v = await client.getStorageAt({
              address: address as Address,
              slot: BigInt(input) as unknown as `0x${string}`,
              blockTag: blockTag as never,
            });
            result[input] = v as unknown as string;
          }
          out["storage"] = result;
        }
        return jsonResponse(out);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemEncodeData
  server.tool(
    "viemEncodeData",
    "Encode function/deploy data",
    {
      type: "object",
      properties: {
        mode: { type: "string", description: "function | deploy" },
        abi: { type: "array" },
        functionName: { type: "string" },
        args: { type: "array" },
        bytecode: { type: "string" },
        constructorArgs: { type: "array" },
      },
      required: ["mode", "abi"],
    },
    async ({ mode, abi, functionName, args, bytecode, constructorArgs }) => {
      try {
        if (mode === "function") {
          const { encodeFunctionData } = await import("viem");
          const data = encodeFunctionData({
            abi,
            functionName,
            args: Array.isArray(args) ? args : [],
          });
          return jsonResponse({ data });
        }
        if (mode === "deploy") {
          if (!/^0x[0-9a-fA-F]*$/.test(bytecode ?? "")) {
            throw new Error("bytecode must be 0x-hex");
          }
          const { encodeDeployData } = await import("viem");
          const data = encodeDeployData({
            abi,
            bytecode: bytecode as `0x${string}`,
            args: Array.isArray(constructorArgs) ? constructorArgs : [],
          });
          return jsonResponse({ data });
        }
        throw new Error("mode must be 'function' or 'deploy'");
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemContractAction
  server.tool(
    "viemContractAction",
    "Read/simulate/estimateGas for a contract function",
    {
      type: "object",
      properties: {
        action: { type: "string", description: "read | simulate | estimateGas" },
        address: { type: "string" },
        abi: { type: "array" },
        functionName: { type: "string" },
        args: { type: "array" },
        account: { type: "string" },
        value: { type: "string" },
        blockTag: { type: "string" },
        chain: { type: "string" },
      },
      required: ["action", "address", "abi", "functionName"],
    },
    async ({ action, address, abi, functionName, args, account, value, blockTag, chain }) => {
      try {
        if (!isAddress(address)) {
          throw new Error("Invalid address");
        }
        const client = clientManager.getClient(chain);
        const req: Record<string, unknown> = {
          address: address as Address,
          abi,
          functionName,
          args: Array.isArray(args) ? args : [],
        };
        if (account) {
          if (!isAddress(account)) {
            throw new Error("Invalid account");
          }
          req["account"] = account as Address;
        }
        if (value) {
          if (!/^\d+$/.test(value) && !/^0x[0-9a-fA-F]+$/.test(value)) {
            throw new Error("value must be dec or 0x-hex");
          }
          req["value"] = BigInt(value);
        }
        if (blockTag) {
          req["blockTag"] = blockTag as never;
        }
        if (action === "read") {
          const result = await client.readContract(req as never);
          return jsonResponse({ result });
        }
        if (action === "simulate") {
          const result = await client.simulateContract(req as never);
          return jsonResponse(result);
        }
        if (action === "estimateGas") {
          const gas = await client.estimateContractGas(req as never);
          return jsonResponse({ gas: gas.toString() });
        }
        throw new Error("action must be one of read|simulate|estimateGas");
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemTransactionBuild
  server.tool(
    "viemTransactionBuild",
    "Estimate gas or prepare a transaction request",
    {
      type: "object",
      properties: {
        mode: { type: "string", description: "estimateGas | prepare" },
        from: { type: "string" },
        to: { type: "string" },
        data: { type: "string" },
        value: { type: "string" },
        gas: { type: "string" },
        maxFeePerGas: { type: "string" },
        maxPriorityFeePerGas: { type: "string" },
        gasPrice: { type: "string" },
        nonce: { type: "string" },
        chain: { type: "string" },
      },
      required: ["mode"],
    },
    async ({
      mode,
      from,
      to,
      data,
      value,
      gas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasPrice,
      nonce,
      chain,
    }) => {
      try {
        const client = clientManager.getClient(chain);
        const req: Record<string, unknown> = {};
        const toBigIntIf = (v?: string) => (v ? BigInt(v) : undefined);
        if (from) {
          if (!isAddress(from)) {
            throw new Error("Invalid from");
          }
          req["from"] = from as Address;
        }
        if (to) {
          if (!isAddress(to)) {
            throw new Error("Invalid to");
          }
          req["to"] = to as Address;
        }
        if (data) {
          if (!/^0x[0-9a-fA-F]*$/.test(data)) {
            throw new Error("data must be 0x-hex");
          }
          req["data"] = data as `0x${string}`;
        }
        if (value) {
          req["value"] = toBigIntIf(value);
        }
        if (gas) {
          req["gas"] = toBigIntIf(gas);
        }
        if (gasPrice) {
          req["gasPrice"] = toBigIntIf(gasPrice);
        }
        if (maxFeePerGas) {
          req["maxFeePerGas"] = toBigIntIf(maxFeePerGas);
        }
        if (maxPriorityFeePerGas) {
          req["maxPriorityFeePerGas"] = toBigIntIf(maxPriorityFeePerGas);
        }
        if (nonce) {
          req["nonce"] = Number(nonce);
        }
        if (mode === "estimateGas") {
          const g = await client.estimateGas(req as never);
          return jsonResponse({ gas: g.toString() });
        }
        if (mode === "prepare") {
          const prepared = await client.prepareTransactionRequest(req as never);
          return jsonResponse(prepared);
        }
        throw new Error("mode must be estimateGas|prepare");
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // viemChainInfo
  server.tool(
    "viemChainInfo",
    "Get chain id and/or supported chains",
    {
      type: "object",
      properties: {
        includeSupported: { type: "boolean" },
        includeRpcUrl: { type: "boolean" },
        chain: { type: "string" },
      },
      required: [],
    },
    async ({ includeSupported, includeRpcUrl, chain }) => {
      try {
        const client = clientManager.getClient(chain);
        const out: Record<string, unknown> = {};
        const id = await client.getChainId();
        out["chainId"] = id;
        if (includeSupported) {
          const { SUPPORTED_CHAINS, getRpcUrl } = await import("../chains.js");
          out["supportedChains"] = Object.entries(SUPPORTED_CHAINS).map(([name, c]) => ({
            name,
            chainId: c.id,
            displayName: c.name,
          }));
          if (includeRpcUrl && chain) {
            out["rpcUrl"] = getRpcUrl(chain);
          }
        }
        return jsonResponse(out);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  // Standalone names for clarity
  server.tool(
    "viemGetLogs",
    "Alias of getLogs (kept standalone due to flexible filter surface)",
    { type: "object", properties: {}, required: [] },
    async () =>
      textResponse("Use getLogs with desired filters; alias provided for naming consistency.")
  );

  server.tool(
    "viemMulticall",
    "Alias of multicall (batch read-only calls)",
    { type: "object", properties: {}, required: [] },
    async () =>
      textResponse("Use multicall with contracts array; alias provided for naming consistency.")
  );
}
