# Unfixable Vulnerability Analysis

**Feature**: 004-Security-Audit  
**Date**: February 11, 2026

## npm Package CVEs

- None detected in npm audit results.

## OS-Level CVEs (node:25-bookworm-slim)

Docker Scout quickview summary indicates OS-level vulnerabilities:
- Critical: 0
- High: 2
- Medium: 2
- Low: 24

### Rationale for Unfixable Classification

- OS-level CVEs are tied to the base image and are out of scope per clarification Q2.
- Remediation requires base image upgrades outside this audit scope.

### Impact Notes

- Detailed CVE IDs are not yet captured; see specs/004-security-audit/os-cve-inventory.md.
- Risk acceptance is documented and should be revisited in the next maintenance cycle.

---

**Status**: OS-level CVE IDs pending (requires `docker scout cves` detail output).
