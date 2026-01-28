# Homebrew Publishing Setup

This document explains how to set up and maintain Homebrew publishing for the `infra-cost` CLI tool.

## Overview

The Homebrew publishing pipeline consists of:

1. **GitHub Actions Release Workflow** (`.github/workflows/release.yml`)
   - Triggered when a git tag starting with `v` is pushed
   - Builds the project and creates a GitHub release
   - Publishes to npm
   - Updates the Homebrew formula

2. **Homebrew Tap Repository** (`codecollab-co/homebrew-tap`)
   - Contains the Homebrew formula for `infra-cost`
   - Automatically updated by the release workflow

3. **Release Preparation Script** (`scripts/prepare-release.sh`)
   - Helper script to prepare new releases
   - Updates versions, runs tests, creates tags

## Initial Setup

### 1. Create Homebrew Tap Repository

The Homebrew tap repository needs to be created once. You can either:

**Option A: Manual Creation**
```bash
# Create the repository on GitHub
gh repo create codecollab-co/homebrew-tap \
  --description "Homebrew formulas for Code Collab tools" \
  --public
```

**Option B: Automated Creation**
```bash
# Run the setup workflow
gh workflow run homebrew-tap-setup.yml \
  --field create_tap_repo=true
```

### 2. Configure Secrets

Add these secrets to your GitHub repository:

- `NPM_TOKEN`: Token for publishing to npm registry
- `HOMEBREW_TOKEN`: GitHub token with write access to the homebrew tap repo

```bash
# Set NPM token
gh secret set NPM_TOKEN --body "your-npm-token"

# Set Homebrew token (can be the same as GITHUB_TOKEN if you have permissions)
gh secret set HOMEBREW_TOKEN --body "your-github-token"
```

## Creating a Release

### Using the Automated Script

```bash
# Run the release preparation script
npm run prepare-release

# Or directly:
./scripts/prepare-release.sh
```

The script will:
1. Prompt for the new version
2. Update `package.json` and Homebrew formula
3. Run tests and build
4. Create and push a git tag
5. Trigger the release workflow

### Manual Release Process

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Push tag
git push origin main
git push origin v$(node -e "console.log(require('./package.json').version)")
```

## Release Workflow

When a tag is pushed, the workflow automatically:

1. **Build & Test**
   - Installs dependencies
   - Runs TypeScript checks
   - Builds the project

2. **Create GitHub Release**
   - Generates changelog from commits
   - Creates release with built assets
   - Marks pre-releases appropriately

3. **Publish to npm**
   - Publishes stable releases to `latest` tag
   - Publishes pre-releases to `beta` tag

4. **Update Homebrew**
   - Updates formula in the tap repository
   - Only for stable releases (not pre-releases)

## Installation for Users

Once published, users can install via Homebrew:

```bash
# Add the tap
brew tap codecollab-co/tap

# Install infra-cost
brew install infra-cost

# Or install directly
brew install codecollab-co/tap/infra-cost
```

## Troubleshooting

### Formula Update Fails

If the Homebrew formula update fails:

1. Check the `HOMEBREW_TOKEN` secret has correct permissions
2. Verify the tap repository exists and is accessible
3. Review the workflow logs for specific errors

### Build Fails

If the build fails during release:

1. Ensure all tests pass locally: `npm run typecheck`
2. Verify the build works: `npm run build`
3. Check for any missing dependencies

### Version Conflicts

If there are version conflicts:

1. Check if the tag already exists: `git tag -l`
2. Delete conflicting tag if needed: `git tag -d v1.0.0`
3. Ensure package.json version matches the intended release

## Formula Maintenance

The Homebrew formula (`homebrew/infra-cost.rb`) is automatically updated by the release workflow. Manual updates may be needed for:

- Dependency changes
- Build process changes
- Test improvements

## Testing the Formula

To test the Homebrew formula locally:

```bash
# Install from local formula
brew install --build-from-source ./homebrew/infra-cost.rb

# Test the installation
aws-cost --help

# Uninstall
brew uninstall infra-cost
```

## Monitoring

Monitor releases at:
- GitHub Actions: `https://github.com/codecollab-co/infra-cost/actions`
- GitHub Releases: `https://github.com/codecollab-co/infra-cost/releases`
- npm Package: `https://www.npmjs.com/package/infra-cost`