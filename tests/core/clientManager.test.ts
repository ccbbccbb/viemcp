import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClientManager } from "../../src/core/clientManager";
import { registerChain } from "../../src/core/chains";
import { mainnet } from "viem/chains";

// Mock viem's createPublicClient
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      chain: mainnet,
      getBalance: vi.fn(),
      getBlockNumber: vi.fn(),
      getChainId: vi.fn().mockResolvedValue(1),
    })),
    http: vi.fn(() => "http-transport"),
  };
});

describe("ClientManager", () => {
  let clientManager: ClientManager;

  beforeEach(() => {
    clientManager = new ClientManager();
    vi.clearAllMocks();
  });

  describe("getClient", () => {
    it("should return mainnet client by default", () => {
      const client = clientManager.getClient();
      expect(client).toBeDefined();
      expect(client.chain).toBe(mainnet);
    });

    it('should return mainnet client for "mainnet" chain name', () => {
      const client = clientManager.getClient("mainnet");
      expect(client).toBeDefined();
      expect(client.chain).toBe(mainnet);
    });

    it("should return same client instance for same chain", () => {
      const client1 = clientManager.getClient("mainnet");
      const client2 = clientManager.getClient("mainnet");
      expect(client1).toBe(client2);
    });

    it("should return mainnet for ethereum alias", () => {
      const client = clientManager.getClient("ethereum");
      expect(client).toBeDefined();
      expect(client.chain).toBe(mainnet);
    });

    it("should throw error for unsupported chain", () => {
      expect(() => clientManager.getClient("unsupported-chain")).toThrow(
        "Unsupported chain: unsupported-chain"
      );
    });

    it("should use custom RPC URL when configured", () => {
      vi.stubEnv("MAINNET_RPC_URL", "https://custom.rpc.url");

      const client = clientManager.getClient("mainnet");
      expect(client).toBeDefined();
      // In a real test, we'd verify the transport was created with the custom URL
    });

    it("should log custom RPC usage to console.error", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("MAINNET_RPC_URL", "https://custom.rpc.url");

      clientManager.getClient("mainnet");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Using custom RPC for mainnet")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getSupportedChains", () => {
    it("should return list of supported chain names", () => {
      const chains = clientManager.getSupportedChains();
      expect(chains).toContain("mainnet");
      expect(chains).toContain("ethereum");
      expect(chains).toContain("eth");
    });

    it("should return array of strings", () => {
      const chains = clientManager.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      chains.forEach((chain) => {
        expect(typeof chain).toBe("string");
      });
    });
  });

  describe("client caching", () => {
    it("should cache clients by chain id", () => {
      const client1 = clientManager.getClient("mainnet");
      const client2 = clientManager.getClient("ethereum"); // Same chain, different alias
      expect(client1).toBe(client2);
    });

    it("should create new client for different chain", () => {
      // First register a custom chain
      const customChain = {
        id: 137,
        name: "polygon",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
      };
      registerChain(customChain as any);

      const mainnetClient = clientManager.getClient("mainnet");
      const polygonClient = clientManager.getClient("polygon");

      expect(mainnetClient).not.toBe(polygonClient);
    });
  });
});
