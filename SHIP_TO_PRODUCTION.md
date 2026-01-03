# Ship to Production Workflow

## Overview

The `npm run ship` command provides a comprehensive, automated workflow for shipping changes to production. It runs all necessary checks, ensures code quality, and handles the commit and push process.

---

## Quick Start

```bash
# Make your changes
# Then run:
npm run ship
```

The script will guide you through the process, running all checks and prompting for input when needed.

---

## What It Does

The ship script runs **8 comprehensive steps**:

### 1. Working Directory Check ✅
- Verifies there are uncommitted changes to ship
- Exits if working directory is clean (nothing to commit)

### 2. Code Formatting 💅
- Runs Prettier on all TypeScript, JavaScript, CSS, and Markdown files
- Automatically formats code to match project style
- **Auto-fixes**: Yes

### 3. Linting 🔍
- Runs ESLint on all source files
- Checks for code quality issues, unused variables, etc.
- **Exits on failure**: Yes
- **Fix command**: `npm run lint --fix` (for auto-fixable issues)

### 4. Type Checking 📐
- Runs TypeScript compiler in check mode
- Verifies all types are correct
- **Exits on failure**: Yes
- **Fix**: Resolve TypeScript errors manually

### 5. Tests 🧪
- Runs Jest unit tests
- Runs all test suites
- **Exits on failure**: Yes
- **Fix**: Debug and fix failing tests

### 6. Production Build 🏗️
- Runs `npm run build` to verify production build works
- Ensures there are no build-time errors
- **Exits on failure**: Yes
- **Fix**: Resolve build errors (often import/export issues)

### 7. Documentation Review 📚
- **Interactive prompt** asking you to confirm:
  - README.md updated (if needed)
  - New components documented
  - New scripts documented
  - Environment variables documented
- **Manual step**: Requires your confirmation

### 8. Commit and Push 📝
- Shows all changed files
- Prompts for commit message
- Automatically adds co-author footer
- Commits changes
- Pushes to origin/main

---

## Usage Examples

### Standard Workflow

```bash
# 1. Make your changes
vim src/components/MyComponent.tsx

# 2. Ship to production
npm run ship

# 3. Follow the prompts:
#    - Confirm documentation is updated
#    - Enter commit message
#    - Script handles the rest!
```

### What Happens on Failure

If any step fails, the script exits immediately:

```bash
npm run ship

# Output:
🚢 Starting ship to production checks...
📋 Step 1/8: Checking working directory status...
✓ Changes detected, ready to commit

💅 Step 2/8: Running code formatter...
✓ Code formatted

🔍 Step 3/8: Running linter...
✗ Linting failed
Fix linting errors before shipping

# Script exits, you fix the errors, then run again
```

---

## Commit Message Format

The script automatically adds a footer to your commit message:

```
Your commit message here

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Common Issues

### Issue: "No changes to commit"

**Cause**: Working directory is clean (no uncommitted changes)

**Solution**: Make some changes first, or if you already committed, just run `git push`

---

### Issue: Linting fails

**Cause**: ESLint found code quality issues

**Solutions**:
```bash
# See what's wrong
npm run lint

# Auto-fix what can be fixed
npx eslint . --fix

# Then run ship again
npm run ship
```

---

### Issue: Type checking fails

**Cause**: TypeScript found type errors

**Solutions**:
```bash
# See all type errors
npm run type-check

# Fix them manually
# Then run ship again
npm run ship
```

---

### Issue: Tests fail

**Cause**: Jest tests are failing

**Solutions**:
```bash
# Run tests to see failures
npm test

# Run tests in watch mode for development
npm run test:watch

# Fix the failing tests
# Then run ship again
npm run ship
```

---

### Issue: Build fails

**Cause**: Production build has errors

**Solutions**:
```bash
# Run build to see errors
npm run build

# Common causes:
# - Missing imports
# - Type errors in production mode
# - Environment variable issues

# Fix the errors
# Then run ship again
npm run ship
```

---

### Issue: Push fails

**Cause**: Remote has changes you don't have locally

**Solutions**:
```bash
# Pull latest changes
git pull --rebase

# Resolve any conflicts
# Then push manually
git push
```

---

## Best Practices

### Before Running `npm run ship`

1. **Test locally first**
   ```bash
   npm run dev
   # Test your changes in the browser
   ```

2. **Run checks individually** (optional)
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Review your changes**
   ```bash
   git status
   git diff
   ```

### Documentation Updates

Always update documentation when you:
- Add new components → Update component documentation
- Add new scripts → Update this file or package.json comments
- Change environment variables → Update .env.example and README
- Add new features → Update README feature list
- Change API routes → Update API documentation

### Commit Messages

Write clear, descriptive commit messages:

**Good**:
- "Add ActionBar component and refactor EventDetail"
- "Fix LocationModal tests to match current implementation"
- "Update Saturday/Sunday carousels to prioritize current day events"

**Bad**:
- "fixes"
- "update"
- "wip"

---

## Skipping Steps (Advanced)

If you need to skip certain checks (not recommended), you can modify the script or run commands individually:

```bash
# Skip ship script entirely
git add -A
git commit -m "Your message"
git push

# Run individual checks
npm run format
npm run lint
npm run type-check
npm test
npm run build
```

---

## Script Location

- **Script**: `scripts/ship.sh`
- **NPM command**: `npm run ship`
- **Configuration**: `package.json` scripts section

---

## Customization

To modify the ship script, edit `scripts/ship.sh`:

```bash
vim scripts/ship.sh
```

Common customizations:
- Skip certain steps (comment out sections)
- Add additional checks
- Change commit message format
- Add notifications (Slack, email, etc.)

---

## CI/CD Integration

This script mirrors what runs in CI:
- GitHub Actions run the same checks on every push
- If `npm run ship` passes locally, CI should pass too
- Reduces failed CI runs

---

## Quick Reference

```bash
# Full workflow
npm run ship

# Individual steps (for debugging)
npm run format          # Step 2
npm run lint            # Step 3
npm run type-check      # Step 4
npm test                # Step 5
npm run build           # Step 6

# Manual commit/push (skip ship script)
git add -A
git commit -m "message"
git push
```

---

**Last Updated**: January 2026
