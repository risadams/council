# Security Audit Task Checklist & Tracking

**Feature**: 004-Security-Audit  
**Branch**: `004-security-audit`  
**Status**: Ready for execution  
**Created**: February 11, 2026  
**Updated**: [To be updated during execution]

This checklist tracks concrete tasks during execution. Check off items as they are completed.

---

## PHASE 1: DISCOVERY

### Subtask 1.1: Run Initial npm Audit Scan

- [ ] **1.1.1**: Navigate to `a:\council\server`
- [ ] **1.1.2**: Run `npm audit --json` and save to `audit-initial.json`
- [ ] **1.1.3**: Review human-readable output of `npm audit`
- [ ] **1.1.4**: Count and categorize CVEs by severity
  - [ ] Critical: ____ (count)
  - [ ] High: ____ (count)
  - [ ] Medium: ____ (count)
  - [ ] Low: ____ (count)
- [ ] **1.1.5**: Identify all transitive dependency CVEs
- [ ] **1.1.6**: Document any packages already at latest version (unfixable by update)
- [ ] **1.1.7**: Save audit report for comparison later

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 1.2: Document Node.js Base Image CVEs

- [ ] **1.2.1**: Query Docker Hub for node:25-bookworm-slim digest
- [ ] **1.2.2**: Run: `docker inspect node:25-bookworm-slim --format='{{.RepoDigests}}'`
- [ ] **1.2.3**: Record base image digest: ___________________________
- [ ] **1.2.4**: Research known CVEs in node:25-bookworm-slim:
  - [ ] Check Docker Hub release notes
  - [ ] Check Debian security advisories (base layer)
- [ ] **1.2.5**: List identified OS-level CVEs:
  - [ ] CVE ID: ____ | Severity: ____ | Affected Pkg: ____
  - [ ] CVE ID: ____ | Severity: ____ | Affected Pkg: ____
  - [ ] [Additional rows as needed]
- [ ] **1.2.6**: Confirm decision: OS CVEs will be documented but NOT remediated (per clarification)
- [ ] **1.2.7**: Plan for monitoring future node:25-* versions

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 1.3: Generate Initial Vulnerability Inventory Report

- [ ] **1.3.1**: Consolidate findings from Tasks 1.1 and 1.2
- [ ] **1.3.2**: Create temporary inventory summary:
  - [ ] Total packages scanned: ____
  - [ ] Total npm CVEs: ____
  - [ ] Total OS CVEs: ____
- [ ] **1.3.3**: List packages with multiple vulnerabilities:
  - [ ] Package: ____ | CVE Count: ____
  - [ ] Package: ____ | CVE Count: ____
- [ ] **1.3.4**: Identify which CVEs are critical/high priority
- [ ] **1.3.5**: Flag transitive dependencies requiring attention
- [ ] **1.3.6**: Save inventory for Phase 2 remediation planning

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

**PHASE 1 COMPLETE**: [ ] Yes - Ready to proceed to Phase 2

---

## PHASE 2: REMEDIATION

### Subtask 2.1: Analyze Remediation Paths

- [ ] **2.1.1**: For each critical CVE from Phase 1:
  - [ ] CVE ID: ____ | Package: ____
  - [ ] Current Version: ____ | Available Fix Version: ____
  - [ ] Compatible? (Y/N): ____
  - [ ] Required Code Changes: ____
  - [ ] Alternative Package? (Y/N): ____ (if yes, name: ______)
  - [ ] Decision: [ ] Update [ ] Alternative [ ] Unfixable
- [ ] **2.1.2**: Repeat for each high-severity CVE
- [ ] **2.1.3**: Identify any conflicting version requirements
- [ ] **2.1.4**: Classify as "remediable" or "unfixable" for each CVE
- [ ] **2.1.5**: Document any blocking issues
- [ ] **2.1.6**: List unfixable CVEs with reason (will document in Phase 3)

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 2.2: Apply Patches to package.json

- [ ] **2.2.1**: Update package.json with first patch:
  - [ ] Package: ____ | Old: ____ → New: ____
- [ ] **2.2.2**: Run `npm install` to update package-lock.json
- [ ] **2.2.3**: Check for npm install errors: [ ] None [ ] Conflicts (describe): ____
- [ ] **2.2.4**: If conflicts, resolve using version ranges
- [ ] **2.2.5**: Commit changes: `git add package*.json && git commit -m "..."`
- [ ] **2.2.6**: Repeat 2.2.1-2.2.5 for each additional patch
- [ ] **2.2.7**: Final commit summary of all patches applied

**Patches Applied**:
- [ ] ____ → ____ (Fixes CVE-____)
- [ ] ____ → ____ (Fixes CVE-____)
- [ ] ____ → ____ (Fixes CVE-____)
- [ ] [Additional patches as needed]

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 2.3: Run Test Suite for Regressions

- [ ] **2.3.1**: Build TypeScript: `npm run build:ts`
  - [ ] Result: [ ] Success [ ] Failed (error: ______)
- [ ] **2.3.2**: Run test suite: `npm test`
  - [ ] Tests Passed: 207/207 [ ] Yes [ ] No (count: ____)
- [ ] **2.3.3**: If tests failed, debug each failure:
  - [ ] Test Name: ____ | Cause: [ ] Security patch [ ] Bug [ ] Other: ____
  - [ ] Test Name: ____ | Cause: [ ] Security patch [ ] Bug [ ] Other: ____
- [ ] **2.3.4**: For each "security patch incompatibility":
  - [ ] Package: ____ | Version: ____ | Reason unfixable: ____
  - [ ] Add to unfixable list (Phase 3)
- [ ] **2.3.5**: Fix remaining test failures (if needed)
- [ ] **2.3.6**: Confirm final result: 207/207 tests pass [ ] Yes

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 2.4: Test Docker Build Process

- [ ] **2.4.1**: Run: `cd a:\council && .\rebuild-docker.ps1`
  - [ ] Result: [ ] Success [ ] Failed (error: ______)
- [ ] **2.4.2**: Verify health check passes
  - [ ] First attempt? [ ] Yes [ ] No (attempts: ____)
- [ ] **2.4.3**: Verify server is responsive
  - [ ] HTTP endpoint working? [ ] Yes
  - [ ] HTTPS endpoint working? [ ] Yes
  - [ ] MCP server registered? [ ] Yes
- [ ] **2.4.4**: Confirm Docker image ready for deployment

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 2.5: First Verification Scan

- [ ] **2.5.1**: Run: `npm audit --json > audit-after-patches.json`
- [ ] **2.5.2**: Compare to initial audit:
  - [ ] Critical CVEs: ____ → ____ (reduced by: ____)
  - [ ] High CVEs: ____ → ____ (reduced by: ____)
- [ ] **2.5.3**: Verify all critical/high npm CVEs are either:
  - [ ] Resolved (no longer in audit report)
  - [ ] Marked as unfixable (documented)
- [ ] **2.5.4**: Note any new medium/low CVEs (should not grow)
- [ ] **2.5.5**: Document: Are we at zero critical/high CVEs? [ ] Yes [ ] No
- [ ] **2.5.6**: Save audit report for compliance file

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

**PHASE 2 COMPLETE**: [ ] Yes - Ready to proceed to Phase 3

---

## PHASE 3: DOCUMENTATION

### Subtask 3.1: Analyze Unfixable Vulnerabilities

- [ ] **3.1.1**: Compile list of all unfixable CVEs from Phase 2
- [ ] **3.1.2**: For each unfixable CVE:
  - [ ] CVE ID: ____ | Package: ____ | Current Version: ____
- [ ] **3.1.3**: Verify each meets unfixable criteria:
  - [ ] No patch available? [ ] Yes [ ] No
  - [ ] No alternative package? [ ] Yes [ ] No
  - [ ] Cannot mitigate in code? [ ] Yes [ ] No
  - [ ] OR Fix breaks API (risk accepted)? [ ] Yes [ ] No
- [ ] **3.1.4**: For each unfixable CVE, estimate attack surface:
  - [ ] CVE ID: ____ | Is this exposed to external input? [ ] Yes [ ] No [ ] Unknown
  - [ ] Mitigation strategies available? [ ] Network isolation [ ] Input validation [ ] None
- [ ] **3.1.5**: List OS-level CVEs from Phase 1.2
- [ ] **3.1.6**: Confirm all unfixable CVEs documented

**Unfixable CVEs Summary**:
- [ ] npm Package unfixable CVEs: ____ (count)
- [ ] OS-level unfixable CVEs: ____ (count)
- [ ] Total unfixable: ____

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 3.2: Create GitHub Issues for Unfixable Vulnerabilities

- [ ] **3.2.1**: For each unfixable npm CVE, create GitHub Issue:
  - [ ] Issue Title: "CVE-____: [Package] - UNFIXABLE"
  - [ ] Labels: "security/unfixable", "cve"
  - [ ] Issue #: ____
  - [ ] Issue #: ____
- [ ] **3.2.2**: For each OS-level CVE, create GitHub Issue:
  - [ ] Issue Title: "OS-CVE-____: [node:25-bookworm-slim] - OUT OF SCOPE"
  - [ ] Labels: "security/os-level", "cve", "out-of-scope"
  - [ ] Issue #: ____
  - [ ] Issue #: ____
- [ ] **3.2.3**: Create rolling maintenance review Issue:
  - [ ] Title: "Security: Review unfixable CVEs in next maintenance cycle"
  - [ ] Label: "security", "maintenance"
  - [ ] Issue #: ____
- [ ] **3.2.4**: Link all issues and label appropriately

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 3.3: Create docs/SECURITY_FINDINGS.md

- [ ] **3.3.1**: Create file: `docs/SECURITY_FINDINGS.md`
- [ ] **3.3.2**: Add sections:
  - [ ] Audit Summary (date, tools, scope)
  - [ ] Executive Summary (counts)
  - [ ] Unfixable npm Vulnerabilities (table)
  - [ ] OS-Level CVEs (table)
  - [ ] Remediation Timeline
  - [ ] Testing Results
  - [ ] Risk Assessment
  - [ ] Next Steps
- [ ] **3.3.3**: Each unfixable CVE includes:
  - [ ] CVE ID
  - [ ] Affected package and version
  - [ ] Severity
  - [ ] Reason unfixable
  - [ ] Mitigation strategies (if any)
  - [ ] Link to GitHub Issue
- [ ] **3.3.4**: Format is compliance-audit ready
- [ ] **3.3.5**: Save file to version control: `git add docs/SECURITY_FINDINGS.md`

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

**PHASE 3 COMPLETE**: [ ] Yes - Ready to proceed to Phase 4

---

## PHASE 4: VERIFICATION & COMPLIANCE

### Subtask 4.1: Run Final Comprehensive Audit

- [ ] **4.1.1**: Clean install dependencies: `rm -rf node_modules package-lock.json && npm install`
- [ ] **4.1.2**: Run: `npm audit --json > audit-final.json`
- [ ] **4.1.3**: Review audit results:
  - [ ] Critical CVEs (direct deps): ____ (target: 0)
  - [ ] High CVEs (direct deps): ____ (target: 0)
- [ ] **4.1.4**: Rebuild and test:
  - [ ] `npm run build:ts` completed: [ ] Success
  - [ ] `npm test` result: [ ] 207/207 pass
  - [ ] Docker rebuild: [ ] Success
- [ ] **4.1.5**: Compare audit timeline:
  - [ ] Initial audit CVEs: ____
  - [ ] After patches CVEs: ____
  - [ ] Final audit CVEs: ____
- [ ] **4.1.6**: Document all improvements

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 4.2: Create docs/SECURITY_AUDIT.md (Compliance Report)

- [ ] **4.2.1**: Create file: `docs/SECURITY_AUDIT.md`
- [ ] **4.2.2**: Add sections:
  - [ ] Audit Metadata (date, tools, scope)
  - [ ] Summary Statistics (CVEs found/fixed/unfixable)
  - [ ] Detailed Findings
  - [ ] Remediation Actions Taken
  - [ ] Test Results (207/207 pass)
  - [ ] Compliance & Reproducibility steps
  - [ ] Linked Resources
- [ ] **4.2.3**: Include reproducibility steps:
  - [ ] How to re-run audit: `npm audit --json`
  - [ ] How to re-run tests: `npm test`
  - [ ] How to rebuild Docker: `.\rebuild-docker.ps1`
- [ ] **4.2.4**: Verify audit is fully reproducible
- [ ] **4.2.5**: Save file to version control: `git add docs/SECURITY_AUDIT.md`

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 4.3: Link GitHub Issues to Remediation

- [ ] **4.3.1**: For each fixed CVE, create/update GitHub Issue:
  - [ ] Title: "CVE-____: [Package] - FIXED in v____"
  - [ ] Labels: "security/fixed", "cve"
  - [ ] Link to commit/PR that fixed it
  - [ ] Close with comment linking to PR
- [ ] **4.3.2**: Verify unfixable CVEs are properly labeled:
  - [ ] Label: "security/unfixable"
  - [ ] Do NOT close (leave for rolling review)
- [ ] **4.3.3**: Create summary issue: "Security Audit 2026-02-11 - Summary"
  - [ ] Label: "security", "audit"
  - [ ] Links to all CVE issues
  - [ ] Links to compliance reports
- [ ] **4.3.4**: Verify issue trail is complete

**Task Owner**: ____________________  
**Completed Date**: __________________  
**Notes**: ________________________________________________

---

### Subtask 4.4: Validate Success Criteria

- [ ] **4.4.1**: Verify Success Criteria (from spec):
  - [ ] **SC-001**: Zero critical-severity CVEs in npm ✓
  - [ ] **SC-002**: Zero high-severity CVEs in npm ✓
  - [ ] **SC-003**: OS CVEs documented ✓
  - [ ] **SC-004**: High-severity npm vulnerabilities resolved ✓
  - [ ] **SC-005**: 100% of remediable critical/high CVEs updated ✓
  - [ ] **SC-006**: 207/207 tests pass ✓
  - [ ] **SC-007**: Docker image builds successfully ✓
  - [ ] **SC-008**: Unfixable CVEs documented ✓
  - [ ] **SC-009**: Audit reproducible ✓
  - [ ] **SC-010**: Completed within 2 iterations ✓
  - [ ] **SC-011**: Medium/low CVE count stable ✓
- [ ] **4.4.2**: Sign-off on completion:
  - [ ] All success criteria met by: ____________________
  - [ ] Date: __________________
  - [ ] Comments: ________________________________________________

**PHASE 4 COMPLETE**: [ ] Yes - Audit feature complete and ready for review

---

## FINAL SIGN-OFF

**Feature Completion Checklist**:

- [ ] All 4 phases completed
- [ ] All deliverables created and saved
- [ ] docs/SECURITY_AUDIT.md created
- [ ] docs/SECURITY_FINDINGS.md created
- [ ] GitHub Issues created and linked
- [ ] Changes committed to branch `004-security-audit`
- [ ] All 11 success criteria verified
- [ ] Ready for stakeholder review

**Completed by**: ____________________  
**Date**: __________________  
**Review comments**: ________________________________________________

---

## Execution Notes

**Start Date**: __________________  
**End Date**: __________________  
**Total Hours**: __________________  

**Key Blockers Encountered**:
- ________________________________________________

**Key Successes**:
- ________________________________________________

**Recommendations for Future Audits**:
- ________________________________________________
