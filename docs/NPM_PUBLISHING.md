# npm Publishing Pipeline

This document explains the automated npm publishing pipeline for the `infra-cost` CLI tool.

## Overview

The npm publishing pipeline provides multiple ways to publish packages to npm with automated version management, testing, and quality checks.

### Publishing Methods

1. **Automated Tag-based Publishing**: Push a git tag to trigger automated publishing
2. **Manual Workflow Publishing**: Use GitHub Actions UI for controlled publishing
3. **Local Publishing**: Use npm scripts for manual publishing from local machine

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggered by**: Push to main/develop, Pull Requests

**Features**:
- Multi-Node.js version testing (16, 18, 20)
- TypeScript compilation and type checking
- Package validation and security auditing
- CLI functionality testing
- Publish dry-run for PRs

### 2. npm Publish Workflow (`.github/workflows/npm-publish.yml`)

**Triggered by**:
- Git tags starting with `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

**Features**:
- Automatic version detection from tags
- Manual version bumping for workflow dispatch
- Pre-release detection and tagging
- Duplicate version checking
- Dry-run support
- GitHub release creation
- Comprehensive publishing summary

## Version Management

### Using the Version Manager Script

The `scripts/version-manager.js` script provides comprehensive version management:

```bash
# Check current version status
npm run version:check

# Show what next version would be
npm run version:next patch
npm run version:next minor
npm run version:next major
npm run version:next prerelease

# Bump version automatically
npm run version:bump:patch     # 1.0.0 -> 1.0.1
npm run version:bump:minor     # 1.0.0 -> 1.1.0
npm run version:bump:major     # 1.0.0 -> 2.0.0
npm run version:bump:prerelease # 1.0.0 -> 1.0.1-beta.0

# Set specific version
npm run version:set 1.2.3
```

### Version Types

- **patch**: Bug fixes and small changes
- **minor**: New features, backward compatible
- **major**: Breaking changes
- **prerelease**: Beta/alpha releases

## Publishing Methods

### Method 1: Automated Tag Publishing (Recommended)

```bash
# 1. Bump version
npm run version:bump:patch

# 2. Commit changes
git add package.json package-lock.json
git commit -m "Bump version to $(node -e 'console.log(require("./package.json").version)')"

# 3. Create and push tag
VERSION=$(node -e 'console.log(require("./package.json").version)')
git tag "v${VERSION}"
git push origin main
git push origin "v${VERSION}"
```

This automatically:
- Runs tests and builds
- Creates GitHub release
- Publishes to npm with appropriate tag
- Provides detailed summary

### Method 2: Manual Workflow Dispatch

1. Go to GitHub Actions → "Publish to npm" workflow
2. Click "Run workflow"
3. Select options:
   - **Version type**: patch/minor/major/prerelease
   - **npm tag**: latest/beta/alpha/etc.
   - **Dry run**: Test without publishing

### Method 3: Local Publishing

```bash
# Test the publish process
npm run publish:dry

# Publish beta version
npm run publish:beta

# Publish stable version
npm run publish:latest
```

## npm Tags

- **latest**: Stable releases (default install)
- **beta**: Pre-release/beta versions
- **alpha**: Early development versions

Users install specific tags:
```bash
npm install infra-cost          # latest
npm install infra-cost@beta     # beta
npm install infra-cost@alpha    # alpha
```

## Quality Checks

All publishing methods include:

### Automated Tests
- TypeScript compilation
- Package validation
- CLI functionality tests
- Security audit
- Multi-Node.js version compatibility

### Package Validation
- Required package.json fields
- Binary paths existence
- Package size analysis
- Dependency audit

### Publishing Safeguards
- Duplicate version detection
- Git clean state validation
- Dry-run testing capability

## Setup Requirements

### Repository Secrets

Add these secrets to your GitHub repository:

```bash
# Required for publishing
gh secret set NPM_TOKEN --body "your-npm-token"
```

### NPM Token Setup

1. Log in to npm: `npm login`
2. Create automation token: `npm token create --type=automation`
3. Add token to GitHub secrets

## Usage Examples

### Publishing a Patch Release

```bash
# Automatic method
npm run version:bump:patch
git add . && git commit -m "Release v$(node -pe 'require("./package.json").version')"
git tag "v$(node -pe 'require("./package.json").version')"
git push origin main --tags
```

### Publishing a Beta Release

```bash
# Manual workflow method
# 1. Go to GitHub Actions → "Publish to npm"
# 2. Run workflow with:
#    - Version type: prerelease
#    - npm tag: beta
#    - Dry run: false
```

### Testing Before Publishing

```bash
# Local dry run
npm run publish:dry

# GitHub workflow dry run
# Use workflow dispatch with dry_run: true
```

## Monitoring

### Check Published Versions
```bash
npm view infra-cost versions --json
npm view infra-cost dist-tags
```

### Package Information
```bash
npm view infra-cost
npm info infra-cost
```

### Download Statistics
```bash
npm view infra-cost --json | jq '.time'
```

## Troubleshooting

### Common Issues

**"Version already exists"**
- Check existing versions: `npm view infra-cost versions`
- Bump to next available version
- Use version manager to validate: `npm run version:check`

**"Authentication failed"**
- Verify NPM_TOKEN secret is set correctly
- Ensure token has publish permissions
- Token might be expired - regenerate

**"Package validation failed"**
- Run local tests: `npm run typecheck && npm run build`
- Check package.json required fields
- Validate bin paths exist

**"Git not clean"**
- Commit or stash changes: `git status`
- Version manager requires clean state

### Getting Help

1. Check workflow logs in GitHub Actions
2. Test locally with dry-run: `npm run publish:dry`
3. Validate version: `npm run version:check`
4. Review package contents: `npm pack --dry-run`

## Migration from Manual Publishing

If migrating from manual publishing:

1. Ensure NPM_TOKEN is set in GitHub secrets
2. Run `npm run version:check` to validate current state
3. Use tag-based publishing for consistent releases
4. Set up branch protection rules for main branch

## Advanced Usage

### Custom npm Tags

```bash
# Publish to custom tag
npm publish --tag custom-tag

# Install from custom tag
npm install infra-cost@custom-tag
```

### Version Validation

```bash
# Check if version exists before bumping
node scripts/version-manager.js next patch
```

### Automated Release Notes

The workflow automatically generates release notes from:
- Commit messages since last tag
- Pull request titles
- GitHub's automated release notes

For better release notes, use conventional commits:
```
feat: add new cost analysis feature
fix: resolve authentication issue
docs: update installation instructions
```