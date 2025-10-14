#!/bin/bash

# Release preparation script for infra-cost
# This script helps prepare a new release by updating versions and creating tags

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d ".git" ]]; then
    print_error "This script must be run from the root of the infra-cost repository"
    exit 1
fi

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    print_error "Git working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
print_status "Current version: $CURRENT_VERSION"

# Ask for new version
echo ""
echo "Please enter the new version (without 'v' prefix):"
echo "Examples: 0.1.1, 0.2.0, 1.0.0-beta.1"
read -r NEW_VERSION

# Validate version format
if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    print_error "Invalid version format. Please use semantic versioning (e.g., 0.1.1)"
    exit 1
fi

print_status "New version will be: $NEW_VERSION"

# Confirm
echo ""
echo "This will:"
echo "  1. Update package.json version to $NEW_VERSION"
echo "  2. Update Homebrew formula version"
echo "  3. Run tests and build"
echo "  4. Create git tag v$NEW_VERSION"
echo "  5. Push tag to trigger release workflow"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Release cancelled"
    exit 0
fi

# Update package.json version
print_status "Updating package.json version..."
npm version $NEW_VERSION --no-git-tag-version

# Update Homebrew formula version (placeholder - will be updated by automated workflow)
if [[ -f "homebrew/infra-cost.rb" ]]; then
    print_status "Updating Homebrew formula..."
    sed -i.bak "s/v[0-9]\+\.[0-9]\+\.[0-9]\+\(-[a-zA-Z0-9.-]\+\)\?/v$NEW_VERSION/g" homebrew/infra-cost.rb
    rm homebrew/infra-cost.rb.bak
fi

# Run tests
print_status "Running tests..."
if ! npm run typecheck; then
    print_error "Tests failed. Please fix issues before releasing."
    exit 1
fi

# Build project
print_status "Building project..."
if ! npm run build; then
    print_error "Build failed. Please fix issues before releasing."
    exit 1
fi

# Commit changes
print_status "Committing version changes..."
git add package.json homebrew/infra-cost.rb
git commit -m "Bump version to $NEW_VERSION"

# Create and push tag
print_status "Creating git tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

print_status "Pushing changes and tag to remote..."
git push origin main
git push origin "v$NEW_VERSION"

print_success "Release v$NEW_VERSION has been prepared and pushed!"
print_status "The GitHub Actions workflow will now:"
print_status "  - Create a GitHub release"
print_status "  - Build and upload release assets"
print_status "  - Publish to npm"
print_status "  - Update Homebrew formula"
print_status ""
print_status "You can monitor the progress at:"
print_status "https://github.com/codecollab-co/infra-cost/actions"