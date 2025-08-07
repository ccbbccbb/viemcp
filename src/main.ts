#!/usr/bin/env node

import "dotenv/config";
import { startServer } from "./server.js";

// Start the MCP server
startServer().catch((error) => {
  console.error("Failed to start viemcp server:", error);
  process.exit(1);
});