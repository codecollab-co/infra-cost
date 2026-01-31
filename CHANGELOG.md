# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] - 2026-01-31

### Features - Advanced Cost Analysis Commands

**Cost Forecasting** (`cost forecast`):
- **Multiple forecasting models**: Linear, exponential, seasonal, and auto-select
- **Confidence intervals**: Support for 80%, 90%, and 95% confidence levels
- **Multi-month predictions**: Forecast 1-12 months into the future
- **Trend analysis**: Automatic trend detection with percentage change calculations
- **Intelligent recommendations**: Context-aware suggestions based on forecast trends
- **Statistical accuracy**: Linear regression with standard error calculations
- **Seasonal patterns**: Detects and applies weekly seasonality patterns
- **Exponential growth**: Handles accelerating cost patterns with log-space regression
- **Comprehensive output**: Summary, monthly breakdown, trend analysis, and recommendations

**Multi-Cloud Cost Comparison** (`cost compare`):
- **Cross-cloud analysis**: Compare costs across AWS, GCP, Azure, Oracle, Alibaba Cloud
- **Service-level comparison**: Side-by-side service cost breakdown
- **Provider rankings**: Automatic ranking by total cost with percentage distribution
- **Top services analysis**: Identify most expensive services per provider
- **Common services detection**: Find services running across multiple clouds
- **Savings opportunities**: Calculate potential savings from migration
- **Vendor lock-in analysis**: Alert when single provider exceeds 60% of costs
- **Optimization recommendations**: Actionable suggestions for cost reduction

**Cost Trends Analysis** (`cost trends`):
- **Flexible time periods**: 7d, 30d, 90d, 12m analysis windows
- **Multiple granularities**: Daily, weekly, or monthly aggregation
- **Service-specific trends**: Analyze individual service cost patterns
- **ASCII visualization**: Terminal-based cost trend charts with color coding
- **Volatility detection**: Statistical analysis of cost variance
- **Change detection**: Identify increasing, decreasing, and stable trends
- **Percentage changes**: Calculate and display period-over-period changes
- **Actionable insights**: Services with biggest cost changes highlighted

### Technical Implementation

**New Core Modules**:
- `src/core/forecasting/forecaster.ts` - Complete forecasting engine with statistical models
  - Linear regression with confidence intervals
  - Exponential growth modeling
  - Seasonal pattern detection and application
  - Auto-model selection based on data characteristics
  - Z-score calculations for confidence levels

**Enhanced Command Handlers**:
- `src/cli/commands/cost/forecast.ts` - Full implementation (previously stub)
- `src/cli/commands/cost/compare.ts` - Full implementation (previously stub)
- `src/cli/commands/cost/trends.ts` - Full implementation (previously stub)

### User Experience

- **Rich terminal output**: Tables, charts, and colored text for clarity
- **Input validation**: Comprehensive parameter validation with helpful error messages
- **Progress indicators**: Clear feedback during data fetching
- **Graceful degradation**: Handles partial data and provider failures
- **Detailed documentation**: In-line help and guidance for all options

### Distribution

- **npm**: Published to npm registry as `infra-cost@1.11.0`
- **Homebrew**: Updated tap formula to v1.11.0 (codecollab-co/tap)
- **GitHub Releases**: Full release notes for v1.10.0 and v1.11.0

## [1.10.0] - 2026-01-31

### Security Fixes - Critical
- **CORS Security**: Changed default CORS origins from `['*']` to `['http://localhost:3000', 'http://127.0.0.1:3000']` - restricts API access to local only
- **Authentication**: Changed default auth from `type: 'none'` to `type: 'api-key'` - requires authentication by default
- **API Key Handling**: Removed insecure query parameter authentication, now only accepts `X-API-Key` header
- **Port Validation**: Added validation for port numbers (1-65535) with clear error messages
- **Input Validation**: Added validation for API parameters (days, cache TTL, etc.)

### Performance & Reliability Fixes
- **Memory Leak Fix - Webhook Manager**: Added automatic cleanup with 24-hour retention and 1000 item limit
- **Memory Leak Fix - API Server Cache**: Added cleanup timer running every minute to remove expired entries
- **Async File Operations**: Converted synchronous file operations to async in cache (won't block event loop)
- **AWS API Pagination**: Added proper `NextPageToken` pagination loop to handle large datasets
- **Graceful Shutdown**: Added proper cleanup methods for timers and maps on server stop

### Type Safety Improvements
- **GCP Config Types**: Replaced `credentials?: any` with proper `GCPServiceAccountCredentials` interface
- **Teams Integration Types**: Added `AdaptiveCard`, `AdaptiveCardElement`, and `AdaptiveCardAction` interfaces
- **AWS Budget Types**: Replaced `any` types with explicit budget interfaces for better type safety
- **Error Handling Utility**: Created `src/utils/error-handling.ts` with `getErrorMessage()`, `AppError`, and type guards

### User Experience Improvements
- **Unimplemented Commands**: Updated `cost forecast`, `cost compare`, and `cost trends` commands with helpful guidance
- **Clear Error Messages**: All commands now show what the feature will provide and suggest alternatives
- **Better Validation Messages**: Improved error messages for invalid inputs with actionable guidance

### Bug Fixes
- **JSON Parsing**: Added try-catch for server config loading with fallback to defaults
- **NaN Validation**: Added checks for all `parseInt()` and `parseFloat()` operations
- **Error Type Checking**: Fixed `error.message` access throughout codebase with proper type guards

### Testing
- **Test Suite Results**: 380 tests passing, maintaining 93% success rate
- **Mock Files**: Created comprehensive mocks for GCP, Azure, Oracle Cloud, and Alibaba Cloud providers

### Documentation
- **Security Best Practices**: Updated server defaults to follow security best practices
- **Configuration Guide**: Added documentation for secure server configuration

## [1.1.0] - 2026-01-30

### Added - Google Cloud Platform Integration

#### GCP Provider (Issue #66)
- **Complete GCP cost analysis support** with BigQuery billing export integration
- **Authentication methods**: Service account key files and Application Default Credentials (ADC)
- **Cost data retrieval**: Historical and real-time cost breakdown by service and time period
- **Multi-currency support**: Automatic detection and aggregation with two-pass algorithm
- **Date range filtering**: Configurable time periods for cost queries
- **Pagination support**: Efficient handling of large billing datasets

#### Resource Inventory Discovery
- **GCE Instances**: VM discovery across all zones with network and disk details
- **Cloud Storage Buckets**: Bucket metadata with encryption and versioning info
- **Cloud SQL Instances**: Database discovery with backup configuration
- **GKE Clusters**: Kubernetes cluster discovery with node pool details
- **Parallel discovery**: Simultaneous resource fetching across zones for performance
- **Filtering capabilities**: By region, tags, and resource state
- **Graceful error handling**: Continue on zone-level failures

#### Budget Management
- **Budget fetching**: Integration with Cloud Billing Budgets API
- **Current spend tracking**: Real-time comparison against budget amounts
- **Threshold breach detection**: Automatic alert generation
- **Severity classification**: Low, medium, high, critical alert levels
- **Alert sorting**: Prioritized by severity and percentage used
- **Custom period support**: Monthly, quarterly, yearly, and custom date ranges

#### Multi-Project & Organization Support
- **All-projects mode**: Aggregate costs across all accessible projects
- **Specific project IDs**: Analyze selected projects
- **Per-project breakdown**: Individual project cost details with aggregated totals
- **Parallel processing**: Efficient multi-project cost fetching
- **Organization-wide aggregation**: All projects within a GCP organization
- **Folder-level costs**: Aggregate by organizational folders
- **Hierarchy visualization**: Organization → Folders → Projects structure
- **Graceful failures**: Continue processing on individual project errors

#### Configuration & CLI
- **Flexible configuration**: Support for all authentication and aggregation modes
- **Command-line flags**: Easy switching between single/multi-project modes
- **Environment variables**: GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_PROJECT_ID
- **Configuration file**: JSON-based config with all GCP options
- **Multiple config modes**: allProjects, projectIds, organizationId, folderId

#### Documentation
- **Comprehensive setup guide**: docs/GCP_SETUP.md (600+ lines)
- **8 real-world examples**: Single project, multi-project, organization, CI/CD
- **Authentication guide**: All methods with step-by-step instructions
- **BigQuery setup**: Complete billing export configuration guide
- **Troubleshooting**: Common issues and solutions
- **Best practices**: 10 recommendations for GCP cost management
- **CI/CD integration**: GitHub Actions and GitLab CI examples
- **Automation scripts**: Daily reporting and Slack integration

#### Testing
- **65 comprehensive tests**: Complete GCP provider coverage
- **7 test suites**: Provider, project, config, cost, inventory, budget, multi-project
- **Unit test coverage**: All major functions and edge cases
- **Mock-based testing**: No external dependencies required
- **Error scenario testing**: Graceful failure handling verification

### Technical Implementation

#### New Modules
- `src/providers/gcp/provider.ts` - Main GCP provider implementation
- `src/providers/gcp/config.ts` - Authentication and configuration
- `src/providers/gcp/project.ts` - Project management and multi-project support
- `src/providers/gcp/cost.ts` - Cost data retrieval and aggregation
- `src/providers/gcp/inventory.ts` - Resource discovery (4 types)
- `src/providers/gcp/budget.ts` - Budget tracking and alerts
- `src/providers/gcp/multi-project.ts` - Multi-project and organization aggregation

#### Dependencies Added
- `@google-cloud/bigquery` - Cost data queries
- `@google-cloud/billing` - Billing API integration
- `@google-cloud/compute` - GCE instance discovery
- `@google-cloud/storage` - Cloud Storage bucket discovery
- `@google-cloud/sql` - Cloud SQL instance discovery
- `@google-cloud/container` - GKE cluster discovery
- `@google-cloud/resource-manager` - Project and organization management
- `googleapis` - Resource Manager v3 API

#### Performance Optimizations
- Parallel resource discovery across zones
- Parallel multi-project cost fetching
- Efficient BigQuery query construction
- Two-pass algorithm for multi-currency handling
- Zone-level error isolation

### Statistics
- **Lines of code**: ~3,500 (implementation + tests + documentation)
- **Test coverage**: 65 tests passing (100% for GCP modules)
- **Documentation**: 937 new lines across docs and README
- **Commits**: 9 feature commits
- **Development time**: 4 weeks (Week 1-4 of Q1 2026)

### Breaking Changes
None - GCP support is a new feature addition.

### Migration Guide
No migration needed - existing AWS functionality unchanged.

### Known Limitations
- BigQuery billing export required (setup takes 24-48 hours)
- Organization-level access requires Resource Manager permissions
- Some features require specific IAM permissions (documented)

## [0.3.3] - 2026-01-27

### Fixed

- NPM website caching issue fully resolved with fresh version publish
- Version 0.3.3 now displays correctly on npmjs.com website and version history
- All distribution channels (GitHub, NPM, Homebrew) fully synchronized

### Note

This release contains the same features as 0.3.1 and 0.3.2. Version 0.3.3 was published to definitively resolve persistent NPM CDN caching issues where the npmjs.com website was not displaying versions 0.3.2 correctly in the version history and was showing 0.2.4 in various locations.

## [0.3.2] - 2026-01-27

### Fixed

- NPM package caching issue resolved by republishing as new version
- Ensured all distribution channels (GitHub, NPM, Homebrew) are synchronized

### Note

This release contains the same features as 0.3.1. Version 0.3.1 was unpublished and republished as 0.3.2 to resolve NPM website caching issues where the package page was displaying outdated version information.

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

- [1.11.0 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v1.11.0)
- [1.11.0 on npm](https://www.npmjs.com/package/infra-cost/v/1.11.0)
- [1.10.0 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v1.10.0)
- [0.3.3 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v0.3.3)
- [0.3.3 on npm](https://www.npmjs.com/package/infra-cost/v/0.3.3)
- [0.3.2 on npm](https://www.npmjs.com/package/infra-cost/v/0.3.2)
- [0.3.1 on npm](https://www.npmjs.com/package/infra-cost/v/0.3.1) (unpublished)
- [0.3.0 on GitHub](https://github.com/codecollab-co/infra-cost/releases/tag/v0.3.0)

## Installation

```bash
# npm
npm install -g infra-cost@latest

# Homebrew
brew tap codecollab-co/tap
brew install infra-cost

# GitHub Action
- uses: codecollab-co/infra-cost@v1.11.0
```

## Documentation

For detailed documentation, visit: https://github.com/codecollab-co/infra-cost
