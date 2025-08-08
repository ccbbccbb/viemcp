import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerPublicTools } from "../../src/core/tools/public.js";

// Create a lightweight fake client manager
class FakeClientManager {
  public client = {
    getLogs: vi.fn(async (_params: any) => []) as unknown as jest.Mock,
  } as any;
  getClient() {
    return this.client;
  }
}

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

describe("public tools", () => {
  let server: any;
  let tools: { name: string; callback: Function }[];
  let clientManager: FakeClientManager;

  beforeEach(() => {
    ({ server, tools } = createFakeServer());
    clientManager = new FakeClientManager();
  });

  it("parses viemGetLogs from/to block as bigint or BlockTag", async () => {
    registerPublicTools(server, clientManager as any);
    const entry = tools.find((t) => t.name === "viemGetLogs");
    expect(entry).toBeDefined();
    const cb = entry!.callback as (args: any) => Promise<any>;

    // numeric blocks
    await cb({ fromBlock: "100", toBlock: "101" });
    const firstCall = clientManager.client.getLogs.mock.calls.at(-1)![0];
    expect(typeof firstCall.fromBlock === "bigint").toBe(true);
    expect(typeof firstCall.toBlock === "bigint").toBe(true);

    // tag blocks
    await cb({ fromBlock: "latest", toBlock: "pending" });
    const secondCall = clientManager.client.getLogs.mock.calls.at(-1)![0];
    expect(secondCall.fromBlock === "latest").toBe(true);
    expect(secondCall.toBlock === "pending").toBe(true);
  });
});


