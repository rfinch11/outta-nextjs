#!/bin/bash

# Ship to Production Script
# Runs comprehensive checks before committing and pushing to production

set -e  # Exit on any error

echo "🚢 Starting ship to production checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check for uncommitted changes
echo -e "${BLUE}📋 Step 1/8: Checking working directory status...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${GREEN}✓ Changes detected, ready to commit${NC}"
else
  echo -e "${RED}✗ No changes to commit${NC}"
  exit 1
fi
echo ""

# Step 2: Run formatter
echo -e "${BLUE}💅 Step 2/8: Running code formatter...${NC}"
if command -v prettier &> /dev/null; then
  npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,md}" || {
    echo -e "${RED}✗ Formatting failed${NC}"
    exit 1
  }
  echo -e "${GREEN}✓ Code formatted${NC}"
else
  echo -e "${YELLOW}⚠ Prettier not found, skipping formatting${NC}"
fi
echo ""

# Step 3: Run linting
echo -e "${BLUE}🔍 Step 3/8: Running linter...${NC}"
npm run lint || {
  echo -e "${RED}✗ Linting failed${NC}"
  echo -e "${YELLOW}Fix linting errors before shipping${NC}"
  exit 1
}
echo -e "${GREEN}✓ Linting passed${NC}"
echo ""

# Step 4: Run type checking
echo -e "${BLUE}📐 Step 4/8: Running type checker...${NC}"
npm run type-check || {
  echo -e "${RED}✗ Type checking failed${NC}"
  echo -e "${YELLOW}Fix type errors before shipping${NC}"
  exit 1
}
echo -e "${GREEN}✓ Type checking passed${NC}"
echo ""

# Step 5: Run tests
echo -e "${BLUE}🧪 Step 5/8: Running tests...${NC}"
npm test -- --passWithNoTests || {
  echo -e "${RED}✗ Tests failed${NC}"
  echo -e "${YELLOW}Fix failing tests before shipping${NC}"
  exit 1
}
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

# Step 6: Run build
echo -e "${BLUE}🏗️  Step 6/8: Running production build...${NC}"
npm run build || {
  echo -e "${RED}✗ Build failed${NC}"
  echo -e "${YELLOW}Fix build errors before shipping${NC}"
  exit 1
}
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Step 7: Documentation check
echo -e "${BLUE}📚 Step 7/8: Checking documentation...${NC}"
echo -e "${YELLOW}Please review:${NC}"
echo "  - Does README.md need updating?"
echo "  - Are new components documented?"
echo "  - Are new scripts documented?"
echo "  - Are environment variables documented?"
echo ""
read -p "Have you updated all necessary documentation? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}✗ Please update documentation before shipping${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Documentation confirmed${NC}"
echo ""

# Step 8: Commit and push
echo -e "${BLUE}📝 Step 8/8: Preparing to commit and push...${NC}"
echo ""
echo -e "${YELLOW}Changed files:${NC}"
git status -s
echo ""

# Get commit message
echo -e "${BLUE}Enter commit message:${NC}"
read -e commit_message

if [[ -z "$commit_message" ]]; then
  echo -e "${RED}✗ Commit message cannot be empty${NC}"
  exit 1
fi

# Add co-author footer
commit_message_with_footer="$commit_message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Stage all changes
git add -A

# Commit
echo ""
echo -e "${BLUE}Committing changes...${NC}"
git commit -m "$commit_message_with_footer" || {
  echo -e "${RED}✗ Commit failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Changes committed${NC}"

# Push
echo ""
echo -e "${BLUE}Pushing to production...${NC}"
git push || {
  echo -e "${RED}✗ Push failed${NC}"
  echo -e "${YELLOW}You may need to pull first or resolve conflicts${NC}"
  exit 1
}
echo -e "${GREEN}✓ Pushed to production${NC}"

echo ""
echo -e "${GREEN}🎉 Successfully shipped to production!${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  ✓ Code formatted"
echo "  ✓ Linting passed"
echo "  ✓ Type checking passed"
echo "  ✓ Tests passed"
echo "  ✓ Build successful"
echo "  ✓ Documentation updated"
echo "  ✓ Changes committed and pushed"
echo ""
