#!/bin/bash

# Version management script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}📋 Current version: $CURRENT_VERSION${NC}"

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [patch|minor|major|show]${NC}"
    echo -e "${YELLOW}  patch  - Bump patch version (1.0.0 -> 1.0.1)${NC}"
    echo -e "${YELLOW}  minor  - Bump minor version (1.0.0 -> 1.1.0)${NC}"
    echo -e "${YELLOW}  major  - Bump major version (1.0.0 -> 2.0.0)${NC}"
    echo -e "${YELLOW}  show   - Show current version${NC}"
    echo -e "${YELLOW}  help   - Show this help message${NC}"
}

# Function to bump version
bump_version() {
    local bump_type=$1
    
    echo -e "${YELLOW}🔄 Bumping $bump_type version...${NC}"
    
    # Bump version using npm
    NEW_VERSION=$(npm version $bump_type --no-git-tag-version)
    NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix
    
    echo -e "${GREEN}✅ Version bumped to: $NEW_VERSION${NC}"
    
    # Show what changed
    echo -e "${BLUE}📝 Changes in package.json:${NC}"
    git diff package.json
    
    echo -e "${YELLOW}💡 To commit and tag this version:${NC}"
    echo -e "  git add package.json package-lock.json"
    echo -e "  git commit -m \"Bump version to $NEW_VERSION\""
    echo -e "  git tag v$NEW_VERSION"
    echo -e "  git push origin main"
    echo -e "  git push origin v$NEW_VERSION"
}

# Main script logic
case "${1:-help}" in
    patch|minor|major)
        bump_version $1
        ;;
    show)
        echo -e "${GREEN}Current version: $CURRENT_VERSION${NC}"
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Invalid option: $1${NC}"
        show_usage
        exit 1
        ;;
esac 