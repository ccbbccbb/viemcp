import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerConsolidatedTools } from "../../src/core/tools/consolidated.js";
function createFakeServer() {
  const tools: { name: string; callback: Function }[] = [];
  const server = {
    tool: (_name: string, _desc: string, _schema: unknown, cb: Function) => {
      tools.push({ name: _name, callback: cb });
      return {} as unknown;
    },
  } as any;
  return { server, tools };
}

class FakeClientManager {
  public client = {
    readContract: vi.fn(async () => "ok"),
    simulateContract: vi.fn(async () => ({ result: "sim" })),
    estimateContractGas: vi.fn(async () => 123n),
  };
  getClient() {
    return this.client;
  }
}

describe("consolidated tools typing", () => {
  let server: any;
  let tools: { name: string; callback: Function }[];
  let clientManager: FakeClientManager;

  beforeEach(() => {
    ({ server, tools } = createFakeServer());
    clientManager = new FakeClientManager();
  });

  it("builds typed params for viemContractAction without 'never' or 'unknown' casts", async () => {
    registerConsolidatedTools(server, clientManager as any);
    const entry = tools.find((t) => t.name === "viemContractAction");
    expect(entry).toBeDefined();
    const cb = entry!.callback as (args: any) => Promise<any>;

    const common = {
      address: "0x0000000000000000000000000000000000000001",
      abi: [],
      functionName: "balanceOf",
      args: [],
    };

    await cb({ action: "read", ...common });
    expect(clientManager.client.readContract).toHaveBeenCalledOnce();

    await cb({
      action: "simulate",
      ...common,
      account: "0x0000000000000000000000000000000000000002",
    });
    expect(clientManager.client.simulateContract).toHaveBeenCalledOnce();

    await cb({
      action: "estimateGas",
      ...common,
      account: "0x0000000000000000000000000000000000000002",
    });
    expect(clientManager.client.estimateContractGas).toHaveBeenCalledOnce();
  });
});
