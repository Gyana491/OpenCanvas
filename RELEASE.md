# 🚀 Release Process

This document explains how to create and publish releases for OpenCanvas.

## Table of Contents

- [Quick Start](#quick-start)
- [Release Commands](#release-commands)
- [Version Numbering](#version-numbering)
- [Step-by-Step Guide](#step-by-step-guide)
- [What Happens During Release](#what-happens-during-release)
- [Platform Builds](#platform-builds)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Quick Start

Creating a release is as simple as running one command:

```bash
# For bug fixes
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major
```

That's it! The rest is automated. ✨

---

## Release Commands

### Automated Version Bump + Release

| Command | Use Case | Example |
|---------|----------|---------|
| `npm run version:patch` | Bug fixes, minor improvements | 1.0.0 → 1.0.1 |
| `npm run version:minor` | New features (backwards compatible) | 1.0.0 → 1.1.0 |
| `npm run version:major` | Breaking changes | 1.0.0 → 2.0.0 |

Each command automatically:
- Updates `package.json` version
- Creates a git commit
- Creates and pushes a git tag
- Triggers GitHub Actions to build for all platforms

### Manual Version Control

If you've already manually updated the version in `package.json`:

```bash
npm run release
```

This creates and pushes a git tag based on the current version.

---

## Version Numbering

We follow [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

### When to Bump Each Number

**PATCH** (`npm run version:patch`)
- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring (no API changes)

**MINOR** (`npm run version:minor`)
- New features
- New APIs (backwards compatible)
- Deprecating functionality (not removing)

**MAJOR** (`npm run version:major`)
- Breaking changes
- Removing deprecated features
- Incompatible API changes

---

## Step-by-Step Guide

### Prerequisites

Before creating a release:

1. ✅ All changes are committed
2. ✅ Tests are passing (`npm run test:all`)
3. ✅ Code is pushed to `main` branch
4. ✅ You have push access to the GitHub repository

### Creating a Release

#### 1. Choose the Right Version Bump

Determine what type of changes you're releasing:

```bash
# Bug fixes only
npm run version:patch

# New features added
npm run version:minor

# Breaking changes
npm run version:major
```

#### 2. Run the Command

```bash
$ npm run version:patch

> opencanvas@1.0.0 version:patch
> npm version patch && npm run release

v1.0.1

> opencanvas@1.0.1 release
> npm run release:tag && echo '✅ Tag pushed! GitHub Actions will build the release.'

✅ Tag pushed! GitHub Actions will build the release.
```

#### 3. Monitor the Build

GitHub Actions will automatically start building your release:

1. Visit: https://github.com/Gyana491/OpenCanvas/actions
2. Click on the latest "Release" workflow run
3. Monitor the progress (builds take ~10-15 minutes)

#### 4. Review the Draft Release

Once builds complete:

1. Visit: https://github.com/Gyana491/OpenCanvas/releases
2. Find your draft release (e.g., `v1.0.1`)
3. Verify all platform builds are present:
   - ✅ `OpenCanvas-darwin-universal-1.0.1.zip` (macOS)
   - ✅ `OpenCanvas-1.0.1-win-x64.zip` (Windows)
   - ✅ `opencanvas_1.0.1_amd64.deb` (Linux Debian/Ubuntu)
   - ✅ `opencanvas-1.0.1.x86_64.rpm` (Linux Fedora/RHEL)

#### 5. Add Release Notes

Edit the draft release and add notes describing:
- What's new
- What's fixed
- Any breaking changes
- Known issues

**Example:**

```markdown
## What's New
- Added new workflow export feature
- Improved image processing performance

## Bug Fixes
- Fixed video playback issue
- Resolved theme toggle positioning

## Breaking Changes
None

## Known Issues
None
```

#### 6. Publish the Release

Click **"Publish release"** to make it public.

Users can now download the application for their platform! 🎉

---

## What Happens During Release

### Automation Flow

```
npm run version:patch
    ↓
1. Update package.json (1.0.0 → 1.0.1)
    ↓
2. Create git commit ("1.0.1")
    ↓
3. Create git tag (v1.0.1)
    ↓
4. Push tag to GitHub
    ↓
5. GitHub Actions Triggered
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Windows       │     macOS       │     Linux       │
│   Runner        │     Runner      │     Runner      │
│                 │                 │                 │
│ 1. Checkout     │ 1. Checkout     │ 1. Checkout     │
│ 2. Setup Node   │ 2. Setup Node   │ 2. Setup Node   │
│ 3. Install deps │ 3. Install deps │ 3. Install deps │
│ 4. Build app    │ 4. Build app    │ 4. Build app    │
│ 5. Upload ZIP   │ 5. Upload ZIP   │ 5. Upload DEB   │
│                 │    (Universal)  │    & RPM        │
└─────────────────┴─────────────────┴─────────────────┘
    ↓
6. Draft Release Created on GitHub
    ↓
7. You review and publish
```

### Build Artifacts

Each platform produces specific distributable formats:

| Platform | Architecture | Format | Size (approx) |
|----------|--------------|--------|---------------|
| macOS | Universal (Intel + ARM64) | `.zip` | ~110-120 MB |
| Windows | x64 | `.zip` | ~100-110 MB |
| Linux | x64 | `.deb` + `.rpm` | ~100-110 MB each |

---

## Platform Builds

### macOS - Universal Binary

The macOS build is a **universal binary** that works on:
- ✅ Intel Macs (x64)
- ✅ Apple Silicon Macs (M1, M2, M3, etc.)

Users download one `.zip` file that works on any Mac.

### Windows

Windows builds are packaged as:
- `.zip` - Portable version (extract and run)

### Linux

Linux builds are provided in two formats:
- `.deb` - For Debian, Ubuntu, Linux Mint, etc.
- `.rpm` - For Fedora, RHEL, CentOS, etc.

---

## Troubleshooting

### Build Failed on One Platform

**Problem:** GitHub Actions build fails for Windows/macOS/Linux

**Solution:**
1. Check the Actions logs for the specific error
2. Fix the issue in your code
3. Delete the failed tag:
   ```bash
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1
   ```
4. Re-run the release command after fixing

### Wrong Version Number

**Problem:** Released with wrong version number

**Solution:**
```bash
# Delete the tag locally and remotely
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# Delete the draft release on GitHub (manual)
# Visit: https://github.com/Gyana491/OpenCanvas/releases

# Fix version in package.json if needed
# Then create the correct release
npm run version:patch  # or minor/major
```

### Missing GitHub Token

**Problem:** "GITHUB_TOKEN" permission error

**Solution:**
1. Go to: https://github.com/Gyana491/OpenCanvas/settings/actions
2. Under "Workflow permissions", select "Read and write permissions"
3. Click "Save"
4. Re-run the workflow

### Uncommitted Changes

**Problem:** "Cannot tag with uncommitted changes"

**Solution:**
```bash
# Commit your changes first
git add .
git commit -m "feat: your changes"
git push

# Then run the release
npm run version:patch
```

---

## Advanced Usage

### Manual Process (Without Scripts)

If you need to manually control the process:

```bash
# 1. Update version manually in package.json
# Edit: "version": "1.0.1"

# 2. Commit the change
git add package.json
git commit -m "chore: bump version to 1.0.1"

# 3. Create and push tag
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will trigger automatically
```

### Building Locally

To build for your current platform only:

```bash
# Build only (no publish)
npm run make

# Package only (no distributables)
npm run package

# Full publish (current platform only)
npm run publish
```

### Custom Tag Names

If you need a custom tag (e.g., beta releases):

```bash
# Create custom tag
git tag v1.0.1-beta.1
git push origin v1.0.1-beta.1

# Or with npm
npm version 1.0.1-beta.1
git push origin v1.0.1-beta.1
```

---

## Release Checklist

Use this checklist before releasing:

### Pre-Release
- [ ] All features are complete and tested
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Code is formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] All changes committed and pushed
- [ ] Version bump type determined (patch/minor/major)

### Release
- [ ] Run appropriate version command
- [ ] Monitor GitHub Actions build
- [ ] Verify all 4 artifacts uploaded
- [ ] Download and test at least one platform
- [ ] Write clear release notes
- [ ] Publish the release

### Post-Release
- [ ] Verify release is public on GitHub
- [ ] Test download links work
- [ ] Announce the release (if applicable)
- [ ] Update documentation (if needed)

---

## GitHub Actions Configuration

The automated builds are configured in `.github/workflows/release.yml`.

### Workflow Triggers

The workflow is triggered by **version tags** matching the pattern: `v*.*.*`

Examples:
- ✅ `v1.0.0` - Triggers
- ✅ `v1.0.1` - Triggers
- ✅ `v2.0.0-beta.1` - Triggers
- ❌ `release-1.0.0` - Does NOT trigger
- ❌ `1.0.0` - Does NOT trigger

### Build Matrix

Builds run in parallel on:
- `macos-latest` - macOS (universal binary)
- `ubuntu-latest` - Linux (x64)
- `windows-latest` - Windows (x64)

### Build Time

Typical build times:
- macOS: ~8-12 minutes
- Windows: ~6-10 minutes
- Linux: ~6-10 minutes

Total time: **~10-15 minutes** (parallel execution)

---

## Environment Variables

The build process uses these environment variables:

| Variable | Purpose | Set In |
|----------|---------|--------|
| `GITHUB_TOKEN` | Authenticate with GitHub API | GitHub Actions (automatic) |
| `ARCH` | Build architecture (for macOS universal) | Workflow (automatic) |

---

## Support

For issues with the release process:

1. Check this documentation
2. Review GitHub Actions logs
3. Check [Electron Forge documentation](https://www.electronforge.io/)
4. Open an issue on GitHub

---

## References

- [Semantic Versioning](https://semver.org/)
- [Electron Forge Documentation](https://www.electronforge.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm version Documentation](https://docs.npmjs.com/cli/v10/commands/npm-version)

---

**Happy Releasing! 🚀**
