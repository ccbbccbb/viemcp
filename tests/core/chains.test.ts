import { describe, it, expect, beforeEach, vi } from "vitest";
import { mainnet } from "viem/chains";
import {
  getRpcUrl,
  SUPPORTED_CHAINS,
  registerChain,
  getChainByName,
  findChainByIdLocal,
  loadCustomChainsFromEnv,
} from "../../src/core/chains";

describe("chains", () => {
  beforeEach(() => {
    // Reset environment variables
    vi.unstubAllEnvs();
  });

  describe("getRpcUrl", () => {
    it("should return provider-specific URL when available", () => {
      vi.stubEnv("RPC_PROVIDER", "infura");
      vi.stubEnv("MAINNET_RPC_URL_INFURA", "https://mainnet.infura.io/v3/key");

      const url = getRpcUrl("mainnet");
      expect(url).toBe("https://mainnet.infura.io/v3/key");
    });

    it("should return generic URL when provider-specific not available", () => {
      vi.stubEnv("MAINNET_RPC_URL", "https://eth.llamarpc.com");

      const url = getRpcUrl("mainnet");
      expect(url).toBe("https://eth.llamarpc.com");
    });

    it("should handle different case variations", () => {
      vi.stubEnv("ETHEREUM_RPC_URL", "https://eth.example.com");

      const url = getRpcUrl("ethereum");
      expect(url).toBe("https://eth.example.com");
    });

    it("should return undefined when no URL is configured", () => {
      const url = getRpcUrl("polygon");
      expect(url).toBeUndefined();
    });

    it("should default to drpc provider", () => {
      vi.stubEnv("MAINNET_RPC_URL_DRPC", "https://drpc.example.com");

      const url = getRpcUrl("mainnet");
      expect(url).toBe("https://drpc.example.com");
    });
  });

  describe("SUPPORTED_CHAINS", () => {
    it("should have mainnet aliases", () => {
      expect(SUPPORTED_CHAINS["mainnet"]).toBe(mainnet);
      expect(SUPPORTED_CHAINS["ethereum"]).toBe(mainnet);
      expect(SUPPORTED_CHAINS["eth"]).toBe(mainnet);
    });

    it("should all reference the same mainnet chain", () => {
      expect(SUPPORTED_CHAINS["mainnet"]).toBe(SUPPORTED_CHAINS["ethereum"]);
      expect(SUPPORTED_CHAINS["ethereum"]).toBe(SUPPORTED_CHAINS["eth"]);
    });
  });

  describe("registerChain", () => {
    it("should register a chain with its name", () => {
      const customChain = {
        id: 137,
        name: "Polygon",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
      } as any;

      registerChain(customChain);

      expect(SUPPORTED_CHAINS["Polygon"]).toBe(customChain);
      expect(SUPPORTED_CHAINS["polygon"]).toBe(customChain);
    });

    it("should register with custom aliases", () => {
      const customChain = {
        id: 42161,
        name: "Arbitrum One",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
      } as any;

      registerChain(customChain, ["arb", "arbitrum"]);

      expect(SUPPORTED_CHAINS["arb"]).toBe(customChain);
      expect(SUPPORTED_CHAINS["arbitrum"]).toBe(customChain);
      expect(SUPPORTED_CHAINS["arbitrum-one"]).toBe(customChain);
    });
  });

  describe("getChainByName", () => {
    it("should return chain for exact name match", () => {
      const chain = getChainByName("mainnet");
      expect(chain).toBe(mainnet);
    });

    it("should return chain for case-insensitive match", () => {
      const chain = getChainByName("MAINNET");
      expect(chain).toBe(mainnet);
    });

    it("should return undefined for unknown chain", () => {
      const chain = getChainByName("unknown-chain");
      expect(chain).toBeUndefined();
    });
  });

  describe("findChainByIdLocal", () => {
    it("should find mainnet by id", () => {
      const chain = findChainByIdLocal(1);
      expect(chain).toBe(mainnet);
    });

    it("should return undefined for unknown id", () => {
      const chain = findChainByIdLocal(99999);
      expect(chain).toBeUndefined();
    });
  });

  describe("loadCustomChainsFromEnv", () => {
    it("should load valid custom chains from environment", () => {
      const customChains = [
        {
          id: 31337,
          name: "LocalChain",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: ["http://localhost:8545"] } },
        },
      ];

      vi.stubEnv("VIEM_CUSTOM_CHAINS", JSON.stringify(customChains));

      loadCustomChainsFromEnv();

      expect(SUPPORTED_CHAINS["LocalChain"]).toBeDefined();
      expect(SUPPORTED_CHAINS["LocalChain"].id).toBe(31337);
    });

    it("should ignore invalid JSON", () => {
      vi.stubEnv("VIEM_CUSTOM_CHAINS", "invalid json");

      // Should not throw
      expect(() => loadCustomChainsFromEnv()).not.toThrow();
    });

    it("should ignore chains without required fields", () => {
      const invalidChains = [
        { name: "NoId" }, // Missing id
        { id: 123 }, // Missing name
        { id: 456, name: "Valid", nativeCurrency: {} },
      ];

      vi.stubEnv("VIEM_CUSTOM_CHAINS", JSON.stringify(invalidChains));

      loadCustomChainsFromEnv();

      expect(SUPPORTED_CHAINS["NoId"]).toBeUndefined();
      expect(SUPPORTED_CHAINS["Valid"]).toBeDefined();
    });

    it("should do nothing when env var not set", () => {
      const chainCount = Object.keys(SUPPORTED_CHAINS).length;

      loadCustomChainsFromEnv();

      expect(Object.keys(SUPPORTED_CHAINS).length).toBe(chainCount);
    });
  });
});
