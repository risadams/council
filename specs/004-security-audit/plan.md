# Implementation Plan: Comprehensive Security Audit & Vulnerability Remediation

**Feature**: 004-Security-Audit  
**Branch**: `004-security-audit`  
**Created**: February 11, 2026  
**Status**: Planning  
**Planning Participants**: Security team, DevOps, Development team

## Executive Summary

This plan breaks down the security audit and vulnerability remediation into four sequential phases with clear dependencies. The feature will identify all npm package vulnerabilities using npm audit, document OS-level CVEs from the Docker base image, remediate all critical and high-severity npm vulnerabilities, and produce compliance documentation.

**Key Timeline Estimates**:
- **Phase 1 (Discovery)**: 2-3 hours
- **Phase 2 (Initial Remediation & Testing)**: 4-8 hours (dependent on vulnerability count)
- **Phase 3 (OS CVE Analysis & Documentation)**: 2-3 hours
- **Phase 4 (Final Verification & Compliance Reports)**: 1-2 hours
- **Total Estimated Effort**: 9-16 hours

---

## Phase 1: Discover All Vulnerabilities (User Story 1)

**Objective**: Generate complete inventory of CVEs in npm packages and Docker base image  
**Priority**: P1 (Foundational)  
**Acceptance Criteria**: All CVEs identified and classified by severity

### Task 1.1: Run Initial npm Audit Scan
**Description**: Execute npm audit on current package-lock.json to identify npm package vulnerabilities  
**Owner**: DevOps / Security  
**Effort**: 0.5 hours  
**Dependencies**: None (can start immediately)  
**Tools**: npm audit  
**Steps**:
1. `cd a:\council\server && npm audit --json > audit-initial-report.json`
2. Save report to temp location for analysis
3. Categorize findings by severity (critical, high, medium, low)
4. Document any transitive dependency vulnerabilities

**Acceptance Criteria**:
- [ ] Initial npm audit report generated with JSON output
- [ ] All direct and transitive dependencies scanned
- [ ] CVEs categorized by severity (critical, high, medium, low)
- [ ] Transitive dependency vulnerabilities identified

**Risks**:
- npm audit might report dependencies that are only in devDependencies (acceptable to fix or document)
- GitHub Advisory Database may not have entries for all vulnerabilities (flag as "unknown severity")

---

### Task 1.2: Document Node.js Base Image CVEs
**Description**: Identify and document CVEs in node:25-bookworm-slim base image  
**Owner**: DevOps / Security  
**Effort**: 1.5 hours  
**Dependencies**: None (parallel with Task 1.1)  
**Tools**: docker inspect, Docker Hub documentation, CVE databases  
**Steps**:
1. Document current node:25-bookworm-slim image digest and tag
2. Research known CVEs for Bookworm OS packages in node:25-bookworm-slim
3. Create temporary inventory of OS-level CVEs (critical/high priority)
4. Note that OS CVEs will be accepted as unfixable per clarification Q2
5. Document link to Docker Hub images for future reference

**Acceptance Criteria**:
- [ ] Node.js base image digest and tag documented
- [ ] OS-level CVEs identified and listed by severity
- [ ] Decision recorded: OS CVEs will be documented but not remediated
- [ ] Plan created for monitoring future node:25-* versions

**Risks**:
- CVE information may be incomplete or vary by source (use highest severity per Q3)
- Base image may be updated with patches between audit and execution

---

### Task 1.3: Generate Initial Vulnerability Inventory Report
**Description**: Consolidate discovery findings into structured inventory  
**Owner**: DevOps / Security  
**Effort**: 0.5 hours  
**Dependencies**: Tasks 1.1, 1.2 complete  
**Tools**: Markdown, JSON  
**Steps**:
1. Create temporary diagnostic report listing:
   - Total npm packages scanned (direct + transitive)
   - CVE count by severity: critical, high, medium, low
   - OS-level CVE count by severity
   - Packages with multiple vulnerabilities flagged
2. Identify transitive dependencies with critical/high CVEs
3. Note any packages already at latest version (unfixable by update)

**Acceptance Criteria**:
- [ ] Initial inventory report created
- [ ] CVE counts aggregated and categorized
- [ ] High-severity and critical items flagged for remediation
- [ ] Transitive dependency vulnerabilities identified

---

## Phase 2: Remediate Critical/High NPM Vulnerabilities (User Story 2)

**Objective**: Apply patches and version updates to resolve all remediable critical and high-severity npm vulnerabilities  
**Priority**: P1 (Mandatory remediation)  
**Acceptance Criteria**: All remediable critical/high CVEs patched; all tests passing

### Task 2.1: Analyze Remediation Paths
**Description**: For each critical/high CVE, determine fix strategy  
**Owner**: Development / Security  
**Effort**: 1-2 hours (dependent on CVE count)  
**Dependencies**: Phase 1 complete  
**Tools**: npm, npm registry documentation, GitHub package advisories  
**Steps**:
1. For each critical/high CVE from Phase 1:
   - Check if new package version exists that fixes the CVE
   - Verify new version is compatible (review changelog/semver)
   - Check if alternative package exists (rare, but document if found)
   - For transitive dependencies: identify which direct dependency to update
2. Document each remediation path:
   - Current version → Target version
   - Breaking changes (if any)
   - Alternative considered? (yes/no)
3. Identify any conflicts (e.g., package A needs v3.0, package B needs v2.5)

**Acceptance Criteria**:
- [ ] Each critical/high CVE has documented remediation path
- [ ] Breaking changes identified (if any)
- [ ] Conflicting requirements flagged
- [ ] Decision made for each: Update, Find Alternative, or Mark Unfixable

**Risks**:
- Some packages may not have patches available (mark as unfixable)
- Multiple vulnerabilities in same package may require version juggling
- Breaking changes may require code updates

---

### Task 2.2: Apply Patches to package.json
**Description**: Update package.json with patched versions  
**Owner**: Development  
**Effort**: 0.5-1 hour  
**Dependencies**: Task 2.1 complete  
**Tools**: npm, text editor  
**Steps**:
1. For each critical/high CVE:
   - Update package.json to new version (or new alternative package)
   - Run `npm install` to update package-lock.json
   - Check for dependency resolution conflicts
2. If conflicts found during install:
   - If both can coexist: use version ranges that allow both
   - If incompatible: defer one CVE to "unfixable" category or find alternative
3. Document any deferred CVEs with reason
4. Commit changes after each batch of updates (for easy rollback if needed)

**Acceptance Criteria**:
- [ ] package.json updated with patched versions
- [ ] package-lock.json regenerated
- [ ] No npm install errors
- [ ] Dependency conflict resolution documented

**Risks**:
- npm install may fail (broken dependencies)
- Transitive dependencies may pull in older vulnerable versions
- May need to use `npm fund` or other tools to resolve conflicts

---

### Task 2.3: Run Test Suite for Regressions
**Description**: Verify that security patches do not break functionality  
**Owner**: Development / QA  
**Effort**: 1-2 hours (including potential debugging)  
**Dependencies**: Tasks 2.2 complete  
**Tools**: npm test, vitest  
**Steps**:
1. Build TypeScript: `npm run build:ts`
2. Run full test suite: `npm test`
3. For each test failure:
   - Review failure details
   - Identify if caused by security patch update
   - If patch incompatible, mark CVE as unfixable (breaking change)
   - If bug in test, fix test to work with new version
4. Iterate until 207/207 tests pass
5. Document any version constraints that emerged from testing

**Acceptance Criteria**:
- [ ] All 207 tests pass after security patches
- [ ] TypeScript compilation succeeds with no errors
- [ ] No regressions introduced by patches
- [ ] Incompatible patches documented for unfixable list

**Risks**:
- Security patches may have breaking changes despite semver
- Tests may expose unsafe behavior enabled by older vulnerable version
- May need to refactor code to work with new package behavior

---

### Task 2.4: Test Docker Build Process
**Description**: Verify Docker image builds successfully with patched dependencies  
**Owner**: DevOps  
**Effort**: 1 hour  
**Dependencies**: Tasks 2.2, 2.3 complete  
**Tools**: Docker, docker-compose  
**Steps**:
1. Run Docker rebuild: `.\rebuild-docker.ps1`
2. Monitor build output for errors
3. Verify health check passes
4. Verify server starts and is healthy
5. If build fails: debug and fix issues; likely due to missing transitive dependencies

**Acceptance Criteria**:
- [ ] Docker image builds successfully
- [ ] Health check passes on first attempt
- [ ] Server starts and responds to requests
- [ ] MCP server registered and enabled in Docker Desktop

**Risks**:
- Docker build uses npm ci (clean install), may expose hidden transitive dependencies
- Base image may change between builds
- Health check may timeout if startup is slow

---

### Task 2.5: First Verification Scan
**Description**: Run npm audit again to confirm critical/high CVEs resolved  
**Owner**: Security  
**Effort**: 0.5 hours  
**Dependencies**: Tasks 2.2, 2.3, 2.4 complete  
**Tools**: npm audit  
**Steps**:
1. Run `npm audit --json > audit-after-patches.json`
2. Compare to initial audit report
3. Verify all critical and high-severity vulnerabilities either:
   - Now resolved (CVE not listed in new audit)
   - Marked as unfixable with documented reason
4. Note any new medium/low vulnerabilities introduced (should not grow per SC-011)

**Acceptance Criteria**:
- [ ] No new critical/high CVEs present
- [ ] All remediable critical/high CVEs resolved
- [ ] Unfixable CVEs documented
- [ ] Audit report saved for compliance

**Risks**:
- npm audit may identify new CVEs (e.g., transitive dependencies updated)
- GitHub Advisory Database may be updated with new information
- Some packages may have released patches since initial audit

---

## Phase 3: Document OS-Level CVEs & Unfixable Vulnerabilities (User Story 3)

**Objective**: Create compliance documentation of unfixable vulnerabilities with impact analysis  
**Priority**: P2 (Required for compliance)  
**Acceptance Criteria**: docs/SECURITY_FINDINGS.md documents all unfixable CVEs with justification

### Task 3.1: Analyze Unfixable Vulnerabilities
**Description**: Classify and document all CVEs that cannot be remediated  
**Owner**: Security / DevOps  
**Effort**: 1-1.5 hours  
**Dependencies**: Phase 2 complete  
**Tools**: CVE databases, package documentation  
**Steps**:
1. For each vulnerable package that could not be updated:
   - Verify no patch version exists (check npm registry)
   - Verify no suitable alternative package exists
   - Confirm cannot be mitigated in code
   - OR document if fix would break API (need maintainer approval)
2. For each unfixable CVE, gather:
   - CVE ID (e.g., CVE-2024-1234)
   - Affected package name and version
   - Severity level (critical/high)
   - Reason unfixable (categories from Task 2.1)
   - Actual attack surface (is this exposed to external input?)
   - Mitigation strategies (e.g., network isolation, input validation)
3. For OS-level CVEs in node:25-bookworm-slim:
   - List each identified CVE ID
   - Document severity
   - Note that remediation requires node.js base image upgrade (out of scope)

**Acceptance Criteria**:
- [ ] All unfixable npm package CVEs analyzed and categorized
- [ ] OS-level CVEs from base image documented
- [ ] Attack surface for each unfixable CVE estimated
- [ ] Mitigation strategies identified where applicable
- [ ] Ready for compliance documentation

**Risks**:
- May be difficult to determine actual attack surface without security expertise
- False assumption that something is "truly unfixable" (requires verification)
- CVE databases may be incomplete or conflicting

---

### Task 3.2: Create GitHub Issues for Unfixable Vulnerabilities
**Description**: Create tracked issues for each unfixable CVE and documented CVE status  
**Owner**: DevOps / Project Management  
**Effort**: 0.5 hours  
**Dependencies**: Task 3.1 complete  
**Tools**: GitHub Issues API  
**Steps**:
1. For each unfixable npm package CVE:
   - Create GitHub Issue: Title = "CVE-XXXX: [Package Name] [Description]"
   - Label: "security/unfixable", "cve"
   - Include CVE ID, affected package, reason unfixable, attack surface analysis
   - Link to related issues (e.g., "blocked by", "duplicates")
2. For each OS-level CVE:
   - Create GitHub Issue: Title = "OS-CVE-XXXX: [node:25-bookworm-slim] [Description]"
   - Label: "security/os-level", "cve", "out-of-scope"
   - Document rationale for OS CVE acceptance
3. For vulnerability monitoring (rolling review per Q5):
   - Create GitHub Issue: "Security: Review unfixable CVEs for next maintenance cycle"
   - Label: "security", "maintenance"
   - Set for next quarter review

**Acceptance Criteria**:
- [ ] GitHub Issues created for all unfixable CVEs
- [ ] Issues linked and labeled appropriately
- [ ] Rolling review issue created for next cycle
- [ ] Issues ready for stakeholder review

**Risks**:
- GitHub issues may be missed by team if not properly labeled
- Issue descriptions need to be detailed enough for future audits

---

### Task 3.3: Create docs/SECURITY_FINDINGS.md
**Description**: Generate compliance-friendly documentation of unfixable vulnerabilities  
**Owner**: Security  
**Effort**: 1 hour  
**Dependencies**: Tasks 3.1, 3.2 complete  
**Tools**: Markdown  
**Steps**:
1. Create `docs/SECURITY_FINDINGS.md` with sections:
   - **Audit Summary**: Date, tools used, scope (npm packages + base image)
   - **Executive Summary**: Number of CVEs found, number remediated, number unfixable
   - **Unfixable npm Vulnerabilities**: Table with CVE ID | Package | Severity | Reason | Attack Surface | Mitigation
   - **OS-Level CVEs (Docker Base Image)**: Similar table for base image CVEs
   - **Remediation Timeline**: When fixes were applied
   - **Testing Results**: Test suite pass rate after patches
   - **Risk Assessment**: Business impact of unfixable CVEs (if any)
   - **Next Steps**: Link to rolling review issue, plan for future base image upgrades
2. Format as version-controlled document (include in git)
3. Ensure document is readable by non-technical stakeholders

**Acceptance Criteria**:
- [ ] docs/SECURITY_FINDINGS.md created with all required sections
- [ ] All unfixable CVEs documented with complete justification
- [ ] Document is compliance-audit ready
- [ ] Document links to related GitHub Issues

**Risks**:
- Document may be too technical or too vague for stakeholders
- Future maintenance required to keep document updated

---

## Phase 4: Final Verification & Compliance Reports (User Story 4)

**Objective**: Verify all critical/high vulnerabilities resolved, generate final audit reports  
**Priority**: P1 (Validation & compliance)  
**Acceptance Criteria**: All CVEs remediated or documented; 207/207 tests passing; Docker build succeeds

### Task 4.1: Run Final Comprehensive Audit
**Description**: Execute complete vulnerability scan to confirm clean state  
**Owner**: Security  
**Effort**: 1 hour  
**Dependencies**: Phase 3 complete  
**Tools**: npm audit  
**Steps**:
1. Clean install: `cd a:\council\server && rm -rf node_modules package-lock.json && npm install`
2. Run final npm audit: `npm audit --json > audit-final-report.json`
3. Verify audit results:
   - Zero critical-severity CVEs for direct dependencies ✓ (SC-001)
   - Zero high-severity CVEs for direct dependencies ✓ (SC-002)
4. Build and test again as final validation:
   - `npm run build:ts` (SC-006)
   - `npm test` (SC-006)
   - Docker rebuild (SC-007)
5. Compare audit reports: initial → after patches → final
6. Document timeline: which CVEs fixed by which updates

**Acceptance Criteria**:
- [ ] Final npm audit report generated
- [ ] No critical-severity CVEs in npm packages
- [ ] No high-severity CVEs in npm packages
- [ ] 207/207 tests pass with patched dependencies
- [ ] Docker build succeeds
- [ ] Audit timeline documented

**Risks**:
- npm audit database may update and report new CVEs
- Fresh install may expose different transitive dependencies
- Tests may fail if environment is different

---

### Task 4.2: Create docs/SECURITY_AUDIT.md (Compliance Report)
**Description**: Generate comprehensive methodology and audit evidence documentation  
**Owner**: Security / DevOps  
**Effort**: 1 hour  
**Dependencies**: Task 4.1 complete  
**Tools**: Markdown  
**Steps**:
1. Create `docs/SECURITY_AUDIT.md` with sections:
   - **Audit Metadata**
     - Date executed: [Date]
     - Tools used: npm audit (v[version]), GitHub Advisory Database
     - Scope: npm packages (direct + transitive) + Docker base image (node:25-bookworm-slim)
     - Methodology: [Description of audit process]
   - **Summary Statistics**
     - Initial vulnerabilities found: [Critical: X, High: X, Medium: X, Low: X]
     - Vulnerabilities remediated: [Critical: X, High: X]
     - Vulnerabilities accepted/unfixable: [Count by severity]
     - Current state: [Critical: 0, High: 0 for npm packages]
   - **Detailed Findings** (per Phase 1-3)
     - npm audit results (critical/high only)
     - Remediation actions taken
     - Docker base image CVE documentation
   - **Remediation Actions**
     - [Package]: [Old Version] → [New Version] - Fixed [CVE list]
     - [List all updates applied]
   - **Test Results**
     - Test suite: [Start] → [After patches] → [Final]: 207/207 passing ✓
     - Docker build: Successful ✓
     - Link to test logs
   - **Compliance & Reproducibility**
     - How to re-run audit: `npm audit --json`
     - How to re-run tests: `npm test`
     - How to rebuild Docker: `.\rebuild-docker.ps1`
     - Success criteria met: [Checkbox list]
   - **Linked Resources**
     - Link to docs/SECURITY_FINDINGS.md (unfixable CVEs)
     - Link to GitHub Issues (per-CVE tracking)
2. Save as version-controlled documentation

**Acceptance Criteria**:
- [ ] docs/SECURITY_AUDIT.md created with full methodology and evidence
- [ ] Audit is reproducible (documented steps)
- [ ] Summary statistics accurate
- [ ] All success criteria checked
- [ ] Document ready for compliance audit

**Risks**:
- Document may be very long if many CVEs
- Formatting may not render well across tools

---

### Task 4.3: Link GitHub Issues to Remediation Commits
**Description**: Create audit trail of fixes in issue tracking  
**Owner**: DevOps / Project Management  
**Effort**: 0.5 hours  
**Dependencies**: Task 4.2 complete  
**Tools**: GitHub Issues  
**Steps**:
1. For each critical/high CVE that was fixed:
   - Create GitHub Issue (if not already exists): "CVE-XXXX: [Package] - FIXED in v[version]"
   - Label: "security/fixed", "cve"
   - Include: CVE description, which commit/PR fixed it, date fixed
   - Close issue with comment linking to PR
2. For each unfixable CVE:
   - Verify issue already exists (Task 3.2)
   - Link to docs/SECURITY_FINDINGS.md entry
   - Label: "security/unfixable"
   - Do not close (leave for future review)
3. Create summary issue: "Security Audit 2026-02-11 - Summary"
   - Label: "security", "audit"
   - Link to all CVE issues
   - Link to docs/SECURITY_AUDIT.md and docs/SECURITY_FINDINGS.md

**Acceptance Criteria**:
- [ ] GitHub Issues created and linked for all CVEs (fixed and unfixable)
- [ ] Issues labeled appropriately
- [ ] Summary issue provides audit trail overview
- [ ] Issues ready for compliance review

---

### Task 4.4: Validate Success Criteria
**Description**: Final checklist that all success criteria are met  
**Owner**: Security  
**Effort**: 0.5 hours  
**Dependencies**: All Phase 4 tasks complete  
**Tools**: Checklist  
**Steps**:
1. Verify each success criterion:
   - **SC-001**: Zero critical-severity CVEs in npm ✓
   - **SC-002**: Zero high-severity CVEs in npm ✓
   - **SC-003**: OS CVEs documented in docs/SECURITY_FINDINGS.md ✓
   - **SC-004**: High-severity npm CVE vulnerabilities resolved ✓
   - **SC-005**: 100% of remediable critical/high CVEs updated ✓
   - **SC-006**: 207/207 tests pass after security patches ✓
   - **SC-007**: Docker image builds successfully ✓
   - **SC-008**: Unfixable vulnerabilities documented in docs/SECURITY_FINDINGS.md ✓
   - **SC-009**: Audit reproducible (steps documented in docs/SECURITY_AUDIT.md) ✓
   - **SC-010**: All security findings addressed within 2 iterations (plan + execution) ✓
   - **SC-011**: Medium/low CVE count does not grow ✓
2. Sign off on completion

**Acceptance Criteria**:
- [ ] All 11 success criteria verified as met
- [ ] Documentation complete and accurate
- [ ] Audit ready for stakeholder review
- [ ] Implementation complete

---

## Risk Register & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Security patches introduce breaking changes | Medium | High | Task 2.3 (test suite validation); mark as unfixable if breaking |
| npm audit report changes between scans | Low | Medium | Compare reports; document any new findings; document as "out of scope" if new |
| Some CVEs unfixable without major version upgrade | Medium | Medium | Document in docs/SECURITY_FINDINGS.md; create rolling review issue |
| OS-level CVEs cannot be fixed (base image responsibility) | High | Low | Accept per clarification Q2; document as unfixable; link to rolling review |
| Test failures due to incompatible packages | Medium | High | Work through as part of Task 2.3; consider package alternatives |
| Docker build fails after patches | Medium | High | Debug during Task 2.4; likely transitive dependency issues |
| Team not aware of unfixable CVEs (compliance liability) | Low | High | Create GitHub Issues (Task 3.2); ensure docs/SECURITY_FINDINGS.md visible |
| CVE database updates during audit | Low | Medium | Use snapshot of GitHub Advisory Database at start date; document version |

---

## Dependencies & Sequencing

```
Phase 1 (Discovery)
├─ Task 1.1: npm audit scan ─┐
├─ Task 1.2: OS CVE scan ────┤─ Task 1.3: Inventory report
└─ (parallel, 1.5 hours)  ───┘

Phase 2 (Remediation)
├─ Task 2.1: Analyze remediation paths (1-2 hours)
├─ Task 2.2: Apply patches (0.5-1 hour)
├─ Task 2.3: Test suite (1-2 hours)
├─ Task 2.4: Docker build (1 hour)
└─ Task 2.5: First verification (0.5 hours)
(sequential, 4-8 hours)

Phase 3 (Documentation)
├─ Task 3.1: Analyze unfixable (1-1.5 hours)
├─ Task 3.2: GitHub Issues (0.5 hours)
└─ Task 3.3: SECURITY_FINDINGS.md (1 hour)
(sequential, 2.5-3 hours)

Phase 4 (Verification)
├─ Task 4.1: Final audit (1 hour)
├─ Task 4.2: SECURITY_AUDIT.md (1 hour)
├─ Task 4.3: Link issues (0.5 hours)
└─ Task 4.4: Success criteria validation (0.5 hours)
(sequential, 3 hours)

Total: ~9-16 hours
```

---

## Deliverables

| Deliverable | Format | Owner | Phase | Criteria |
|------------|--------|-------|-------|----------|
| Initial npm audit report | JSON | Security | 1 | All CVEs discovered |
| OS CVE inventory | Markdown temp | DevOps | 1 | Documented for reference |
| Remediation strategy | Analysis doc | Dev/Security | 2 | All critical/high paths identified |
| Updated package.json | File | Dev | 2 | Patches applied, npm install succeeds |
| Test suite results | Test output | QA | 2 | 207/207 passing |
| Docker build artifact | Docker image | DevOps | 2 | Builds successfully, health check passes |
| docs/SECURITY_FINDINGS.md | Markdown (persistent) | Security | 3 | All unfixable CVEs documented |
| GitHub Issues | Issue tracking | DevOps | 3 | All CVEs tracked with links |
| docs/SECURITY_AUDIT.md | Markdown (persistent) | Security | 4 | Methodology and evidence documented |
| Final audit report | JSON | Security | 4 | Zero critical/high CVEs |
| Success criteria sign-off | Checklist | Security | 4 | All 11 criteria verified |

---

## Team Responsibilities

- **Security**: Oversight, CVE analysis, documentation, compliance validation
- **DevOps**: npm audit execution, base image analysis, Docker build testing, GitHub issue management
- **Development**: Patch compatibility testing, code changes if needed, test suite validation

---

## Quality Assurance Checkpoints

- [ ] **Checkpoint 1 (After Phase 1)**: Vulnerability inventory accurate and complete
- [ ] **Checkpoint 2 (After Phase 2)**: All tests passing, no regressions, Docker build succeeds
- [ ] **Checkpoint 3 (After Phase 3)**: Documentation complete, GitHub Issues linked, unfixable CVEs justified
- [ ] **Checkpoint 4 (After Phase 4)**: Success criteria met, audit reproducible, compliance ready

---

## Next Steps

1. Assign task owners from team
2. Begin Phase 1 immediately (discovery has no blockers)
3. Schedule daily sync for Phase 2 (remediation may hit unexpected issues)
4. Plan for 1-2 iterations minimum (per SC-010)
5. Create GitHub Projects board to track tasks
6. Upon completion: present audit results to security and compliance stakeholders
