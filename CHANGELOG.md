# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-01-27

### Added - Sprint 2: Caching Layer

#### Smart Cache System
- **CostCacheManager** with configurable storage backends (file/memory)
- File-based caching in `~/.infra-cost/cache/` with secure permissions (0o700/0o600)
- Automatic TTL-based expiration (default: 4 hours)
- Cache key generation with provider, account, profile, region, and data type
- Cache statistics and monitoring

#### Cached Provider Wrapper
- Wraps CloudProviderAdapter transparently with automatic caching
- Optimized TTLs for different data types:
  - Account info: 24 hours
  - Cost data: 4 hours
  - Resource inventory: 1 hour
  - Budget alerts: 30 minutes
- Separate read/write cache flags for `--no-cache` support
- Stable cache key generation for consistent behavior

#### CLI Cache Management
- `--cache` / `--no-cache` flags for cache control
- `--refresh-cache` to force fresh data and invalidate stale entries
- `--clear-cache` to remove all cached data
- `--cache-stats` to show cache statistics and hit rates
- `--cache-ttl` to configure custom TTL (e.g., `--cache-ttl 2h`)
- `--cache-type` to select storage backend (file/memory)

#### Performance Improvements
- ~85% faster response times for cached data
- Reduced AWS API costs by avoiding redundant calls
- Better UX with instant responses for recent data
- CI/CD friendly with in-memory caching option

#### Security Enhancements
- Secure file permissions (0o700 for directories, 0o600 for files)
- Profile-based cache key isolation
- Provider-scoped cache keys to prevent cross-provider collisions

### Added - GitHub Marketplace Action

- Published official GitHub Action for CI/CD integration
- Automated cost analysis in pull requests and workflows
- Easy setup with pre-configured action from GitHub Marketplace

### Fixed

- Cache key collision with profile-based stable identifiers
- Cache writes bypassing `--no-cache` flag
- Insecure file permissions on cache directories and files
- Missing provider scope in cache keys causing cross-provider collisions
- External dependency management in build configuration

### Changed

- Improved cache invalidation on credential refresh
- Enhanced inventory filter serialization for consistent cache keys
- Updated tsup.config.ts with organized external dependencies

### Technical Details

**Closes**: #28 (Caching Layer Implementation)

**Files Changed**:
- Added: `src/cache/cost-cache.ts` (652 lines)
- Added: `src/cache/cached-provider.ts` (524 lines)
- Modified: `src/index.ts` (+70 lines)
- Modified: `tsup.config.ts` (+15 lines)

**Pull Requests**:
- #36: Sprint 2 - Caching Layer for Performance Optimization
- #64: GitHub Marketplace Action for CI/CD Integration

## [0.3.0] - 2026-01-25

### Added - Sprint 1

- Configuration management system
- Cost delta analysis
- SSO support for AWS authentication
- Multi-cloud cost analysis foundation
- Enhanced reporting and visualization

---

## Release Links

- [0.3.1 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v0.3.1)
- [0.3.1 on npm](https://www.npmjs.com/package/infra-cost/v/0.3.1)
- [0.3.0 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v0.3.0)

## Installation

```bash
# npm
npm install -g infra-cost@latest

# Homebrew
brew tap codecollab-co/tap
brew install infra-cost

# GitHub Action
- uses: codecollab-co/infra-cost@v0.3.1
```

## Documentation

For detailed documentation, visit: https://github.com/codecollab-co/infra-cost
