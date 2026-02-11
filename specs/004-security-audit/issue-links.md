# GitHub Issue Tracker - Security Audit CVEs

**Feature**: 004-Security-Audit  
**Created**: February 11, 2026  
**Purpose**: Track GitHub issues created for vulnerability tracking and resolution

---

## Issue Creation Guidelines

### Fixed CVEs
- **Title Format**: `CVE-####: [Package] - FIXED in v[version]`
- **Labels**: `security/fixed`, `cve`
- **Status**: Closed with link to fixing commit/PR

### Unfixable npm CVEs
- **Title Format**: `CVE-####: [Package] - UNFIXABLE`
- **Labels**: `security/unfixable`, `cve`
- **Status**: Open for rolling review

### OS-level CVEs
- **Title Format**: `OS-CVE-####: [node:25-bookworm-slim] - OUT OF SCOPE`
- **Labels**: `security/os-level`, `cve`, `out-of-scope`
- **Status**: Open, documented only

### Maintenance Review
- **Title**: `Security: Review unfixable CVEs in next maintenance cycle`
- **Labels**: `security`, `maintenance`
- **Status**: Open, recurring

---

## Issue Registry

### Fixed CVEs

| CVE ID | Package | Issue # | Status | Fixed In | Closed Date |
|--------|---------|---------|--------|----------|-------------|
| None | - | - | - | - | - |

### Unfixable npm CVEs

| CVE ID | Package | Severity | Issue # | Reason Unfixable | Created Date |
|--------|---------|----------|---------|------------------|--------------|
| None | - | - | - | No npm CVEs detected | - |

### OS-level CVEs (Docker Base Image)

| CVE ID | Affected Package | Severity | Issue # | Image Version | Created Date |
|--------|------------------|----------|---------|---------------|--------------|
| Pending | debian:12-slim (node:25-bookworm-slim) | High/Medium/Low | - | node:25-bookworm-slim | - |

### Maintenance Issues

| Title | Issue # | Created Date | Status |
|-------|---------|--------------|--------|
| Pending: Review unfixable CVEs | - | - | Not created |

---

## Issue Links

<!-- Add links to GitHub issues as they are created -->

**Summary Issue**: Not created (no npm CVEs)  
**Rolling Review Issue**: Not created (OS CVEs pending IDs)

---

**Last Updated**: February 11, 2026
