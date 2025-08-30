#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version argument is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <version>"
    print_error "Example: $0 0.1.0"
    exit 1
fi

VERSION="$1"
TAG="v$VERSION"

print_status "Starting release process for version $VERSION"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    print_error "Working directory is not clean. Please commit or stash your changes."
    git status --porcelain
    exit 1
fi

# Check if we're on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    print_warning "You're not on main/master branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Release cancelled"
        exit 1
    fi
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    print_error "Tag $TAG already exists"
    exit 1
fi

# Update version in Cargo.toml
print_status "Updating version in Cargo.toml to $VERSION"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" Cargo.toml
else
    # Linux
    sed -i "s/^version = \".*\"/version = \"$VERSION\"/" Cargo.toml
fi

# Verify the change
if ! grep -q "version = \"$VERSION\"" Cargo.toml; then
    print_error "Failed to update version in Cargo.toml"
    exit 1
fi

# Run tests (if any)
print_status "Running cargo check..."
if ! cargo check; then
    print_error "cargo check failed"
    exit 1
fi

# Commit version bump
print_status "Committing version bump..."
git add Cargo.toml
git commit -m "Bump version to $VERSION"

# Create and push tag
print_status "Creating and pushing tag $TAG..."
git tag -a "$TAG" -m "Release $VERSION"

# Push changes and tag
print_status "Pushing changes to remote..."
git push origin "$CURRENT_BRANCH"
git push origin "$TAG"

print_status "✓ Release $VERSION completed successfully!"
print_status "GitHub Actions will now build and create the release automatically."
print_status "Check: https://github.com/$(git config --get remote.origin.url | sed 's/.*://g' | sed 's/.git$//')/actions"
