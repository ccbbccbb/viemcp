import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

mkdirSync("styles", { recursive: true });

// Exact upstream CSS from viem repo.
execSync(
  "curl -L https://raw.githubusercontent.com/wevm/viem/main/site/styles.css -o styles/viem-site.css",
  { stdio: "inherit" }
);

// Optional - for reference only, not imported.
execSync(
  "curl -L https://raw.githubusercontent.com/wevm/viem/main/site/vocs.config.tsx -o styles/vocs.config.tsx",
  { stdio: "inherit" }
);
