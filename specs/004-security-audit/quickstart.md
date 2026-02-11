# Security Audit Quick Start Guide

**Feature**: 004-Security-Audit  
**Last Updated**: February 11, 2026  
**Status**: Ready for execution

This guide provides step-by-step instructions to begin the security audit immediately after planning approval.

## Prerequisites

Verify the following before starting:
- [ ] Node.js 25 installed (`node --version`)
- [ ] npm available (`npm --version`)
- [ ] Docker installed and running
- [ ] Access to git repository
- [ ] Current working directory: `a:\council`
- [ ] All 207 tests currently passing (baseline: `npm test`)

## Quick Start (35 minutes to first audit complete)

### Step 1: Discovery (15 minutes)

**1a. Run npm audit (5 minutes)**
```powershell
cd a:\council\server
npm audit --json > ..\specs\004-security-audit\audit-initial.json
npm audit  # Human-readable output for review
```
**Expected Output**: 
- List of vulnerabilities by severity (critical/high/medium/low)
- Affected packages and versions
- Remediation suggestions

**Save this output**: You'll compare against it later.

---

**1b. Document Node.js base image (5 minutes)**
```powershell
# Check current image fingerprint
docker inspect node:25-bookworm-slim --format='{{.RepoDigests}}'

# Note: Record the image digest and known CVEs at time of audit
# For reference: https://hub.docker.com/_/node (look at "25-bookworm-slim" tags)
```

**Action Item**: Document any known OS-level CVEs in node:25-bookworm-slim  
**Expected**: Likely to find a few OS CVEs (Debian packages in the image)  
**Plan**: These will be documented but **not** fixed (per audit clarification)

---

**1c. Create discovery summary (5 minutes)**
```powershell
# Create temporary summary of findings
cat > ./specs/004-security-audit/discovery-summary.md << 'EOF'
# Security Audit Discovery Summary
**Date**: $(date)
**Audit Tool**: npm audit (GitHub Advisory Database)

## npm Package Vulnerabilities
- Critical: [COUNT]
- High: [COUNT]  
- Medium: [COUNT]
- Low: [COUNT]

## Docker Base Image (node:25-bookworm-slim)
- Image Digest: [DIGEST]
- Known OS CVEs: [COUNT] (documented but not remediated per clarification)

## Next Steps
-> Proceed to remediation phase
EOF
```

### Step 2: Remediation (15-20 minutes)

**2a. Analyze what can be fixed (5 minutes)**
```powershell
# List dependencies with critical/high vulnerabilities
npm audit --production  # Production-only dependencies
npm audit  # All dependencies including dev

# For each vulnerability, check NPM registry for patches:
# npm view [package]@latest
# Example: npm view lodash@latest
```

**Action Items**:
- [ ] Identify which critical/high CVEs have available patches
- [ ] Check if patch versions would break compatibility
- [ ] List any packages that can't be updated

---

**2b. Apply patches (5 minutes)**
```powershell
# Option 1: Automatic fix (if npm has auto-fix available)
npm audit fix

# Option 2: Manual fix (for specific packages)
# npm install [package]@[version]
# Example: npm install lodash@latest

# Option 3: For transitive deps, update the parent package
# npm install [parent-package]@latest
```

**Important**: If `npm install` fails, stop and debug (likely version conflict)

---

**2c. Verify no regressions (10 minutes)**
```powershell
# Rebuild TypeScript
npm run build:ts

# Run full test suite
npm test

# Expected: 207/207 tests pass
```

**If tests fail**:
1. Review which test failed
2. Determine if failure is due to security patch incompatibility
3. If incompatible: mark that CVE as "unfixable" (will document later)
4. If it's a test bug: fix the test

---

**2d. Rebuild Docker (optional at this stage)**
```powershell
cd ..  # Back to a:\council
.\rebuild-docker.ps1

# Expected: Image rebuilds, health check passes
```

### Step 3: Verification (5 minutes)

```powershell
cd a:\council\server

# Run audit again to see what's left
npm audit

# Save final state
npm audit --json > ..\specs\004-security-audit\audit-after-patches.json
```

**Verification Checklist**:
- [ ] No new critical-severity threats
- [ ] No new high-severity threats
- [ ] All tests pass
- [ ] Docker builds successfully

## What to Document

After Step 3, you have enough information to:

1. **Create docs/SECURITY_FINDINGS.md** (5 minutes)
   - List any bugs that remain (if any)
   - Explain why they can't be fixed
   - Link to GitHub Issues

2. **Create GitHub Issues** (10 minutes)
   - One issue per unfixable CVE
   - Include CVE ID, affected package, reason unfixable
   - Label: "security/unfixable", "cve"

3. **Create docs/SECURITY_AUDIT.md** (15 minutes)
   - Document the audit methodology
   - Record all changes made
   - Link to supporting evidence

## Expected Outcomes (from spec "Success Criteria")

By the end of this quick start, you should have:

- ✅ **SC-001**: Zero critical-severity CVEs in npm packages
- ✅ **SC-002**: Zero high-severity CVEs in npm packages  
- ✅ **SC-003-004**: OS CVEs documented
- ✅ **SC-005**: 100% of remediable critical/high CVEs patched
- ✅ **SC-006**: 207/207 tests pass
- ✅ **SC-007**: Docker builds successfully
- ✅ **SC-008**: Any unfixable CVEs documented
- ✅ **SC-009**: Audit reproducible (using npm audit)
- ✅ **SC-010**: Completed in 1 iteration (this phase)
- ✅ **SC-011**: Medium/low CVE count stable

## Troubleshooting

### "npm install fails with dependency conflict"
**Solution**: Check which two packages are conflicting. Options:
1. Use semver ranges to allow both versions
2. Update both packages to compatible versions
3. Mark the CVE as unfixable if truly incompatible

**Command to debug**: `npm ls [package]`

---

### "Tests fail after applying patches"
**Solution**: 
1. Determine if the test was already failing (baseline test)
2. If new failure, check package changelog for breaking changes
3. Either revert the patch (mark as unfixable) or fix the test

**Command to debug**: `npm test -- --reporter=verbose`

---

### "Docker build fails"
**Solution**: Usually a transitive dependency issue
1. Check Docker build logs for npm error
2. From the error, determine which package is missing
3. Likely need to run `npm install` again
4. Retry Docker rebuild

**Command to debug**: `.\rebuild-docker.ps1` (full build log shown)

---

### "npm audit reports more vulnerabilities than Task 1"
**Solution**: This is normal! GitHub Advisory Database updates periodically
1. Document that new CVEs found during audit phase
2. Add to list of vulnerabilities to remediate
3. Apply patches as needed
4. Note in docs/SECURITY_AUDIT.md: "Database updated during audit"

---

## When to Move to Full Documentation Phase

You're ready to move to documentation (Phase 3) when:

- [ ] npm audit shows zero critical/high-severity CVEs
- [ ] All 207 tests pass
- [ ] Docker builds successfully
- [ ] You have a list of any remaining unfixable CVEs (if any)

**Next Command**: Start Phase 3 documentation tasks from [plan.md](plan.md#phase-3-document-os-level-cves--unfixable-vulnerabilities-user-story-3)

## Key Files Reference

| File | Purpose |
|------|---------|
| [plan.md](plan.md) | Full implementation plan with all tasks |
| [spec.md](spec.md) | Original specification and clarifications |
| audit-initial.json | npm audit baseline (saved in Step 1a) |
| audit-after-patches.json | Final npm audit (saved in Step 3) |
| docs/SECURITY_FINDINGS.md | Unfixable CVEs documentation (create in Phase 3) |
| docs/SECURITY_AUDIT.md | Full audit methodology (create in Phase 4) |

## Support & Questions

If you encounter issues not covered in Troubleshooting:

1. Check [plan.md](plan.md#risk-register--mitigation) for risk mitigation strategies
2. Review [spec.md](spec.md#clarifications) for audit clarifications
3. Refer to [spec.md](spec.md#assumptions) for tool and process assumptions
4. Create a GitHub Issue with details for team discussion

---

**You're ready to start! Begin with Step 1 above.**
