# Changelog

All notable changes to this project will be documented in this file.

## [0.0.4] - 2025-01-08

### Changed
- Consolidated tool adoption completed: removed legacy single-purpose registrations in `src/index.ts` in favor of consolidated tools.
- Standardized validation for consolidated tools using Zod schemas in `src/core/validation.ts` and integrated across `src/core/tools/consolidated.ts`.
- Improved typing: reduced `as never`, added focused types, narrowed `unknown` and `Record<string, unknown>` where practical.
- Added inline comments/JSDoc describing each consolidated tool.

### Fixed
- Inspector confusion from legacy tools: ensure only consolidated + primitives are registered.

### Misc
- Bump server/package version to 0.0.4.

## [0.0.3] - 2025-01-08

### Added
- **Test Infrastructure**: Complete test suite using Vitest with 62+ passing tests
  - Unit tests for core modules (responses, chains, clientManager, validation)
  - Test coverage for validation schemas and error handling
  - CI-ready test configuration with coverage reporting

- **Zod Validation**: Comprehensive input validation system
  - Created `src/core/validation.ts` with 30+ Zod schemas for all tool inputs
  - Replaced inline validation with centralized schema validation
  - Better error messages with detailed validation failure information
  - Type-safe parameter parsing across all tools

- **Consolidated Tools**: Additional high-level tools for improved UX
  - `viemBlockInfo`: Combines block, transaction count, and full transaction queries
  - `viemTransactionInfo`: Combines transaction details, receipt, and logs
  - `viemAccountInfo`: Combines balance and nonce queries
  - `viemGasInfo`: Combines gas price and fee history
  - `viemEnsInfo`: Unified ENS resolution for names and addresses
  - `viemErc20Info`: Combines ERC20 metadata, balance, and allowance
  - `viemContractState`: Combines contract code and storage queries
  - `viemEncodeData`: Unified encoding for function calls and deployments
  - `viemContractAction`: Combines read, simulate, and gas estimation
  - `viemTransactionBuild`: Combines gas estimation and transaction preparation
  - `viemChainInfo`: Combines chain ID and supported chains list

### Changed
- **Version Synchronization**: Fixed version mismatch between package.json (0.0.2) and server
- **TypeScript Configuration**: Excluded test files from build to prevent strict null check issues
- **Build Process**: Tests now run separately from build process for better separation of concerns

### Fixed
- Version mismatch between package.json and server initialization
- Validation error handling with proper ZodError type checking
- Address validation to accept both checksummed and lowercase addresses
- Test file TypeScript strict mode compatibility

### Security
- All input validation now uses Zod schemas with proper error boundaries
- Enhanced address and hash validation with regex patterns
- Secure BigInt parsing for numeric values

## [0.0.1] - Initial Release

### Added
- Core MCP server implementation for blockchain interactions via viem
- Support for multiple EVM chains with dynamic resolution
- 36 blockchain interaction tools covering:
  - Basic queries (balance, block number, transactions)
  - Contract interactions (read, simulate, estimate gas)
  - ERC20 token operations
  - ENS resolution
  - Transaction preparation and encoding
  - Utility functions (address validation, unit conversion)
- GitHub-based viem documentation resources with caching
- Custom RPC URL configuration via environment variables
- Modular tool organization (public, ENS, consolidated)
- EVM-focused prompts for common blockchain tasks