import * as chains from "viem/chains";

export function getRpcUrl(chainName: string): string | undefined {
  const provider = process.env["RPC_PROVIDER"] || "drpc";

  const envVariants = [
    chainName.toUpperCase(),
    chainName.toUpperCase().replace("-", "_"),
    chainName.toUpperCase().replace(" ", "_"),
    chainName.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, ""),
  ];

  for (const variant of envVariants) {
    const providerUrl = process.env[`${variant}_RPC_URL_${provider.toUpperCase()}`];
    if (providerUrl) {
      return providerUrl;
    }

    const genericUrl = process.env[`${variant}_RPC_URL`];
    if (genericUrl) {
      return genericUrl;
    }
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SUPPORTED_CHAINS: Record<string, any> = (() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapping: Record<string, any> = {};
  Object.entries(chains).forEach(([key, chain]) => {
    if (chain && typeof chain === "object" && "id" in chain && "name" in chain) {
      mapping[key] = chain;
      mapping[key.toLowerCase()] = chain;
      const kebab = key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
      if (kebab !== key.toLowerCase()) {
        mapping[kebab] = chain;
      }

      if (key === "mainnet") {
        mapping["ethereum"] = chain;
        mapping["eth"] = chain;
      }
      if (key === "bsc") {
        mapping["bnb"] = chain;
        mapping["binance"] = chain;
      }
      if (key === "avalanche") {
        mapping["avax"] = chain;
      }
      if (key === "arbitrum") {
        mapping["arb"] = chain;
      }
      if (key === "optimism") {
        mapping["op"] = chain;
      }
      if (key === "polygon") {
        mapping["matic"] = chain;
      }
      if (key === "fantom") {
        mapping["ftm"] = chain;
      }
      if (key === "klaytn") {
        mapping["kaia"] = chain;
      }
    }
  });
  return mapping;
})();


