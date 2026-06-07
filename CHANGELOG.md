# Changelog

## [1.2.0] - 2026-06-08

- **Performance**: Added API client caching to avoid recreating clients on each request
- **Refactoring**: Consolidated provider registration using data-driven approach in extension.ts
- **Refactoring**: Added `createAuthManager()` factory function in baseAuth.ts
- **Type optimization**: Added const assertions to model arrays for better inference

## [1.1.0] - 2026-06-04

- Added new models to NVIDIA NIM provider:
  - **GLM-5.1** (`z-ai/glm-5.1`)
  - **DeepSeek V4 Flash** (`deepseek-ai/deepseek-v4-flash`)
  - **Kimi K2.6** (`moonshotai/kimi-k2.6`)
  - **MiniMax M2.7** (`minimaxai/minimax-m2.7`)
  - **Nemotron 3 Ultra 550B** (`nvidia/nemotron-3-ultra-550b-a55b`)
  - **Nemotron 3 Super 120B** (`nvidia/nemotron-3-super-120b-a12b`)
- Updated README documentation with the newly supported models.

## [1.0.0] - 2026-04-05

- Initial release
