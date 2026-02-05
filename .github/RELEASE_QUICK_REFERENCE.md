# 📋 Release Quick Reference

## One-Command Release

```bash
# Bug fix (1.0.0 → 1.0.1)
npm run version:patch

# New feature (1.0.0 → 1.1.0)
npm run version:minor

# Breaking change (1.0.0 → 2.0.0)
npm run version:major

# Redo current release (Fix bug without bumping version)
npm run release:redo
```

## ❓ When to Run These Commands?

**Only when you are ready to ship to users!**

- **Daily Work:** Use `git commit` and `git push` normally.
- **Ready to Publish:** Run `npm run version:x` ONE time to build and release.

## What Happens Automatically

1. ✅ Updates `package.json` version
2. ✅ Creates git commit
3. ✅ Creates and pushes git tag (e.g., `v1.0.1`)
4. ✅ Triggers GitHub Actions
5. ✅ Builds for Windows, macOS (Universal), Linux
6. ✅ Creates draft release on GitHub

## After Running the Command

**Wait ~10-15 minutes**, then:

1. Go to: https://github.com/Gyana491/OpenCanvas/releases
2. Find your draft release
3. Add release notes
4. Click **"Publish release"**

## Pre-Release Checklist

- [ ] All changes committed and pushed
- [ ] Tests passing: `npm run test:all`
- [ ] Choose version type (patch/minor/major)

## Common Issues

### Uncommitted Changes
```bash
git add .
git commit -m "your message"
git push
npm run version:patch
```

### Delete Wrong Tag
```bash
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
```

3. Run the automated redo command:
```bash
npm run release:redo
```

## Platform Artifacts

After build completes, you'll have:

- `OpenCanvas-darwin-universal-1.0.1.zip` - macOS (Intel + M1/M2/M3)
- `OpenCanvas-1.0.1-win-x64.zip` - Windows
- `opencanvas_1.0.1_amd64.deb` - Linux (Debian/Ubuntu)
- `opencanvas-1.0.1.x86_64.rpm` - Linux (Fedora/RHEL)

## Monitoring Builds

Watch progress at:
https://github.com/Gyana491/OpenCanvas/actions

Typical build time: **10-15 minutes**

---

**See [RELEASE.md](RELEASE.md) for complete documentation.**
