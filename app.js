
const STRATEGIES = {
  githubFlow: {
    label: "GitHub Flow",
    tagline: "One long-lived production branch, short-lived feature and hotfix branches.",
    bestFor: "Best for: product teams releasing many times per day with strong PR discipline.",
    gate: "Release gate: Required PR review plus green checks before merge to main.",
    lanes: [
      { id: "main", label: "main", color: "#1f4c77" },
      { id: "feature", label: "feature/*", color: "#557eaa" },
      { id: "hotfix", label: "hotfix/*", color: "#c04f3f" }
    ],
    pros: [
      "Simple to teach and easy for new Git users to follow.",
      "Continuous delivery from main keeps lead time low.",
      "PR checks and code owners provide clear quality control."
    ],
    cons: [
      "Can feel risky if tests are weak or flaky.",
      "Less structure for long release hardening cycles.",
      "Large enterprise release approvals may need extra controls."
    ],
    toolchain: [
      {
        stage: "Work Intake",
        tool: "Jira / Azure Boards",
        detail: "Branch names include ticket IDs so work items map directly to PRs."
      },
      {
        stage: "Review Gate",
        tool: "GitHub Pull Requests",
        detail: "CODEOWNERS and required approvals prevent unreviewed merges."
      },
      {
        stage: "CI Validation",
        tool: "GitHub Actions",
        detail: "Build, unit tests, integration tests, and SAST run on every PR."
      },
      {
        stage: "CD Delivery",
        tool: "Argo CD / Actions Deploy",
        detail: "Merged commits on main trigger the release build and downstream deployment flow."
      },
      {
        stage: "Operate",
        tool: "Datadog / New Relic",
        detail: "Release markers and alerts validate production behavior after deploy."
      }
    ],
    comparison: {
      learningCurve: "Low",
      releaseCadence: "Very high",
      governance: "Light to medium",
      emergency: "Fast hotfix branch + expedited PR",
      rollback: "Rollback PR to main; FlexDeploy restore optional",
      teamFit: "SaaS teams shipping continuously"
    },
    scenarios: {
      standard: {
        title: "Standard Change",
        summary: "Normal feature delivery with peer review and automated CI as hard gates.",
        caption: "Feature branch to PR to main to deploy.",
        steps: [
          {
            lane: "main",
            note: "Stable base",
            action: "Sync with latest production baseline on main.",
            command: "git checkout main && git pull"
          },
          {
            lane: "feature",
            note: "Start feature",
            action: "Create a feature branch for the ticket scope.",
            command: "git checkout -b feature/order-discount"
          },
          {
            lane: "feature",
            note: "Validate",
            action: "Commit and push increments; feature-branch CI runs validation builds on every push.",
            command: "git add . && git commit -m \"feat: order discount\" && git push -u origin feature/order-discount"
          },
          {
            lane: "main",
            note: "PR merge",
            action: "Open PR, get approval, merge after required checks pass.",
            command: "Open PR: feature/order-discount -> main"
          },
          {
            lane: "main",
            note: "Release",
            action: "Build the release artifact from main, then deploy and monitor health metrics.",
            command: "Build and deploy merged main commit through CD pipeline"
          }
        ],
        devops: [
          "CI trigger: every PR update runs full test and security suite.",
          "Policy: branch protection blocks merge until checks and approvals complete.",
          "CD: merge to main builds the release artifact once, then promotes it through staging and production with observability checks."
        ]
      },
      emergency: {
        title: "Emergency Change",
        summary: "Urgent production issue handled through a short hotfix lane with accelerated review.",
        caption: "Hotfix from main, urgent PR, immediate deploy.",
        steps: [
          {
            lane: "main",
            note: "Incident",
            action: "Confirm production defect and identify failing commit.",
            command: "git checkout main && git pull"
          },
          {
            lane: "hotfix",
            note: "Hotfix branch",
            action: "Create isolated hotfix branch from main.",
            command: "git checkout -b hotfix/payment-timeout"
          },
          {
            lane: "hotfix",
            note: "Patch + tests",
            action: "Implement patch and run focused regression tests on the hotfix branch.",
            command: "git commit -am \"fix: payment timeout\" && git push -u origin hotfix/payment-timeout"
          },
          {
            lane: "main",
            note: "Emergency merge",
            action: "Use expedited PR policy to merge once critical checks pass.",
            command: "Open urgent PR: hotfix/payment-timeout -> main"
          },
          {
            lane: "main",
            note: "Deploy now",
            action: "Build the release artifact from merged main, deploy immediately, and track incident dashboards.",
            command: "Promote main-branch hotfix artifact to production"
          }
        ],
        devops: [
          "CI trigger: emergency pipeline runs smoke + critical integration tests.",
          "Policy: incident role can approve with reduced reviewer quorum.",
          "Ops: deployment and observability runbook linked to incident ticket."
        ]
      },
      rollback: {
        title: "Rollback",
        summary: "Regression response by reverting through an approved rollback PR into main so the release artifact is rebuilt from protected main and restored quickly.",
        caption: "Rollback branch + PR to main, then redeploy.",
        steps: [
          {
            lane: "main",
            note: "Detect regression",
            action: "Detect release impact through alerts and user telemetry.",
            command: "Identify bad commit SHA from deployment record"
          },
          {
            lane: "feature",
            note: "Rollback branch",
            action: "Create rollback branch from protected main and revert the problematic commit.",
            command:
              "git checkout main && git pull && git checkout -b rollback/payment-timeout && git revert <bad-sha| -m 1 <merge-sha>> && git push -u origin rollback/payment-timeout"
          },
          {
            lane: "main",
            note: "Rollback PR",
            action: "Open rollback PR to main and let required checks validate rollback safety.",
            command: "Open PR: rollback/payment-timeout -> main"
          },
          {
            lane: "main",
            note: "Redeploy",
            action: "CD rebuilds the release artifact from the approved rollback merge on main, then restores stable behavior.",
            command: "Deploy latest green main commit"
          },
          {
            lane: "feature",
            note: "Follow-up",
            action: "Create follow-up branch for root-cause fix.",
            command: "git checkout -b feature/root-cause-fix"
          }
        ],
        devops: [
          "Rollback path is deterministic because production always follows artifacts rebuilt from main.",
          "Audit trail stays clean: rollback PR and merge commit are explicit and traceable.",
          "Post-incident action: add regression test to pipeline before re-introducing change."
        ]
      }
    }
  },
  releaseFlow: {
    label: "Release Flow",
    tagline: "main integrates changes, release branches carry governed QA, staging, and production promotion.",
    bestFor:
      "Best for: teams that merge regularly to main but need release branches for slower approvals or shared QA/UAT sign-off.",
    gate: "Release gate: merge to protected release/*, build once there, then promote with approvals.",
    lanes: [
      { id: "main", label: "main", color: "#1f4c77" },
      { id: "feature", label: "feature/*", color: "#557eaa" },
      { id: "release", label: "release/*", color: "#b27829" },
      { id: "hotfix", label: "hotfix/*", color: "#c04f3f" }
    ],
    pros: [
      "Clear separation between integration on main and governed release promotion on release branches.",
      "Supports build once, promote same artifact across shared QA, staging, and production.",
      "Fits teams where release approvals or QA sign-off take days."
    ],
    cons: [
      "More branch coordination than GitHub Flow.",
      "Requires discipline to sync release fixes back to main.",
      "main can move ahead of the currently shipping release branch."
    ],
    toolchain: [
      {
        stage: "Work Intake",
        tool: "Jira / Azure Boards",
        detail: "Features merge to main, while release tickets and approvals map to release branches."
      },
      {
        stage: "Review Gate",
        tool: "Pull Requests + Branch Protection",
        detail: "PR rules protect both main and active release branches."
      },
      {
        stage: "CI Validation",
        tool: "GitHub Actions / Jenkins",
        detail: "Feature branches validate quickly; release branches run heavier suites before promotion."
      },
      {
        stage: "Release Mgmt",
        tool: "Release Branches + Tags",
        detail: "Protected release/* branches drive immutable artifact records, with tags used as version labels."
      },
      {
        stage: "Operate",
        tool: "FlexDeploy + ITSM + Monitoring",
        detail: "Approvals, deployment windows, and audit evidence follow the release branch artifact."
      }
    ],
    comparison: {
      learningCurve: "Medium",
      releaseCadence: "High",
      governance: "Medium to high",
      emergency: "Hotfix into active release, then sync main",
      rollback: "Rollback on release branch, then sync main",
      teamFit: "Teams with slow approvals and shared QA/UAT"
    },
    scenarios: {
      standard: {
        title: "Standard Change",
        summary:
          "Feature work merges to main under normal PR policy, then a release branch is cut from main so shared QA, staging, and production can all promote the same artifact version.",
        caption: "feature -> main -> release -> QA/staging/prod.",
        steps: [
          {
            lane: "main",
            note: "Sync main",
            action: "Start from the current integration baseline on main.",
            command: "git checkout main && git pull"
          },
          {
            lane: "feature",
            note: "Feature branch",
            action: "Create a short-lived feature branch for the change.",
            command: "git checkout -b feature/order-discount"
          },
          {
            lane: "feature",
            note: "Validate",
            action: "Commit and push incremental work; feature-branch CI validates the change.",
            command: "git add . && git commit -m \"feat: order discount\" && git push -u origin feature/order-discount"
          },
          {
            lane: "main",
            note: "Merge to main",
            action: "Merge approved PR into protected main once checks pass.",
            command: "Open PR: feature/order-discount -> main"
          },
          {
            lane: "release",
            note: "Cut release",
            action: "Create a release branch from the merged main commit for shared QA and staging sign-off.",
            command: "git checkout main && git pull && git checkout -b release/2026.03 && git push -u origin release/2026.03"
          },
          {
            lane: "release",
            note: "Tag + promote",
            action: "Tag the approved release branch and promote that same artifact through QA, staging, and production.",
            command: "git checkout release/2026.03 && git tag rel-2026.03.0 && git push origin release/2026.03 --follow-tags"
          },
          {
            lane: "main",
            note: "Sync fixes",
            action: "Cherry-pick or merge any release-branch-only fixes back to main so integration history stays aligned.",
            command: "git checkout main && git cherry-pick <release-fix-sha>"
          }
        ],
        devops: [
          "Feature branches run validation builds only; formal release builds start from release/*.",
          "Shared QA and staging validate the release branch artifact, not a feature branch build.",
          "FlexDeploy promotes one release-branch artifact across environments, even if production approval takes days."
        ]
      },
      emergency: {
        title: "Emergency Change",
        summary:
          "Urgent production fixes start from the active release branch or production tag, then the fix is synchronized back to main after the emergency deploy.",
        caption: "active release -> hotfix -> release deploy -> sync main.",
        steps: [
          {
            lane: "release",
            note: "Active release",
            action: "Start from the currently shipping release branch or production tag.",
            command: "git checkout release/2026.03 && git pull"
          },
          {
            lane: "hotfix",
            note: "Hotfix branch",
            action: "Create a hotfix branch from the active release baseline.",
            command: "git checkout -b hotfix/2026.03.1 release/2026.03"
          },
          {
            lane: "hotfix",
            note: "Patch + test",
            action: "Implement the fix and run focused regression checks.",
            command: "git commit -am \"fix: payment timeout\" && git push -u origin hotfix/2026.03.1"
          },
          {
            lane: "release",
            note: "Merge to release",
            action: "Merge the approved hotfix into the active release branch so the release artifact stays authoritative.",
            command: "Open PR: hotfix/2026.03.1 -> release/2026.03"
          },
          {
            lane: "release",
            note: "Tag + deploy",
            action: "Tag the patched release branch and promote that patch artifact to production.",
            command: "git checkout release/2026.03 && git tag rel-2026.03.1 && git push origin release/2026.03 --follow-tags"
          },
          {
            lane: "main",
            note: "Sync main",
            action: "Cherry-pick or merge the hotfix back to main so future releases include it.",
            command: "git checkout main && git cherry-pick <hotfix-sha>"
          }
        ],
        devops: [
          "Emergency release builds come from the patched active release/* branch after hotfix PR merge, not directly from the hotfix branch.",
          "The same hotfix artifact is validated once and promoted through the governed release path.",
          "Source alignment back to main is mandatory after the emergency release."
        ]
      },
      rollback: {
        title: "Rollback",
        summary:
          "Rollback reverts the bad change on the active release branch, redeploys the rebuilt release artifact, then synchronizes that rollback back to main.",
        caption: "release rollback branch -> release deploy -> sync main.",
        steps: [
          {
            lane: "release",
            note: "Identify release",
            action: "Locate the active release branch or tag that contains the bad change.",
            command: "git checkout release/2026.03 && git pull"
          },
          {
            lane: "hotfix",
            note: "Rollback branch",
            action: "Create a rollback branch from the active release branch and revert the bad commit.",
            command: "git checkout -b rollback/2026.03.2 release/2026.03 && git revert <bad-sha> && git push -u origin rollback/2026.03.2"
          },
          {
            lane: "release",
            note: "Rollback PR",
            action: "Open rollback PR to the protected release branch and run required checks.",
            command: "Open PR: rollback/2026.03.2 -> release/2026.03"
          },
          {
            lane: "release",
            note: "Retag + deploy",
            action: "Retag the corrected release branch and redeploy that rebuilt release artifact.",
            command: "git checkout release/2026.03 && git tag rel-2026.03.2 && git push origin release/2026.03 --follow-tags"
          },
          {
            lane: "main",
            note: "Sync main",
            action: "Cherry-pick or merge the rollback correction back to main so the next release stays aligned.",
            command: "git checkout main && git cherry-pick <rollback-sha>"
          }
        ],
        devops: [
          "Fast environment recovery can still happen first by redeploying a tracked good version in FlexDeploy.",
          "Authoritative Git rollback happens on the active release branch, because that branch owns the promoted artifact.",
          "Main must be synchronized after rollback so the next release does not reintroduce the reverted change."
        ]
      }
    }
  },
  gitFlow: {
    label: "Git Flow",
    tagline: "Structured multi-branch model with dedicated develop, release, and hotfix lanes.",
    bestFor: "Best for: enterprise products needing release hardening and predictable versioned releases.",
    gate: "Release gate: release branch stabilization plus formal merge/tag flow.",
    lanes: [
      { id: "main", label: "main", color: "#1f4c77" },
      { id: "develop", label: "develop", color: "#2f8f83" },
      { id: "feature", label: "feature/*", color: "#557eaa" },
      { id: "release", label: "release/*", color: "#b27829" },
      { id: "hotfix", label: "hotfix/*", color: "#c04f3f" }
    ],
    pros: [
      "Strong separation between in-progress work and releasable code.",
      "Release branches provide explicit stabilization period.",
      "Clear hotfix protocol for production incidents."
    ],
    cons: [
      "Higher coordination overhead and merge complexity.",
      "Long-lived branches can accumulate drift.",
      "Slower feedback if release cycle is heavy."
    ],
    toolchain: [
      {
        stage: "Work Intake",
        tool: "Jira + Release Calendar",
        detail: "Feature tickets map to develop lane, releases map to release branches."
      },
      {
        stage: "Review Gate",
        tool: "PR/MR Policies",
        detail: "Different reviewer rules for feature, release, and hotfix merges."
      },
      {
        stage: "CI Validation",
        tool: "Jenkins / GitHub Actions",
        detail: "Branch-specific pipelines test develop, release hardening, and hotfixes."
      },
      {
        stage: "Release Mgmt",
        tool: "Artifact Registry + Tags",
        detail: "Version tags on main drive immutable artifact release records."
      },
      {
        stage: "Operate",
        tool: "ServiceNow + Monitoring",
        detail: "Change approvals and production telemetry support controlled launches."
      }
    ],
    comparison: {
      learningCurve: "High",
      releaseCadence: "Medium",
      governance: "High",
      emergency: "Dedicated hotfix branch from main",
      rollback: "Revert via hotfix and retag",
      teamFit: "Large teams with scheduled release trains"
    },
    scenarios: {
      standard: {
        title: "Standard Change",
        summary: "Feature work merges into develop, then release branch prepares version for production.",
        caption: "feature -> develop -> release -> main (+ back-merge).",
        steps: [
          {
            lane: "develop",
            note: "Integration base",
            action: "Start from synchronized develop branch.",
            command: "git checkout develop && git pull"
          },
          {
            lane: "feature",
            note: "Feature branch",
            action: "Create feature branch from develop and implement change.",
            command: "git checkout -b feature/invoice-summary"
          },
          {
            lane: "develop",
            note: "Integrate feature",
            action: "Merge approved feature branch into develop.",
            command: "Open PR: feature/invoice-summary -> develop"
          },
          {
            lane: "release",
            note: "Release cut",
            action: "Create release branch for stabilization and UAT.",
            command: "git checkout -b release/2.4.0 develop && git push -u origin release/2.4.0"
          },
          {
            lane: "main",
            note: "Tag release",
            action: "Merge release into main, tag version, and publish artifact.",
            command: "git checkout main && git merge --no-ff release/2.4.0 && git tag v2.4.0 && git push --follow-tags"
          },
          {
            lane: "develop",
            note: "Back-merge",
            action: "Merge release branch back into develop to keep history aligned.",
            command: "git checkout develop && git merge --no-ff release/2.4.0 && git push origin develop"
          }
        ],
        devops: [
          "CI split: quick validation builds on feature branches, expanded suites on release branches.",
          "Release pipeline can include manual approval, security sign-off, and performance gate.",
          "Artifact versioning is tied to release branches or main tags so deployments never come directly from feature branches."
        ]
      },
      emergency: {
        title: "Emergency Change",
        summary: "Urgent production fix starts from main and is merged back to both main and develop.",
        caption: "hotfix from main with dual merge-back.",
        steps: [
          {
            lane: "main",
            note: "Incident start",
            action: "Branch from current production version on main.",
            command: "git checkout main && git pull"
          },
          {
            lane: "hotfix",
            note: "Hotfix branch",
            action: "Create hotfix branch to isolate urgent patch.",
            command: "git checkout -b hotfix/2.4.1"
          },
          {
            lane: "hotfix",
            note: "Patch and test",
            action: "Implement fix and run production-critical test suite.",
            command: "git commit -am \"fix: tax rounding\" && git push -u origin hotfix/2.4.1"
          },
          {
            lane: "main",
            note: "Release patch",
            action: "Merge hotfix into main, tag patch release, build the release artifact, and deploy.",
            command: "Open PR: hotfix/2.4.1 -> main, merge, then tag v2.4.1 from main"
          },
          {
            lane: "develop",
            note: "Merge back",
            action: "Merge hotfix into develop to avoid regression in future releases.",
            command: "Open PR: hotfix/2.4.1 -> develop"
          }
        ],
        devops: [
          "Hotfix pipeline is optimized for speed but still enforces smoke and security checks.",
          "Patch tag creates the auditable release artifact from main and preserves incident traceability.",
          "Dual-merge automation helps prevent missing hotfixes in develop."
        ]
      },
      rollback: {
        title: "Rollback",
        summary: "Rollback is delivered as a controlled hotfix release that reverts problematic changes.",
        caption: "revert release via hotfix branch and retag.",
        steps: [
          {
            lane: "main",
            note: "Identify version",
            action: "Locate failing release tag on main.",
            command: "git checkout main && git pull"
          },
          {
            lane: "hotfix",
            note: "Rollback branch",
            action: "Create rollback hotfix branch from main.",
            command: "git checkout -b hotfix/revert-v2.4.0"
          },
          {
            lane: "hotfix",
            note: "Revert commit",
            action: "Revert faulty change set and validate release tests.",
            command: "git revert <bad-sha| -m 1 <merge-sha>> && git push -u origin hotfix/revert-v2.4.0"
          },
          {
            lane: "main",
            note: "Retag release",
            action: "Open rollback PR to protected main, merge after checks, then publish patch tag.",
            command: "Open PR: hotfix/revert-v2.4.0 -> main, merge, then tag v2.4.2 from main"
          },
          {
            lane: "develop",
            note: "Sync rollback",
            action: "Merge rollback hotfix back into develop to keep branches consistent.",
            command: "git checkout develop && git merge --no-ff hotfix/revert-v2.4.0 && git push origin develop"
          }
        ],
        devops: [
          "Rollback remains compliant because it follows normal hotfix release process.",
          "Version tag progression preserves artifact traceability for auditors.",
          "Post-incident release branch can hold additional hardening before next train."
        ]
      }
    }
  },
  trunkBased: {
    label: "Trunk-Based Development",
    tagline:
      "Very short-lived branches merged rapidly into protected trunk, with validation on short-lived branches and release builds produced only after merge to protected trunk, plus optional release controls like feature flags.",
    bestFor: "Best for: high-velocity platforms practicing continuous delivery and progressive rollout.",
    gate: "Release gate: trunk health, automated tests, and optional runtime release controls (for example feature flags).",
    lanes: [
      { id: "trunk", label: "trunk (main)", color: "#1f4c77" },
      { id: "short", label: "short-lived feature/*", color: "#557eaa" },
      { id: "flag", label: "optional release controls", color: "#2f8f83", kind: "control" }
    ],
    pros: [
      "Minimizes merge drift with fast integration.",
      "Supports rapid experimentation via feature flags when the platform supports them.",
      "Optimized for continuous deployment and quick recovery."
    ],
    cons: [
      "Requires excellent automated testing and observability.",
      "Demands strong engineering discipline for small batch sizes.",
      "Can be uncomfortable for teams used to long-lived branches."
    ],
    toolchain: [
      {
        stage: "Work Intake",
        tool: "Backlog + Small Batch Rules",
        detail: "Stories are sliced into increments small enough to merge daily."
      },
      {
        stage: "Review Gate",
        tool: "Lightweight PR + Pairing",
        detail: "Short PRs reviewed fast to protect trunk throughput."
      },
      {
        stage: "CI Validation",
        tool: "Fast Parallel Pipeline",
        detail: "Build, test, security, and smoke checks complete in minutes."
      },
      {
        stage: "CD Delivery",
        tool: "Progressive Delivery",
        detail: "Trunk builds the release artifact continuously, then deploys it with canary and optional feature-flag rollout."
      },
      {
        stage: "Operate",
        tool: "Release Controls + SLOs",
        detail: "Optional runtime controls (such as flags) plus SLO alerts provide additional confidence."
      }
    ],
    comparison: {
      learningCurve: "Medium to high",
      releaseCadence: "Continuous",
      governance: "Automation-centric",
      emergency: "Micro-branch hotfix + expedited PR to trunk",
      rollback: "Optional runtime disable, then rollback PR to trunk; FlexDeploy restore optional",
      teamFit: "Mature DevOps teams with strong CI/CD"
    },
    scenarios: {
      standard: {
        title: "Standard Change",
        summary: "Small changes validate on short-lived branches, merge to trunk quickly, then build once from trunk and roll out progressively using optional runtime controls where available.",
        caption: "small branch, same-day merge, progressive release.",
        steps: [
          {
            lane: "trunk",
            note: "Sync trunk",
            action: "Start from healthy trunk branch.",
            command: "git checkout main && git pull"
          },
          {
            lane: "short",
            note: "Small branch",
            action: "Create short-lived branch for a narrow code change.",
            command: "git checkout -b feature/search-ranking"
          },
          {
            lane: "trunk",
            note: "Fast merge",
            action: "Merge quickly once fast CI and review pass.",
            command: "Open PR: feature/search-ranking -> main"
          },
          {
            lane: "flag",
            note: "Flag off",
            action: "If supported, deploy the trunk-built artifact dark and keep runtime control disabled by default.",
            command: "Optional: deploy trunk artifact with feature flag/control set OFF"
          },
          {
            lane: "flag",
            note: "Progressive on",
            action: "If supported, increase feature exposure gradually with telemetry guardrails.",
            command: "Optional: increase rollout from 5% to 100% based on SLO health"
          }
        ],
        devops: [
          "CI is optimized for sub-10-minute feedback on short-lived branches so trunk stays releasable.",
          "Feature flags can decouple deployment from release decisions when available.",
          "Progressive delivery uses canary metrics to control blast radius."
        ]
      },
      emergency: {
        title: "Emergency Change",
        summary:
          "Critical production incident handled with micro-branch validation, expedited PR merge to trunk, and rapid redeploy of the new trunk artifact.",
        caption:
          "micro-branch hotfix -> expedited PR to trunk -> redeploy, with optional runtime containment when available.",
        steps: [
          {
            lane: "trunk",
            note: "Incident detect",
            action: "Identify trunk commit or runtime behavior causing incident.",
            command: "Use release marker and telemetry to identify suspect change"
          },
          {
            lane: "short",
            note: "Micro branch",
            action: "Create tiny emergency branch from trunk; no direct human commits on protected trunk.",
            command:
              "git checkout main && git pull && git checkout -b fix/session-token-expiry && git push -u origin fix/session-token-expiry"
          },
          {
            lane: "trunk",
            note: "Immediate merge",
            action: "Merge emergency fix through expedited PR after fast smoke and security checks.",
            command: "Open expedited PR: fix/session-token-expiry -> main"
          },
          {
            lane: "trunk",
            note: "Redeploy",
            action: "Auto-deploy the updated artifact built from merged trunk to production.",
            command: "Promote latest trunk artifact through CD"
          },
          {
            lane: "flag",
            note: "Containment",
            action: "If supported, use runtime controls for temporary containment.",
            command: "Optional: set affected feature flag/control OFF while monitoring recovers"
          }
        ],
        devops: [
          "Emergency flow emphasizes very fast CI with mandatory smoke gates.",
          "Keep direct human commits blocked on protected trunk even during incidents; use expedited PR policy instead.",
          "Runbook can use an instant feature-flag kill switch when that capability exists.",
          "Post-incident automation should add a regression test before closeout."
        ]
      },
      rollback: {
        title: "Rollback",
        summary:
          "Canonical trunk-based rollback is source-level revert via rollback branch and approved PR to trunk. Optional runtime-control disable (when available) is temporary containment only.",
        caption: "optional containment (if available) -> rollback branch -> rollback PR to trunk -> redeploy.",
        steps: [
          {
            lane: "flag",
            note: "Immediate stop",
            action: "If supported, disable failing runtime control to reduce user impact in seconds.",
            command: "Optional: set feature flag/control OFF globally"
          },
          {
            lane: "short",
            note: "Rollback branch",
            action:
              "Create rollback branch from protected trunk and revert problematic commit; use git revert -m 1 <merge-sha> when reverting a merge commit.",
            command:
              "git checkout main && git pull && git checkout -b rollback/session-token && git revert <bad-sha| -m 1 <merge-sha>> && git push -u origin rollback/session-token"
          },
          {
            lane: "trunk",
            note: "Rollback PR",
            action: "Open rollback PR to trunk, run fast pipeline plus smoke tests, then merge.",
            command: "Open PR: rollback/session-token -> main"
          },
          {
            lane: "trunk",
            note: "Redeploy revert",
            action: "Redeploy merged revert artifact from trunk to production.",
            command: "Deploy latest green main build"
          },
          {
            lane: "short",
            note: "Forward fix",
            action: "Create follow-up branch for improved implementation.",
            command: "git checkout -b feature/rework-session-token"
          }
        ],
        devops: [
          "Fastest blast-radius reduction can come from runtime-control disable when supported.",
          "Phase 1 service recovery can happen first by redeploying a tracked good version; phase 2 source-of-truth recovery is the explicit revert PR to trunk, which rebuilds the canonical trunk artifact.",
          "Observability gates confirm rollback success before re-enabling feature."
        ]
      }
    }
  }
};

const SCENARIO_LABELS = {
  standard: "Standard Change",
  emergency: "Emergency Change",
  rollback: "Rollback"
};

const STRATEGY_ORDER = ["trunkBased", "githubFlow", "releaseFlow", "gitFlow"];
const ROLLBACK_MODE_ORDER = ["pr", "automation"];
const ROLLBACK_MODES = {
  pr: {
    label: "Git History via PR (Default)",
    summary: "Rollback branch plus approved PR merge to the protected release branch or main/trunk."
  },
  automation: {
    label: "Git History via Automation (Exception)",
    summary:
      "Break-glass only: trusted automation identity performs rollback commit on the protected release branch or main/trunk with explicit approval, time-bound exception, and audit trail."
  }
};

const FLEXDEPLOY_PLAYBOOK = {
  trunkBased: {
    summary:
      "Best when trunk stays releasable and FlexDeploy owns downstream promotion, release windows, and production approval.",
    positioning:
      "Keep code review and branch protection in the Git host. Use feature branches only for validation builds. After merge, let FlexDeploy build once from trunk or main, approve once, and promote the same artifact everywhere.",
    trigger: "Trigger: merge to trunk/main",
    reviewGate: "Review: PR + required checks",
    prodGate: "Prod gate: Approval Gate or change ticket",
    flow: [
      "Developer opens a short-lived pull request into trunk or main after feature-branch validation builds pass.",
      "Git host enforces required reviews, status checks, and branch protection before merge.",
      "The approved merge emits a push webhook to a FlexDeploy Incoming Webhook.",
      "FlexDeploy builds once from the merged trunk/main commit and records the releaseable artifact or snapshot against that SHA.",
      "Lower environments can promote automatically from the same built artifact.",
      "Production pauses at an Approval Gate or External Approval Gate, then deploys and sends notifications."
    ],
    stages: [
      {
        title: "Git Event",
        detail: "Post-merge push on trunk or main becomes the single release trigger."
      },
      {
        title: "Incoming Webhook",
        detail: "FlexDeploy webhook function routes the payload to the correct project and version metadata."
      },
      {
        title: "Build Once",
        detail: "Create one immutable build or snapshot from the approved commit."
      },
      {
        title: "Governed Promotion",
        detail: "Auto-promote through lower environments, then stop for production approval."
      },
      {
        title: "Notify And Audit",
        detail: "Use outgoing webhooks and release records to update ITSM, chat, or observability systems."
      }
    ],
    webhook: [
      "Configure a FlexDeploy Incoming Webhook for the merge-to-main event from GitHub, Bitbucket, or Azure Repos.",
      "Use the webhook function to capture branch, repository, and commit SHA from the payload.",
      "Trigger the release build immediately after merge so the artifact matches the reviewed trunk/main commit, not the feature branch."
    ],
    review: [
      "Do not use FlexDeploy to compensate for weak trunk hygiene; keep direct pushes blocked on the production branch.",
      "Require PR approval and stable checks before the webhook-driven build starts.",
      "Treat hotfixes the same way: expedited review in Git, controlled promotion in FlexDeploy."
    ],
    approvals: [
      "Use FlexDeploy Approval Gate for regulated production access or high-risk environments.",
      "Use External Approval Gate or change-management integration when CAB or ticket approval is required.",
      "Keep one authoritative production approval owner to avoid duplicate manual gates."
    ],
    release: [
      "Promote one immutable artifact through Dev, QA, UAT, and Production instead of rebuilding per environment.",
      "Use feature flags for partial rollout when supported so Git branching can stay simpler.",
      "Use release windows and policy gates in FlexDeploy rather than adding extra long-lived Git branches."
    ],
    observe: [
      "Send outgoing webhooks or notifications after deploy status changes.",
      "Record who approved, what artifact moved, and which environment received it.",
      "Rollback remains explicit: merge an approved rollback PR (or approved automation exception commit) to trunk/main, while FlexDeploy can restore a tracked version separately for fast recovery."
    ]
  },
  githubFlow: {
    summary:
      "Strong fit when GitHub owns pull-request governance, feature branches only run validation builds, and FlexDeploy owns release build plus artifact promotion after merge to main.",
    positioning:
      "GitHub should remain the review gate with CODEOWNERS, rulesets, and status checks. FlexDeploy starts after the approved merge and becomes the release-control layer.",
    trigger: "Trigger: PR merge to main",
    reviewGate: "Review: PR approvals + branch rules",
    prodGate: "Prod gate: GitHub env reviewer or FlexDeploy gate",
    flow: [
      "Developer pushes a feature branch, runs validation builds there, and opens a pull request to main.",
      "GitHub enforces CODEOWNERS, required reviewers, and status checks before merge.",
      "Merge to main emits the push webhook that starts FlexDeploy automation.",
      "FlexDeploy builds or imports the release artifact tied to that merged main commit SHA.",
      "Deployment pipeline promotes the same artifact through staging and other non-prod environments.",
      "Production waits for the chosen final gate, then FlexDeploy deploys and publishes release notifications."
    ],
    stages: [
      {
        title: "Pull Request",
        detail: "Feature branch review stays in GitHub with protected branches and required checks."
      },
      {
        title: "Incoming Webhook",
        detail: "The merged main push calls FlexDeploy and carries repository plus commit context."
      },
      {
        title: "Artifact Traceability",
        detail: "FlexDeploy records the artifact against the merged commit and deployment history."
      },
      {
        title: "Approval Strategy",
        detail: "Choose whether GitHub environments or FlexDeploy owns the final production approval."
      },
      {
        title: "Callbacks",
        detail: "Outgoing webhooks or notifications can update Slack, ServiceNow, or observability tools."
      }
    ],
    webhook: [
      "Use the main-branch push event as the clean handoff from GitHub review to FlexDeploy automation.",
      "Normalize repository, branch, and SHA values in the FlexDeploy webhook function.",
      "If pull-request metadata is needed for audit, capture it before merge or include it in release notes."
    ],
    review: [
      "Use GitHub rulesets, branch protection, and CODEOWNERS for the source-control gate.",
      "Keep feature branches short-lived so webhook-triggered deployments reflect small reviewed changes.",
      "Avoid direct deploys from feature branches; if production follows main, release artifacts must also come from main."
    ],
    approvals: [
      "Decide whether GitHub environment reviewers or FlexDeploy Approval Gates own the final manual approval.",
      "Use FlexDeploy Approval Gate when release orchestration spans multiple systems or enterprise policies.",
      "For emergency hotfixes, document the expedited PR policy and the matching reduced release quorum."
    ],
    release: [
      "Build after merge to main and promote that same main-built artifact through all environments.",
      "Use FlexDeploy to coordinate deployment windows, dependencies, and cross-system promotion.",
      "Keep GitHub focused on source control; keep FlexDeploy focused on governed release movement."
    ],
    observe: [
      "Publish deployment outcomes through outgoing webhooks or chat notifications.",
      "Keep release evidence tied to commit SHA, approver, and target environment.",
      "Rollback is merge of an approved revert PR to main (or approved automation exception commit), while FlexDeploy can rapidly restore a tracked deployment version if needed."
    ]
  },
  releaseFlow: {
    summary:
      "Best fit when main integrates continuously but release/* branches own governed build, QA/staging sign-off, and production promotion.",
    positioning:
      "Keep PR review on feature -> main. When a change set is ready for shared QA, staging, or slower approval cycles, cut a release branch from main. FlexDeploy then builds once from the protected release/* commit, optionally stamped with a release tag, and promotes that same artifact.",
    trigger: "Trigger: protected release/* update after approved merge",
    reviewGate: "Review: PRs into main and release/*",
    prodGate: "Prod gate: Approval Gate, CAB, or change ticket",
    flow: [
      "Developer merges approved feature branches into main under normal review policy.",
      "A release branch is cut from main when the team is ready for governed QA, staging, and production promotion.",
      "Protected release/* updates trigger FlexDeploy via webhook.",
      "FlexDeploy builds once from the protected release/* commit and records the release artifact against that release line.",
      "Shared QA and staging validate the same artifact while approvals proceed.",
      "Production promotes that approved release artifact without rebuilding from a different branch."
    ],
    stages: [
      {
        title: "Release Branch Event",
        detail: "Protected release/* creation or approved update becomes the governed release trigger."
      },
      {
        title: "Webhook Routing",
        detail: "FlexDeploy routes protected release/* payloads plus optional version-tag metadata into the correct pipeline."
      },
      {
        title: "Build Once",
        detail: "Create one immutable release artifact from the protected release/* commit."
      },
      {
        title: "Shared Validation",
        detail: "QA and staging validate the same release artifact while approvals or release windows are pending."
      },
      {
        title: "Production Approval",
        detail: "Approval Gates or external change approvals stop production until the release branch is authorized."
      }
    ],
    webhook: [
      "Trigger FlexDeploy from protected release/* updates rather than from feature branches.",
      "Carry release branch name, source main SHA, and optional release tag/version hint into the webhook payload.",
      "Do not rebuild from feature branches once shared QA/staging sign-off starts."
    ],
    review: [
      "Keep feature -> main PRs small and reviewed under normal policy.",
      "Protect both main and the active release/* branch; fixes into release/* should still be reviewable.",
      "Shared QA and staging should validate the release branch artifact, not a feature branch build."
    ],
    approvals: [
      "Use FlexDeploy Approval Gate or External Approval Gate when release managers, CAB, or ITSM ownership is required.",
      "Keep one authoritative production approval owner for the active release branch.",
      "Document how release fixes, hotfixes, and rollback sync back to main after production."
    ],
    release: [
      "Build once from the protected release/* commit and promote that same artifact through QA, staging, UAT, and production.",
      "If a fix lands on the active release branch, rebuild once from that updated release line and continue promotion from the new version.",
      "Keep main as the integration source, but let release/* own the governed deployment path."
    ],
    observe: [
      "Track artifact version, release branch name, source main SHA, approver, and target environment.",
      "Publish release-cut, approval-wait, and deploy outcomes through outgoing webhooks or chat notifications.",
      "Rollback can restore a tracked deployment version immediately, then revert or cherry-pick the source correction on release/* and sync main."
    ]
  },
  gitFlow: {
    summary:
      "Best fit when release and hotfix branches need formal hardening, audit-friendly tags, and CAB-style production approval.",
    positioning:
      "GitFlow keeps source branches explicit. FlexDeploy should then own release candidate build, environment progression, and production governance rather than pushing those rules back into Git alone.",
    trigger: "Trigger: release/*, hotfix/*, or tag event",
    reviewGate: "Review: PRs into develop, release, and main",
    prodGate: "Prod gate: release manager or CAB approval",
    flow: [
      "Feature branches merge into develop under normal review policy.",
      "A release branch or hotfix branch emits the webhook that starts the governed release path in FlexDeploy.",
      "FlexDeploy builds the release candidate once, tracks the version, and promotes it through test environments.",
      "Regression, performance, and change-management checks run before production approval.",
      "Tagged release or approved main merge becomes the production deployment input.",
      "Hotfix or rollback results are synchronized back to develop and future release branches."
    ],
    stages: [
      {
        title: "Structured Branches",
        detail: "Different Git lanes still exist for develop, release, and hotfix responsibility."
      },
      {
        title: "Webhook Routing",
        detail: "Webhook functions can branch on release, hotfix, or tag patterns to trigger the right pipeline."
      },
      {
        title: "Release Candidate",
        detail: "FlexDeploy tracks the hardened build as the auditable release candidate."
      },
      {
        title: "CAB And Production Gate",
        detail: "Approval Gates or external change approvals fit naturally before production."
      },
      {
        title: "Resynchronization",
        detail: "After hotfix or rollback, Git branches and FlexDeploy release records must both be brought back into alignment."
      }
    ],
    webhook: [
      "Map release branch, hotfix branch, and tag events to different FlexDeploy webhook behaviors.",
      "Start release automation when a release candidate is cut, not on every develop branch push.",
      "Carry branch name, version hint, and commit SHA into the pipeline for clean release evidence."
    ],
    review: [
      "Keep distinct PR policies for develop, release, hotfix, and main merges.",
      "Use branch protections so emergency fixes still create reviewable history.",
      "Do not bypass branch resynchronization after hotfixes; the next release will drift."
    ],
    approvals: [
      "Use Approval Gate for production readiness and External Approval Gate for CAB or ITSM ownership.",
      "Release managers should approve tagged production promotions, not rebuild them manually.",
      "Keep audit evidence attached to release branch or tag metadata."
    ],
    release: [
      "Use feature and develop branches for validation only, then build once from the release branch or tagged main commit and promote that artifact.",
      "Use FlexDeploy to manage release windows, environment ordering, and dependent application rollout.",
      "Treat hotfixes as the same governed pipeline with a smaller validation profile."
    ],
    observe: [
      "Use outgoing webhooks or notifications for release milestones, approval waits, and deploy outcomes.",
      "Retain release candidate, tag, and environment evidence for audit and rollback analysis.",
      "Rollback should create explicit revert history in Git and an equally explicit version-restore trail in FlexDeploy."
    ]
  }
};

const state = {
  strategyId: STRATEGY_ORDER[0],
  scenarioId: "standard",
  rollbackMode: ROLLBACK_MODE_ORDER[0],
  compareMode: false,
  compareStrategyId: STRATEGY_ORDER[1] || STRATEGY_ORDER[0]
};

const elements = {
  strategyTabs: document.getElementById("strategyTabs"),
  strategyName: document.getElementById("strategyName"),
  strategyTagline: document.getElementById("strategyTagline"),
  strategyBestFor: document.getElementById("strategyBestFor"),
  strategyGate: document.getElementById("strategyGate"),
  prosList: document.getElementById("prosList"),
  consList: document.getElementById("consList"),
  flowCaption: document.getElementById("flowCaption"),
  branchMap: document.getElementById("branchMap"),
  scenarioTabs: document.getElementById("scenarioTabs"),
  scenarioTitle: document.getElementById("scenarioTitle"),
  scenarioSummary: document.getElementById("scenarioSummary"),
  scenarioSteps: document.getElementById("scenarioSteps"),
  scenarioRollbackOptions: document.getElementById("scenarioRollbackOptions"),
  comparisonTable: document.getElementById("comparisonTable"),
  flexdeployStrategyName: document.getElementById("flexdeployStrategyName"),
  flexdeploySummary: document.getElementById("flexdeploySummary"),
  flexdeployPositioning: document.getElementById("flexdeployPositioning"),
  flexdeployTrigger: document.getElementById("flexdeployTrigger"),
  flexdeployReviewGate: document.getElementById("flexdeployReviewGate"),
  flexdeployProdGate: document.getElementById("flexdeployProdGate"),
  integrationDiagramGrid: document.getElementById("integrationDiagramGrid"),
  flexdeployDiagramCaption: document.getElementById("flexdeployDiagramCaption"),
  compareModeToggle: document.getElementById("compareModeToggle"),
  compareStrategySelect: document.getElementById("compareStrategySelect"),
  rollbackModeWrap: document.getElementById("rollbackModeWrap"),
  rollbackModeSelect: document.getElementById("rollbackModeSelect"),
  flexdeployDiagram: document.getElementById("flexdeployDiagram"),
  flexdeployTooltip: document.getElementById("flexdeployTooltip"),
  flexdeployTooltipTitle: document.getElementById("flexdeployTooltipTitle"),
  flexdeployTooltipBody: document.getElementById("flexdeployTooltipBody"),
  flexdeployCompareCard: document.getElementById("flexdeployCompareCard"),
  flexdeployCompareCaption: document.getElementById("flexdeployCompareCaption"),
  flexdeployCompareDiagram: document.getElementById("flexdeployCompareDiagram"),
  flexdeployCompareTooltip: document.getElementById("flexdeployCompareTooltip"),
  flexdeployCompareTooltipTitle: document.getElementById("flexdeployCompareTooltipTitle"),
  flexdeployCompareTooltipBody: document.getElementById("flexdeployCompareTooltipBody"),
  flexdeployWebhookList: document.getElementById("flexdeployWebhookList"),
  flexdeployReviewList: document.getElementById("flexdeployReviewList"),
  flexdeployApprovalList: document.getElementById("flexdeployApprovalList"),
  flexdeployReleaseList: document.getElementById("flexdeployReleaseList"),
  flexdeployObserveList: document.getElementById("flexdeployObserveList")
};

function getFallbackCompareStrategyId(primaryStrategyId) {
  return STRATEGY_ORDER.find((strategyId) => strategyId !== primaryStrategyId) || primaryStrategyId;
}

function ensureCompareStrategyState() {
  if (!STRATEGY_ORDER.includes(state.compareStrategyId)) {
    state.compareStrategyId = getFallbackCompareStrategyId(state.strategyId);
  }
  if (state.compareStrategyId === state.strategyId) {
    state.compareStrategyId = getFallbackCompareStrategyId(state.strategyId);
  }
}

function syncCompareControls() {
  const toggle = elements.compareModeToggle;
  const select = elements.compareStrategySelect;
  if (!toggle || !select) {
    return;
  }

  const availableStrategies = STRATEGY_ORDER.filter((strategyId) => strategyId !== state.strategyId);
  if (!availableStrategies.length) {
    state.compareMode = false;
    state.compareStrategyId = state.strategyId;
  } else {
    ensureCompareStrategyState();
  }

  select.textContent = "";
  availableStrategies.forEach((strategyId) => {
    const option = document.createElement("option");
    option.value = strategyId;
    option.textContent = STRATEGIES[strategyId].label;
    select.appendChild(option);
  });

  if (availableStrategies.includes(state.compareStrategyId)) {
    select.value = state.compareStrategyId;
  }

  toggle.checked = state.compareMode;
  toggle.disabled = !availableStrategies.length;
  select.disabled = !state.compareMode || !availableStrategies.length;
}

function initCompareControls() {
  const toggle = elements.compareModeToggle;
  const select = elements.compareStrategySelect;
  if (!toggle || !select) {
    return;
  }

  toggle.addEventListener("change", () => {
    state.compareMode = toggle.checked;
    renderFlexDeployIntegration();
  });

  select.addEventListener("change", () => {
    state.compareStrategyId = select.value;
    ensureCompareStrategyState();
    renderFlexDeployIntegration();
  });
}

function ensureRollbackModeState() {
  if (!ROLLBACK_MODE_ORDER.includes(state.rollbackMode)) {
    state.rollbackMode = ROLLBACK_MODE_ORDER[0];
  }
}

function syncRollbackModeControl() {
  const wrap = elements.rollbackModeWrap;
  const select = elements.rollbackModeSelect;
  if (!wrap || !select) {
    return;
  }

  ensureRollbackModeState();
  const rollbackScenarioActive = state.scenarioId === "rollback";
  wrap.hidden = !rollbackScenarioActive;

  if (!select.options.length) {
    ROLLBACK_MODE_ORDER.forEach((modeId) => {
      const option = document.createElement("option");
      option.value = modeId;
      option.textContent = ROLLBACK_MODES[modeId].label;
      select.appendChild(option);
    });
  }

  select.value = state.rollbackMode;
  select.disabled = !rollbackScenarioActive;
}

function initRollbackModeControl() {
  const select = elements.rollbackModeSelect;
  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    state.rollbackMode = select.value;
    ensureRollbackModeState();
    renderActiveView();
  });
}

function hideFlexTooltip(tooltip) {
  if (!tooltip) {
    return;
  }
  tooltip.classList.remove("is-visible");
  tooltip.hidden = true;
}
function renderStrategyTabs() {
  elements.strategyTabs.textContent = "";

  STRATEGY_ORDER.forEach((strategyId) => {
    const strategy = STRATEGIES[strategyId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-btn";
    button.textContent = strategy.label;
    button.setAttribute("aria-pressed", String(state.strategyId === strategyId));
    button.addEventListener("click", () => {
      state.strategyId = strategyId;
      renderStrategyTabs();
      renderActiveView();
    });
    elements.strategyTabs.appendChild(button);
  });
}

function renderScenarioTabs() {
  elements.scenarioTabs.textContent = "";

  Object.entries(SCENARIO_LABELS).forEach(([scenarioId, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-btn";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(state.scenarioId === scenarioId));
    button.addEventListener("click", () => {
      state.scenarioId = scenarioId;
      renderScenarioTabs();
      renderActiveView();
    });
    elements.scenarioTabs.appendChild(button);
  });
}

function getScenarioForDisplay(strategyId, scenarioId, scenario, rollbackMode = state.rollbackMode) {
  if (scenarioId !== "rollback" || rollbackMode !== "automation") {
    return scenario;
  }

  const view = {
    ...scenario,
    summary:
      `${scenario.summary} In this exception mode, only break-glass approved automation may commit rollback changes to the protected release branch or main/trunk, with explicit approver and audit evidence. ` +
      "Flowchart shows phase 1 service recovery in FlexDeploy (restore tracked version), then phase 2 source-of-truth recovery in Git history via automation commit.",
    steps: scenario.steps.map((step) => ({ ...step }))
  };

  if (strategyId === "githubFlow") {
    if (view.steps[1]) {
      view.steps[1] = {
        ...view.steps[1],
        lane: "main",
        note: "Automation rollback",
        action:
          "Authorize break-glass trusted automation to create rollback commit on protected main with incident approver and audit record.",
        command: "Automation job: revert <bad-sha> on main (service account)"
      };
    }
    if (view.steps[2]) {
      view.steps[2] = {
        ...view.steps[2],
        lane: "main",
        note: "Validate bot commit",
        action: "Run required checks and policy validation on automation rollback commit.",
        command: "Run CI + policy checks on bot rollback SHA"
      };
    }
  } else if (strategyId === "trunkBased") {
    if (view.steps[1]) {
      view.steps[1] = {
        ...view.steps[1],
        lane: "trunk",
        note: "Automation rollback",
        action:
          "Authorize break-glass trusted automation to create rollback commit on protected trunk with incident approver and audit record.",
        command: "Automation job: revert <bad-sha> on main (service account)"
      };
    }
    if (view.steps[2]) {
      view.steps[2] = {
        ...view.steps[2],
        lane: "trunk",
        note: "Validate bot commit",
        action: "Run fast pipeline and smoke checks on automation rollback commit.",
        command: "Run CI + smoke checks on bot rollback SHA"
      };
    }
  } else if (strategyId === "gitFlow") {
    if (view.steps[1]) {
      view.steps[1] = {
        ...view.steps[1],
        lane: "main",
        note: "Automation rollback",
        action:
          "Authorize break-glass trusted automation rollback commit on protected main from failing release with incident approver and CAB evidence.",
        command: "Automation job: revert <bad-sha> on main and prepare patch tag"
      };
    }
    if (view.steps[2]) {
      view.steps[2] = {
        ...view.steps[2],
        lane: "main",
        note: "Validate bot commit",
        action: "Run release validation checks on automation rollback commit.",
        command: "Run release checks on bot rollback SHA"
      };
    }
  } else if (strategyId === "releaseFlow") {
    if (view.steps[1]) {
      view.steps[1] = {
        ...view.steps[1],
        lane: "release",
        note: "Automation rollback",
        action:
          "Authorize break-glass trusted automation to create rollback commit on the protected release branch with incident approver and audit record.",
        command: "Automation job: revert <bad-sha> on release/2026.03 (service account)"
      };
    }
    if (view.steps[2]) {
      view.steps[2] = {
        ...view.steps[2],
        lane: "release",
        note: "Validate bot commit",
        action: "Run release validation checks on the automation rollback commit before retagging and deploy.",
        command: "Run release checks on bot rollback SHA"
      };
    }
  }

  return view;
}

function renderActiveView() {
  const strategy = STRATEGIES[state.strategyId];
  const baseScenario = strategy.scenarios[state.scenarioId];
  const scenarioForMap = getScenarioForDisplay(state.strategyId, state.scenarioId, baseScenario, state.rollbackMode);
  const scenarioLabelWithMode =
    state.scenarioId === "rollback"
      ? `${baseScenario.title} (${ROLLBACK_MODES[state.rollbackMode].label})`
      : baseScenario.title;

  elements.strategyName.textContent = strategy.label;
  elements.strategyTagline.textContent = strategy.tagline;
  elements.strategyBestFor.textContent = strategy.bestFor;
  elements.strategyGate.textContent = strategy.gate;
  elements.flowCaption.textContent = `${scenarioLabelWithMode}: Git branch movement only (FlexDeploy release orchestration shown below).`;

  renderList(elements.prosList, strategy.pros);
  renderList(elements.consList, strategy.cons);
  renderScenario(strategy, baseScenario);
  renderBranchMap(strategy, scenarioForMap);
  renderFlexDeployIntegration();
  renderComparisonMatrix();
}

function renderList(target, values) {
  target.textContent = "";
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    target.appendChild(item);
  });
}

function renderFlexDeployIntegration() {
  const strategyId = state.strategyId;
  const strategyLabel = STRATEGIES[strategyId].label;
  const scenarioId = state.scenarioId;
  const scenarioLabel = SCENARIO_LABELS[scenarioId] || "Scenario";
  const isRollbackScenario = scenarioId === "rollback";
  const integration = FLEXDEPLOY_PLAYBOOK[strategyId];

  ensureRollbackModeState();
  syncRollbackModeControl();
  ensureCompareStrategyState();
  syncCompareControls();
  const showCompare =
    state.compareMode && state.compareStrategyId !== strategyId && Boolean(FLEXDEPLOY_PLAYBOOK[state.compareStrategyId]);
  const rollbackModeLabel = ROLLBACK_MODES[state.rollbackMode].label;
  const scenarioLabelWithMode = isRollbackScenario ? `${scenarioLabel} - ${rollbackModeLabel}` : scenarioLabel;
  const rollbackFlowNote = isRollbackScenario
    ? " Phase 1 is service recovery in FlexDeploy by restoring a tracked version. Phase 2 is source-of-truth recovery in Git history via rollback PR or approved break-glass automation revert."
    : "";
  const primaryPreviewFlowNote =
    strategyId === "githubFlow" && scenarioId === "standard"
      ? " Optional pre-merge preview deploy is shown as validation only; release build and promotion still start after merge to main."
      : "";

  elements.flexdeployStrategyName.textContent = `${strategyLabel} With FlexDeploy`;
  elements.flexdeploySummary.textContent = integration.summary;
  elements.flexdeployPositioning.textContent = integration.positioning;
  elements.flexdeployTrigger.textContent = integration.trigger;
  elements.flexdeployReviewGate.textContent = integration.reviewGate;
  elements.flexdeployProdGate.textContent = integration.prodGate;
  elements.flexdeployDiagramCaption.textContent = showCompare
    ? `${strategyLabel} (${scenarioLabelWithMode}): primary flow. Comparison mode shows ${STRATEGIES[state.compareStrategyId].label} in parallel.${rollbackFlowNote}${primaryPreviewFlowNote}`
    : `${strategyLabel} (${scenarioLabelWithMode}): synced to selected strategy and scenario. Hover each step for details.${rollbackFlowNote}${primaryPreviewFlowNote}`;

  renderFlexdeployDiagram(integration, strategyId, scenarioId, state.rollbackMode, {
    svg: elements.flexdeployDiagram,
    tooltip: elements.flexdeployTooltip,
    tooltipTitle: elements.flexdeployTooltipTitle,
    tooltipBody: elements.flexdeployTooltipBody
  });

  if (elements.integrationDiagramGrid) {
    elements.integrationDiagramGrid.classList.toggle("compare-enabled", showCompare);
  }

  if (showCompare && elements.flexdeployCompareCard) {
    const compareStrategyId = state.compareStrategyId;
    const compareIntegration = FLEXDEPLOY_PLAYBOOK[compareStrategyId];
    const compareLabel = STRATEGIES[compareStrategyId].label;
    const comparePreviewFlowNote =
      compareStrategyId === "githubFlow" && scenarioId === "standard"
        ? " Optional pre-merge preview deploy is shown as validation only; release build and promotion still start after merge to main."
        : "";

    elements.flexdeployCompareCard.hidden = false;
    if (elements.flexdeployCompareCaption) {
      elements.flexdeployCompareCaption.textContent = `${compareLabel} (${scenarioLabelWithMode}): side-by-side scenario flow.${rollbackFlowNote}${comparePreviewFlowNote}`;
    }

    renderFlexdeployDiagram(compareIntegration, compareStrategyId, scenarioId, state.rollbackMode, {
      svg: elements.flexdeployCompareDiagram,
      tooltip: elements.flexdeployCompareTooltip,
      tooltipTitle: elements.flexdeployCompareTooltipTitle,
      tooltipBody: elements.flexdeployCompareTooltipBody
    });
  } else if (elements.flexdeployCompareCard) {
    elements.flexdeployCompareCard.hidden = true;
    hideFlexTooltip(elements.flexdeployCompareTooltip);
    if (elements.flexdeployCompareDiagram) {
      elements.flexdeployCompareDiagram.textContent = "";
    }
    if (elements.flexdeployCompareCaption) {
      elements.flexdeployCompareCaption.textContent = "";
    }
  }

  renderList(elements.flexdeployWebhookList, integration.webhook);
  renderList(elements.flexdeployReviewList, integration.review);
  renderList(elements.flexdeployApprovalList, integration.approvals);
  renderList(elements.flexdeployReleaseList, integration.release);
  renderList(elements.flexdeployObserveList, buildRollbackGuidance(integration));
}

function buildRollbackGuidance(integration) {
  const lines = [
    ...(integration.observe || []),
    ...(integration.review || []),
    ...(integration.release || []),
    ...(integration.approvals || [])
  ];

  const rollbackPattern = /(rollback|revert|hotfix|known-good|redeploy|resynchronization|sync|back-propagate)/i;
  const matched = lines.filter((line) => rollbackPattern.test(line));
  if (matched.length >= 3) {
    return matched.slice(0, 4);
  }

  return [
    "Rollback model: use rollback branch + protected-branch PR approval by default; only break-glass approved automation should bypass the normal PR path.",
    "For fastest restoration, FlexDeploy can redeploy a previously tracked version independently of the Git history rollback flow.",
    "Emergency hotfixes should still use the governed merge and approval path whenever possible.",
    "After rollback or hotfix, synchronize long-lived branches so the next release does not drift.",
    "Capture rollback reason, approver, and artifact version for audit and post-incident analysis."
  ];
}

function renderScenario(strategy, scenario) {
  elements.scenarioTitle.textContent = scenario.title;
  const isRollbackScenario = state.scenarioId === "rollback";
  const rollbackOptions = elements.scenarioRollbackOptions;

  if (!isRollbackScenario) {
    elements.scenarioSummary.textContent = scenario.summary;
    elements.scenarioSteps.hidden = false;
    if (rollbackOptions) {
      rollbackOptions.hidden = true;
      rollbackOptions.textContent = "";
    }

    elements.scenarioSteps.textContent = "";
    renderScenarioStepsIntoList(elements.scenarioSteps, strategy, scenario.steps);
    return;
  }

  elements.scenarioSummary.textContent =
    `${scenario.summary} Compare both rollback governance options below; FlexDeploy version restore can happen first in both cases.`;
  elements.scenarioSteps.hidden = true;

  if (!rollbackOptions) {
    return;
  }

  rollbackOptions.hidden = false;
  rollbackOptions.textContent = "";

  const rollbackVariants = [
    {
      modeId: "pr",
      title: ROLLBACK_MODES.pr.label,
      summary: "Rollback branch + approved PR merge to the protected release branch or main/trunk after FlexDeploy version restore.",
      scenario: getScenarioForDisplay(state.strategyId, "rollback", scenario, "pr")
    },
    {
      modeId: "automation",
      title: ROLLBACK_MODES.automation.label,
      summary:
        "Break-glass trusted automation commit to the protected release branch or main/trunk under explicit exception policy after FlexDeploy version restore.",
      scenario: getScenarioForDisplay(state.strategyId, "rollback", scenario, "automation")
    }
  ];

  rollbackVariants.forEach((variant) => {
    const card = document.createElement("article");
    card.className = "scenario-variant-card";
    if (variant.modeId === state.rollbackMode) {
      card.classList.add("is-active");
    }

    const heading = document.createElement("h5");
    heading.className = "scenario-variant-title";
    heading.textContent = variant.title;

    const summary = document.createElement("p");
    summary.className = "scenario-variant-summary";
    summary.textContent = variant.summary;

    const list = document.createElement("ol");
    list.className = "scenario-steps scenario-steps-compact";
    renderScenarioStepsIntoList(list, strategy, variant.scenario.steps);

    card.appendChild(heading);
    card.appendChild(summary);
    card.appendChild(list);
    rollbackOptions.appendChild(card);
  });
}

function renderScenarioStepsIntoList(target, strategy, steps) {
  const laneById = new Map(strategy.lanes.map((lane) => [lane.id, lane]));

  steps.forEach((step) => {
    const lane = laneById.get(step.lane) || strategy.lanes[0];
    const item = document.createElement("li");
    item.className = "scenario-step";

    const head = document.createElement("div");
    head.className = "step-head";

    const laneTag = document.createElement("span");
    laneTag.className = "step-lane";
    laneTag.style.backgroundColor = lane.color;
    laneTag.textContent = lane.label;

    const action = document.createElement("span");
    action.className = "step-action";
    action.textContent = step.action;

    head.appendChild(laneTag);
    head.appendChild(action);

    item.appendChild(head);
    const commandText = String(step.command || "").trim();
    if (isGitCommandLine(commandText)) {
      const command = document.createElement("div");
      command.className = "step-command";
      command.textContent = commandText;
      item.appendChild(command);
    } else {
      item.classList.add("scenario-step-no-command");
    }

    target.appendChild(item);
  });
}

function isGitCommandLine(commandText) {
  return /^git\b/i.test(commandText);
}

function renderBranchMap(strategy, scenario) {
  const svg = elements.branchMap;
  svg.textContent = "";

  const visibleLanes = strategy.lanes.filter((lane) => lane.kind !== "control");
  const width = 980;
  const top = 50;
  const laneGap = 78;
  const left = 150;
  const right = 56;
  const bottomPadding = 56;
  const height = top + laneGap * (visibleLanes.length - 1) + bottomPadding;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const laneIndex = new Map();
  visibleLanes.forEach((lane, index) => {
    laneIndex.set(lane.id, {
      ...lane,
      y: top + index * laneGap
    });
  });

  svg.appendChild(createArrowDefinition());

  visibleLanes.forEach((lane) => {
    const laneData = laneIndex.get(lane.id);

    const line = createSvgElement("line", {
      x1: left,
      y1: laneData.y,
      x2: width - right,
      y2: laneData.y,
      stroke: laneData.color,
      class: "lane-line"
    });

    const label = createSvgElement("text", {
      x: 16,
      y: laneData.y + 4,
      class: "lane-label"
    });
    label.textContent = laneData.label;

    svg.appendChild(line);
    svg.appendChild(label);
  });

  const steps = getGitFlowSteps(scenario.steps).filter((step) => laneIndex.has(step.lane));
  const interval = steps.length > 1 ? (width - left - right) / (steps.length - 1) : 0;
  const nodeRadius = 11;
  const edgePadding = nodeRadius + 4;
  const points = steps.map((step, index) => {
    const lane = laneIndex.get(step.lane) || laneIndex.get(visibleLanes[0].id);
    return {
      ...step,
      x: left + index * interval,
      y: lane.y,
      color: lane.color
    };
  });

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const isCrossLane = start.lane !== end.lane;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const safePadding = distance > 8 ? Math.min(edgePadding, distance / 2 - 1) : 0;
    const x1 = start.x + ux * safePadding;
    const y1 = start.y + uy * safePadding;
    const x2 = end.x - ux * safePadding;
    const y2 = end.y - uy * safePadding;

    const edge = createSvgElement("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: end.color,
      class: isCrossLane ? "flow-edge cross" : "flow-edge",
      "marker-end": "url(#arrowhead)"
    });
    svg.appendChild(edge);
  }

  points.forEach((point, index) => {
    const node = createSvgElement("circle", {
      cx: point.x,
      cy: point.y,
      r: nodeRadius,
      fill: point.color,
      class: "flow-node"
    });
    node.style.animationDelay = `${index * 70}ms`;

    const number = createSvgElement("text", {
      x: point.x,
      y: point.y + 0.5,
      class: "flow-index"
    });
    number.textContent = String(index + 1);

    const note = createSvgElement("text", {
      x: point.x,
      y: point.y + 24,
      class: "flow-note"
    });
    note.textContent = point.note;

    const tooltip = createSvgElement("title");
    tooltip.textContent = `${index + 1}. ${point.action}`;
    node.appendChild(tooltip);

    svg.appendChild(node);
    svg.appendChild(number);
    svg.appendChild(note);
  });
}

function renderFlexdeployDiagram(integration, strategyId, scenarioId, rollbackMode, targets = {}) {
  const svg = targets.svg || elements.flexdeployDiagram;
  const tooltipTargets = {
    tooltip: targets.tooltip || elements.flexdeployTooltip,
    tooltipTitle: targets.tooltipTitle || elements.flexdeployTooltipTitle,
    tooltipBody: targets.tooltipBody || elements.flexdeployTooltipBody
  };
  if (!svg) {
    return;
  }

  hideFlexTooltip(tooltipTargets.tooltip);
  svg.textContent = "";

  const width = 980;
  const strategyLabel = STRATEGIES[strategyId].label;
  const prodGate = stripFlexPrefix(integration.prodGate, "Prod gate: ");
  const buildStage = integration.stages.find((stage) => /artifact|build|release candidate/i.test(stage.title));
  const rollbackTip = buildRollbackGuidance(integration)[0];
  const nodeWidth = 520;
  const nodeHeight = 104;
  const nodeGap = 46;
  const startY = 164;
  const nodeX = (width - nodeWidth) / 2;
  const flowNodes = buildStrategyFlowNodes({
    strategyId,
    scenarioId,
    rollbackMode,
    integration,
    prodGate,
    buildStage,
    rollbackTip
  }).map((node, index) => ({
    ...node,
    index,
    x: nodeX,
    y: startY + index * (nodeHeight + nodeGap),
    width: nodeWidth,
    height: nodeHeight
  }));
  const height = Math.max(1080, startY + (flowNodes.length - 1) * (nodeHeight + nodeGap) + nodeHeight + 70);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
  const scenarioLabel = SCENARIO_LABELS[scenarioId] || "Scenario";
  const scenarioLabelWithMode =
    scenarioId === "rollback" ? `${scenarioLabel} ${ROLLBACK_MODES[rollbackMode].label}` : scenarioLabel;
  svg.setAttribute("aria-label", `${strategyLabel} ${scenarioLabelWithMode} FlexDeploy integration flowchart`);
  svg.appendChild(createFlexArrowDefinition());

  const header = createSvgElement("text", {
    x: 72,
    y: 58,
    class: "flex-section-title"
  });
  header.textContent = `${scenarioLabel} Flow`;
  svg.appendChild(header);

  const subheader = createSvgElement("text", {
    x: 72,
    y: 80,
    class: "flex-section-subtitle"
  });
  subheader.textContent = flowNodes.map((node) => node.short || node.title).join(" -> ");
  svg.appendChild(subheader);

  const hint = createSvgElement("text", {
    x: 72,
    y: 102,
    class: "flex-section-subtitle"
  });
  hint.textContent = "Hover a step for full details.";
  svg.appendChild(hint);
  drawFlexPlatformLegend(svg, 72, 116);

  for (let index = 0; index < flowNodes.length - 1; index += 1) {
    const startNode = flowNodes[index];
    const endNode = flowNodes[index + 1];
    const edge = createSvgElement("line", {
      x1: startNode.x + startNode.width / 2,
      y1: startNode.y + startNode.height + 6,
      x2: endNode.x + endNode.width / 2,
      y2: endNode.y - 10,
      class: "flex-edge",
      "marker-end": "url(#flexArrowhead)"
    });
    svg.appendChild(edge);
  }

  flowNodes.forEach((node) => {
    drawFlexNode(svg, node);
  });
  bindFlexdeployDiagramTooltips(svg, tooltipTargets);
}

function buildStrategyFlowNodes({
  strategyId,
  scenarioId,
  rollbackMode,
  integration,
  prodGate,
  buildStage,
  rollbackTip
}) {
  const note = (...parts) => {
    const lines = [];
    const seen = new Set();

    parts
      .filter(Boolean)
      .forEach((part) => {
        String(part)
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const key = line.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "");
            if (!seen.has(key)) {
              seen.add(key);
              lines.push(line);
            }
          });
      });

    return lines.join("\n");
  };
  const applyOverrides = (nodes, overrides) => {
    if (!Array.isArray(overrides)) {
      return;
    }
    overrides.forEach((override, index) => {
      if (!override || !nodes[index]) {
        return;
      }
      Object.assign(nodes[index], override);
    });
  };

  const byStrategy = {
    trunkBased: [
      {
        title: "Git Event",
        short: "Git Event",
        detail: "Protected trunk or main merge event.",
        system: "SOURCE CONTROL",
        tone: "source",
        tooltip: note(integration.trigger, integration.review[0])
      },
      {
        title: "Incoming Webhook",
        short: "Webhook",
        detail: "Payload + commit SHA into FlexDeploy.",
        system: "WEBHOOK TRIGGER",
        tone: "webhook",
        tooltip: note(integration.webhook[0], integration.webhook[1])
      },
      {
        title: "Build Once",
        short: "Build Once",
        detail: "Build once from merged trunk/main.",
        system: "ARTIFACT TRACEABILITY",
        tone: "build",
        tooltip: note(
          "FlexDeploy builds once from the merged trunk/main commit, not from the feature branch.",
          buildStage?.detail,
          integration.release[0]
        )
      },
      {
        title: "QA Validation",
        short: "QA",
        detail: "Promote the same artifact to QA.",
        system: "QUALITY VALIDATION",
        tone: "build",
        iconTone: "qa",
        tooltip: note("Validate the promoted artifact in QA without rebuilding.", integration.review[1])
      },
      {
        title: "Approval Gate",
        short: "Approval",
        detail: `Release approval: ${prodGate}.`,
        system: "RELEASE CONTROL",
        tone: "gate",
        tooltip: note(integration.approvals[0], integration.approvals[1])
      },
      {
        title: "Production Deploy",
        short: "Production",
        detail: "Promote approved artifact to production.",
        system: "FINAL RELEASE GATE",
        tone: "gate",
        iconTone: "deploy",
        tooltip: note(integration.release[1], integration.approvals[2], rollbackTip)
      }
    ],
    githubFlow: [
      {
        title: "PR Merge to Main",
        short: "PR Merge",
        detail: "GitHub PR approvals and checks pass.",
        system: "GITHUB CONTROL",
        tone: "source",
        platform: "git",
        tooltip: note(integration.trigger, integration.review[0], integration.review[1])
      },
      {
        title: "Main Push Webhook",
        short: "Webhook",
        detail: "Merged main event triggers FlexDeploy.",
        system: "WEBHOOK TRIGGER",
        tone: "webhook",
        tooltip: note(integration.webhook[0], integration.webhook[1])
      },
      {
        title: "Build Once",
        short: "Build Once",
        detail: "Build once from merged main.",
        system: "ARTIFACT TRACEABILITY",
        tone: "build",
        tooltip: note(
          "FlexDeploy builds once from the merged main commit, not from the feature branch.",
          buildStage?.detail,
          integration.release[0]
        )
      },
      {
        title: "Staging Validation",
        short: "Staging",
        detail: "Validate production-bound artifact in staging.",
        system: "QUALITY VALIDATION",
        tone: "build",
        iconTone: "qa",
        tooltip: note(integration.release[1])
      },
      {
        title: "Release Approval",
        short: "Approval",
        detail: `Final gate: ${prodGate}.`,
        system: "RELEASE CONTROL",
        tone: "gate",
        tooltip: note(integration.approvals[0], integration.approvals[1])
      },
      {
        title: "Production Deploy",
        short: "Production",
        detail: "Promote approved artifact to production.",
        system: "FINAL RELEASE GATE",
        tone: "gate",
        iconTone: "deploy",
        tooltip: note(integration.release[2], integration.approvals[2], rollbackTip)
      }
    ],
    releaseFlow: [
      {
        title: "Release Branch Event",
        short: "Release Event",
        detail: "Protected release/* cut from main or approved release update starts governed flow.",
        system: "RELEASE CONTROL",
        tone: "source",
        tooltip: note(integration.trigger, integration.review[0], integration.review[2])
      },
      {
        title: "Webhook Routing",
        short: "Webhook",
        detail: "Protected release/* update routes to FlexDeploy.",
        system: "WEBHOOK TRIGGER",
        tone: "webhook",
        tooltip: note(integration.webhook[0], integration.webhook[1], integration.webhook[2])
      },
      {
        title: "Build Once",
        short: "Build Once",
        detail: "Build once from protected release/* commit.",
        system: "ARTIFACT TRACEABILITY",
        tone: "build",
        tooltip: note(
          "FlexDeploy builds the governed release artifact from the protected release/* commit; tags only annotate the released version.",
          buildStage?.detail,
          integration.release[0]
        )
      },
      {
        title: "QA/Staging Validation",
        short: "QA/Staging",
        detail: "Validate shared release artifact in QA and staging.",
        system: "QUALITY VALIDATION",
        tone: "build",
        iconTone: "qa",
        tooltip: note(integration.release[1], integration.review[2])
      },
      {
        title: "Release Approval",
        short: "Approval",
        detail: `Final gate: ${prodGate}.`,
        system: "RELEASE CONTROL",
        tone: "gate",
        tooltip: note(integration.approvals[0], integration.approvals[1], integration.approvals[2])
      },
      {
        title: "Production Deploy",
        short: "Production",
        detail: "Promote approved release artifact to production.",
        system: "FINAL RELEASE GATE",
        tone: "gate",
        iconTone: "deploy",
        tooltip: note(integration.observe[0], integration.observe[1], rollbackTip)
      }
    ],
    gitFlow: [
      {
        title: "Release/Hotfix Event",
        short: "Release Event",
        detail: "release/*, hotfix/*, or tag event starts flow.",
        system: "GITFLOW CONTROL",
        tone: "source",
        tooltip: note(integration.trigger, integration.review[0], integration.review[2])
      },
      {
        title: "Webhook Routing",
        short: "Webhook",
        detail: "Route event to the right release pipeline.",
        system: "WEBHOOK TRIGGER",
        tone: "webhook",
        tooltip: note(integration.webhook[0], integration.webhook[1], integration.webhook[2])
      },
      {
        title: "Release Candidate Build",
        short: "RC Build",
        detail: "Build once from release/* or tagged main.",
        system: "ARTIFACT TRACEABILITY",
        tone: "build",
        tooltip: note(
          "FlexDeploy builds the release candidate from the release branch or tagged main event, not from feature branches.",
          buildStage?.detail,
          integration.release[0]
        )
      },
      {
        title: "UAT Validation",
        short: "UAT",
        detail: "Validate candidate in UAT lane.",
        system: "QUALITY VALIDATION",
        tone: "build",
        iconTone: "qa",
        tooltip: note(integration.release[1], integration.release[2])
      },
      {
        title: "CAB Approval Gate",
        short: "CAB",
        detail: `Production gate: ${prodGate}.`,
        system: "RELEASE CONTROL",
        tone: "gate",
        tooltip: note(integration.approvals[0], integration.approvals[1], integration.approvals[2])
      },
      {
        title: "Production Deploy",
        short: "Production",
        detail: "Promote approved release candidate.",
        system: "FINAL RELEASE GATE",
        tone: "gate",
        iconTone: "deploy",
        tooltip: note(integration.observe[1], integration.observe[2], rollbackTip)
      }
    ]
  };

  const nodes = (byStrategy[strategyId] || byStrategy.trunkBased).map((node) => ({ ...node }));

  if (strategyId === "githubFlow" && scenarioId === "standard") {
    nodes.unshift({
      title: "Optional Preview Deploy",
      short: "Preview",
      detail: "Optional feature-branch deploy to preview or validation env.",
      system: "PRE-MERGE VALIDATION",
      tone: "build",
      iconTone: "deploy",
      platform: "flexdeploy",
      tooltip: note(
        "Optional pre-merge deployment from the feature branch for preview, UX review, or early QA validation.",
        "Do not treat this preview build as the release artifact.",
        "Release build and downstream promotion still begin only after the PR merges to main."
      )
    });
  }

  if (scenarioId === "emergency") {
    const emergencyByStrategy = {
      trunkBased: [
        {
          title: "Emergency Git Event",
          short: "Emergency Event",
          detail: "Urgent hotfix merge on trunk/main.",
          system: "INCIDENT CONTROL",
          tooltip: note("Emergency change detected and linked to incident ticket.", integration.review[2], integration.trigger)
        },
        {
          title: "Emergency Webhook",
          short: "Emergency Webhook",
          detail: "Webhook routes payload to emergency release profile.",
          system: "INCIDENT TRIGGER",
          tooltip: note(integration.webhook[0], "Include incident ID and commit SHA for audit traceability.")
        },
        {
          title: "Emergency Build Once",
          short: "Hotfix Build",
          detail: "Build once from merged trunk/main hotfix.",
          system: "ARTIFACT TRACEABILITY",
          tooltip: note(
            "Single emergency artifact is built from the merged trunk/main hotfix commit and promoted across all environments.",
            integration.release[0]
          )
        },
        {
          title: "Smoke Validation",
          short: "Smoke QA",
          detail: "Run focused smoke and critical regression checks.",
          system: "QUALITY VALIDATION",
          tooltip: note(integration.review[1], "Emergency profile keeps validation fast but governed.")
        },
        {
          title: "Emergency Approval",
          short: "Emergency Gate",
          detail: `Expedited gate: ${prodGate}.`,
          system: "INCIDENT RELEASE CONTROL",
          tooltip: note("Use emergency approver quorum with incident owner sign-off.", integration.approvals[0])
        },
        {
          title: "Production Hotfix Deploy",
          short: "Hotfix Deploy",
          detail: "Promote approved hotfix artifact and monitor recovery.",
          system: "PRODUCTION RESTORE",
          iconTone: "deploy",
          tooltip: note(integration.release[1], integration.observe[0], rollbackTip)
        }
      ],
      githubFlow: [
        {
          title: "Urgent PR Merge",
          short: "Urgent PR",
          detail: "Expedited hotfix PR merged to main.",
          system: "INCIDENT CONTROL",
          tooltip: note(integration.trigger, "Emergency PR policy still requires critical checks.")
        },
        {
          title: "Emergency Webhook",
          short: "Emergency Webhook",
          detail: "Merged emergency commit starts hotfix release path.",
          system: "INCIDENT TRIGGER",
          tooltip: note(integration.webhook[0], "Route hotfix payload into emergency pipeline profile.")
        },
        {
          title: "Emergency Build Once",
          short: "Hotfix Build",
          detail: "Build once from merged main hotfix.",
          system: "ARTIFACT TRACEABILITY",
          tooltip: note(
            "Emergency artifact is built from the merged main hotfix commit and remains immutable across staging and production.",
            integration.release[0]
          )
        },
        {
          title: "Staging Smoke Validation",
          short: "Staging Smoke",
          detail: "Validate hotfix artifact in staging with focused checks.",
          system: "QUALITY VALIDATION",
          tooltip: note(integration.release[1], "Focused smoke suite confirms production readiness.")
        },
        {
          title: "Emergency Approval",
          short: "Emergency Gate",
          detail: `Expedited gate: ${prodGate}.`,
          system: "INCIDENT RELEASE CONTROL",
          tooltip: note(integration.approvals[0], "Emergency approver quorum with incident reference.")
        },
        {
          title: "Production Hotfix Deploy",
          short: "Hotfix Deploy",
          detail: "Promote approved hotfix artifact and monitor incident recovery.",
          system: "PRODUCTION RESTORE",
          iconTone: "deploy",
          tooltip: note(integration.release[2], integration.observe[0], rollbackTip)
        }
      ],
      releaseFlow: [
        {
          title: "Hotfix/Release Event",
          short: "Hotfix Event",
          detail: "Approved hotfix merge into active release/* starts emergency path.",
          system: "INCIDENT CONTROL",
          tooltip: note(integration.trigger, integration.review[1], integration.review[2])
        },
        {
          title: "Webhook Routing",
          short: "Webhook",
          detail: "Merged release/* hotfix event routes to emergency release pipeline.",
          system: "INCIDENT TRIGGER",
          tooltip: note(integration.webhook[0], integration.webhook[1], integration.webhook[2])
        },
        {
          title: "Emergency Build Once",
          short: "Hotfix Build",
          detail: "Build once from patched active release/*.",
          system: "ARTIFACT TRACEABILITY",
          tooltip: note(
            "Emergency artifact is built from the active release/* commit after the hotfix PR merges, then promoted unchanged.",
            integration.release[0]
          )
        },
        {
          title: "QA/Staging Smoke",
          short: "Smoke QA",
          detail: "Run focused smoke and regression checks on the release-line artifact.",
          system: "QUALITY VALIDATION",
          tooltip: note(integration.release[1], "Emergency validation stays narrow but governed.")
        },
        {
          title: "Emergency Approval",
          short: "Emergency Gate",
          detail: `Expedited gate: ${prodGate}.`,
          system: "INCIDENT RELEASE CONTROL",
          tooltip: note(integration.approvals[0], "Emergency approval still follows the active release branch path.")
        },
        {
          title: "Production Hotfix Deploy",
          short: "Hotfix Deploy",
          detail: "Promote approved release-line hotfix artifact to production.",
          system: "PRODUCTION RESTORE",
          iconTone: "deploy",
          tooltip: note(integration.observe[0], integration.observe[1], rollbackTip)
        }
      ],
      gitFlow: [
        {
          title: "Hotfix Branch Event",
          short: "Hotfix Event",
          detail: "hotfix/* branch or patch tag triggers emergency path.",
          system: "INCIDENT CONTROL",
          tooltip: note(integration.trigger, integration.review[2])
        },
        {
          title: "Hotfix Webhook Routing",
          short: "Webhook Routing",
          detail: "Route hotfix event to emergency release pipeline.",
          system: "INCIDENT TRIGGER",
          tooltip: note(integration.webhook[0], integration.webhook[2])
        },
        {
          title: "Hotfix Candidate Build",
          short: "Hotfix Build",
          detail: "Build once from hotfix/* branch.",
          system: "ARTIFACT TRACEABILITY",
          tooltip: note(
            "Patch artifact is built from the hotfix branch that feeds the controlled Git Flow release path.",
            integration.release[0],
            "Patch candidate remains immutable during promotion."
          )
        },
        {
          title: "UAT Smoke Validation",
          short: "UAT Smoke",
          detail: "Run focused regression checks in UAT lane.",
          system: "QUALITY VALIDATION",
          tooltip: note(integration.release[1], "Emergency validation profile is narrower but mandatory.")
        },
        {
          title: "CAB Emergency Approval",
          short: "Emergency CAB",
          detail: `Emergency production gate: ${prodGate}.`,
          system: "INCIDENT RELEASE CONTROL",
          tooltip: note(integration.approvals[0], "Emergency CAB or release-manager approval with incident reference.")
        },
        {
          title: "Production Hotfix Deploy",
          short: "Hotfix Deploy",
          detail: "Promote approved patch artifact to production.",
          system: "PRODUCTION RESTORE",
          iconTone: "deploy",
          tooltip: note(integration.observe[1], integration.observe[2], rollbackTip)
        }
      ]
    };

    applyOverrides(nodes, emergencyByStrategy[strategyId] || emergencyByStrategy.trunkBased);
  } else if (scenarioId === "rollback") {
    const rollbackByStrategy = {
      trunkBased: [
        {
          title: "Regression Detected",
          short: "Regression",
          detail: "Production telemetry identifies release regression.",
          system: "INCIDENT DETECTION",
          tooltip: note("Identify failing commit and incident scope.", rollbackTip)
        },
        {
          title: "FlexDeploy Version Restore",
          short: "Version Restore",
          detail: "Deploy previously successful tracked version in FlexDeploy for immediate recovery.",
          system: "FLEXDEPLOY RECOVERY",
          tone: "gate",
          iconTone: "build",
          tooltip: note(
            "Phase 1: FlexDeploy restores a previously deployed tracked version for speed.",
            "Recovery deploy happens before Git history rollback."
          )
        },
        {
          title: "Rollback Branch",
          short: "Rollback Branch",
          detail: "Create rollback branch from protected trunk/main and revert the bad commit.",
          system: "GIT HISTORY CHANGE",
          tone: "source",
          tooltip: note(
            "Phase 2: start Git history rollback after service recovery.",
            "Rollback branch preserves reviewability and branch protection."
          )
        },
        {
          title: "Rollback PR Checks",
          short: "PR Checks",
          detail: "Open rollback PR and run required checks.",
          system: "GIT REVIEW GATE",
          tooltip: note(integration.review[0], integration.review[1])
        },
        {
          title: "Rollback PR Approval",
          short: "PR Approval",
          detail: `Approve and merge rollback PR under protected-branch policy (${prodGate}).`,
          system: "PROTECTED BRANCH POLICY",
          tone: "gate",
          tooltip: note(integration.approvals[0], "Merge occurs only after required approvals and checks.")
        },
        {
          title: "Git History Aligned",
          short: "History Sync",
          detail: "Protected trunk/main now reflects approved rollback history.",
          system: "GIT HISTORY ALIGNMENT",
          tone: "source",
          iconTone: "sync",
          tooltip: note(
            "Environment recovery already happened in FlexDeploy in Phase 1.",
            "This final step aligns Git source history only."
          )
        }
      ],
      githubFlow: [
        {
          title: "Regression Detected",
          short: "Regression",
          detail: "Production monitoring detects a faulty release.",
          system: "INCIDENT DETECTION",
          tooltip: note("Identify release SHA and impacted scope.", rollbackTip)
        },
        {
          title: "FlexDeploy Version Restore",
          short: "Version Restore",
          detail: "Deploy previously successful tracked version in FlexDeploy for immediate recovery.",
          system: "FLEXDEPLOY RECOVERY",
          tone: "gate",
          iconTone: "build",
          tooltip: note(
            "Phase 1: FlexDeploy restores a tracked deployed version immediately.",
            "Git history rollback follows as a separate governance path."
          )
        },
        {
          title: "Rollback Branch",
          short: "Rollback Branch",
          detail: "Create rollback branch from protected main and revert the bad commit.",
          system: "GIT HISTORY CHANGE",
          tone: "source",
          tooltip: note(
            "Phase 2: begin Git history rollback after environment recovery.",
            "Branch protection is preserved."
          )
        },
        {
          title: "Rollback PR Checks",
          short: "PR Checks",
          detail: "Open rollback PR to main and run required checks.",
          system: "GIT REVIEW GATE",
          tooltip: note(integration.review[0], integration.review[1])
        },
        {
          title: "Rollback PR Approval",
          short: "PR Approval",
          detail: `Approve and merge rollback PR to protected main (${prodGate}).`,
          system: "PROTECTED BRANCH POLICY",
          tone: "gate",
          tooltip: note(integration.approvals[0], "Merge only after required approvals/checks and incident linkage.")
        },
        {
          title: "Git History Aligned",
          short: "History Sync",
          detail: "Protected main now reflects approved rollback history.",
          system: "GIT HISTORY ALIGNMENT",
          tone: "source",
          iconTone: "sync",
          tooltip: note(
            "Environment recovery already happened in FlexDeploy in Phase 1.",
            "This final step aligns Git source history only."
          )
        }
      ],
      releaseFlow: [
        {
          title: "Regression Detected",
          short: "Regression",
          detail: "Release telemetry or QA finds a faulty promoted version.",
          system: "INCIDENT DETECTION",
          tooltip: note("Identify the active release branch, version, and failing commit.", rollbackTip)
        },
        {
          title: "FlexDeploy Version Restore",
          short: "Version Restore",
          detail: "Deploy previously successful tracked version in FlexDeploy for immediate recovery.",
          system: "FLEXDEPLOY RECOVERY",
          tone: "gate",
          iconTone: "build",
          tooltip: note(
            "Phase 1: FlexDeploy restores a tracked good release version immediately.",
            "Git history rollback on the release branch follows as a separate governed step."
          )
        },
        {
          title: "Rollback Release Branch",
          short: "Rollback Branch",
          detail: "Create rollback branch from active release/* and revert the bad commit.",
          system: "GIT HISTORY CHANGE",
          tone: "source",
          tooltip: note(
            "Phase 2: begin Git history rollback on the branch that owns the promoted artifact.",
            "This keeps the release line reviewable and auditable."
          )
        },
        {
          title: "Rollback PR Checks",
          short: "PR Checks",
          detail: "Open rollback PR to release/* and run required checks.",
          system: "GIT REVIEW GATE",
          tooltip: note(integration.review[1], integration.review[2])
        },
        {
          title: "Rollback PR Approval",
          short: "PR Approval",
          detail: `Approve and merge rollback PR to protected release/* (${prodGate}).`,
          system: "PROTECTED BRANCH POLICY",
          tone: "gate",
          tooltip: note(integration.approvals[0], integration.approvals[1])
        },
        {
          title: "Git History Aligned",
          short: "History Sync",
          detail: "Release rollback is synchronized back to main for the next release cycle.",
          system: "GIT HISTORY ALIGNMENT",
          tone: "source",
          iconTone: "sync",
          tooltip: note(
            "Environment recovery already happened in FlexDeploy in Phase 1.",
            "Final sync keeps main and the release line aligned."
          )
        }
      ],
      gitFlow: [
        {
          title: "Release Regression Found",
          short: "Regression",
          detail: "Tagged release issue triggers controlled rollback.",
          system: "INCIDENT DETECTION",
          tooltip: note("Identify failing release tag and rollback scope.", rollbackTip)
        },
        {
          title: "FlexDeploy Version Restore",
          short: "Version Restore",
          detail: "Deploy previously successful tracked version in FlexDeploy for immediate recovery.",
          system: "FLEXDEPLOY RECOVERY",
          tone: "gate",
          iconTone: "build",
          tooltip: note(
            "Phase 1: FlexDeploy restores tracked version first to recover service rapidly.",
            "Git history rollback follows as a separate lane."
          )
        },
        {
          title: "Rollback Hotfix Branch",
          short: "Rollback Branch",
          detail: "Create rollback hotfix branch and revert faulty change set.",
          system: "GIT HISTORY CHANGE",
          tone: "source",
          tooltip: note("Phase 2: Git rollback branch ensures auditable release history correction.", integration.review[0])
        },
        {
          title: "Rollback PR Checks",
          short: "PR Checks",
          detail: "Open rollback PR and run release validation checks.",
          system: "GIT REVIEW GATE",
          tooltip: note(integration.review[0], integration.review[1])
        },
        {
          title: "Rollback PR + CAB Approval",
          short: "PR + CAB",
          detail: `Approve rollback PR merge and required CAB control (${prodGate}).`,
          system: "PROTECTED BRANCH POLICY",
          tone: "gate",
          tooltip: note(integration.approvals[0], integration.approvals[1])
        },
        {
          title: "Git History Aligned",
          short: "History Sync",
          detail: "Main/develop rollback history is synchronized for next release.",
          system: "GIT HISTORY ALIGNMENT",
          tone: "source",
          iconTone: "sync",
          tooltip: note(
            "Environment recovery already happened in FlexDeploy in Phase 1.",
            integration.observe[2]
          )
        }
      ]
    };

    applyOverrides(nodes, rollbackByStrategy[strategyId] || rollbackByStrategy.trunkBased);

    if (rollbackMode === "automation") {
      const automationRollbackByStrategy = {
        trunkBased: [
          null,
          null,
          {
            title: "Automation Revert Commit",
            short: "Bot Revert",
            detail: "Trusted automation commits revert on protected trunk/main under exception policy.",
            system: "AUTOMATION HISTORY CHANGE",
            tone: "source",
            tooltip: note(
              "Phase 2: Git history rollback via trusted automation after FlexDeploy recovery.",
              "No human direct commit required."
            )
          },
          {
            title: "Post-Revert Validation",
            short: "Post-Revert QA",
            detail: "Run smoke validation on bot rollback commit.",
            system: "QUALITY VALIDATION",
            tooltip: note("Validation confirms rollback commit restores expected behavior.", integration.review[1])
          },
          {
            title: "Exception Approval Record",
            short: "Exception Audit",
            detail: `Record approver, incident, and bot identity (${prodGate}).`,
            system: "EXCEPTION CONTROL",
            tone: "gate",
            tooltip: note(
              integration.approvals[0],
              "Audit must capture service account, approver, and rollback SHA."
            )
          },
          {
            title: "Git History Aligned",
            short: "History Sync",
            detail: "Bot-approved rollback commit is now reflected on protected trunk/main.",
            system: "GIT HISTORY ALIGNMENT",
            tone: "source",
            iconTone: "sync",
            tooltip: note(
              "Environment recovery already happened in FlexDeploy in Phase 1.",
              "Audit records approver, automation identity, and rollback SHA."
            )
          }
        ],
        githubFlow: [
          null,
          null,
          {
            title: "Automation Revert Commit",
            short: "Bot Revert",
            detail: "Trusted automation commits revert on protected main under exception policy.",
            system: "AUTOMATION HISTORY CHANGE",
            tone: "source",
            tooltip: note(
              "Phase 2: Git history rollback via trusted automation after FlexDeploy recovery.",
              "Main stays protected for humans."
            )
          },
          {
            title: "Post-Revert Validation",
            short: "Post-Revert QA",
            detail: "Run required checks on bot rollback commit.",
            system: "QUALITY VALIDATION",
            tooltip: note("Checks validate bot rollback commit before closing incident.", integration.review[1])
          },
          {
            title: "Exception Approval Record",
            short: "Exception Audit",
            detail: `Record approver, incident, and bot identity (${prodGate}).`,
            system: "EXCEPTION CONTROL",
            tone: "gate",
            tooltip: note(integration.approvals[0], "Restrict bypass rights to trusted automation identity only.")
          },
          {
            title: "Git History Aligned",
            short: "History Sync",
            detail: "Bot rollback commit is now reflected on protected main.",
            system: "GIT HISTORY ALIGNMENT",
            tone: "source",
            iconTone: "sync",
            tooltip: note(
              "Environment recovery already happened in FlexDeploy in Phase 1.",
              integration.release[2]
            )
          }
        ],
        releaseFlow: [
          null,
          null,
          {
            title: "Automation Revert Commit",
            short: "Bot Revert",
            detail: "Trusted automation commits revert on protected release/* under exception policy.",
            system: "AUTOMATION HISTORY CHANGE",
            tone: "source",
            tooltip: note(
              "Phase 2: Git history rollback via trusted automation after FlexDeploy recovery.",
              "Release branch stays protected for humans."
            )
          },
          {
            title: "Post-Revert Validation",
            short: "Post-Revert QA",
            detail: "Run release validation checks on bot rollback commit.",
            system: "QUALITY VALIDATION",
            tooltip: note("Validation confirms the bot rollback before retagging and deploy.", integration.review[2])
          },
          {
            title: "Exception Approval Record",
            short: "Exception Audit",
            detail: `Record approver, incident, and bot identity (${prodGate}).`,
            system: "EXCEPTION CONTROL",
            tone: "gate",
            tooltip: note(integration.approvals[0], "Restrict bypass rights to trusted automation on the active release branch only.")
          },
          {
            title: "Git History Aligned",
            short: "History Sync",
            detail: "Bot rollback commit on release/* is synchronized back to main.",
            system: "GIT HISTORY ALIGNMENT",
            tone: "source",
            iconTone: "sync",
            tooltip: note(
              "Environment recovery already happened in FlexDeploy in Phase 1.",
              "Final sync keeps future main-based releases aligned with the rollback."
            )
          }
        ],
        gitFlow: [
          null,
          null,
          {
            title: "Automation Revert Commit",
            short: "Bot Revert",
            detail: "Trusted automation commits rollback revert on protected main.",
            system: "AUTOMATION HISTORY CHANGE",
            tone: "source",
            tooltip: note(
              "Phase 2: Git history rollback via trusted automation after FlexDeploy recovery.",
              "Allowed only for approved emergency/change windows."
            )
          },
          {
            title: "Post-Revert Validation",
            short: "Post-Revert QA",
            detail: "Run release checks on bot rollback commit.",
            system: "QUALITY VALIDATION",
            tooltip: note("Focused release checks confirm rollback safety.", integration.release[1])
          },
          {
            title: "Exception CAB Record",
            short: "Exception CAB",
            detail: `Record CAB/approver and bot identity (${prodGate}).`,
            system: "EXCEPTION CONTROL",
            tone: "gate",
            tooltip: note(integration.approvals[0], integration.approvals[1])
          },
          {
            title: "Git History Aligned",
            short: "History Sync",
            detail: "Bot rollback commit is aligned across protected release history.",
            system: "GIT HISTORY ALIGNMENT",
            tone: "source",
            iconTone: "sync",
            tooltip: note(
              "Environment recovery already happened in FlexDeploy in Phase 1.",
              integration.observe[2]
            )
          }
        ]
      };

      applyOverrides(nodes, automationRollbackByStrategy[strategyId] || automationRollbackByStrategy.trunkBased);
    }
  }

  applyFlowNodePlatforms(nodes, scenarioId);
  return nodes;
}

function applyFlowNodePlatforms(nodes, scenarioId) {
  if (!Array.isArray(nodes)) {
    return;
  }

  if (scenarioId === "rollback") {
    nodes.forEach((node, index) => {
      if (!node.platform) {
        node.platform = index === 1 ? "flexdeploy" : "git";
      }
    });
    return;
  }

  nodes.forEach((node, index) => {
    if (!node.platform) {
      node.platform = index === 0 ? "git" : "flexdeploy";
    }
  });
}

function getIntegrationStageMeta(stage) {
  const title = String(stage.title || "").toLowerCase();

  if (/git event|pull request|merge request|structured branches/.test(title)) {
    return { label: "Source", system: "Git host gate", tone: "source" };
  }
  if (/webhook/.test(title)) {
    return { label: "Webhook", system: "Incoming webhook", tone: "webhook" };
  }
  if (/artifact|build|release candidate/.test(title)) {
    return { label: "Build", system: "Build or snapshot", tone: "build" };
  }
  if (/approval|promotion|cab/.test(title)) {
    return { label: "Gate", system: "Release control", tone: "gate" };
  }
  if (/notify|callback|audit/.test(title)) {
    return { label: "Observe", system: "Notifications and audit", tone: "observe" };
  }
  if (/truthfulness|resynchronization|sync/.test(title)) {
    return { label: "Sync", system: "Branch alignment", tone: "sync" };
  }

  return { label: "Stage", system: "Delivery orchestration", tone: "source" };
}

function drawFlexSectionPanel(svg, panel) {
  const rect = createSvgElement("rect", {
    x: panel.x,
    y: panel.y,
    width: panel.width,
    height: panel.height,
    rx: 24,
    ry: 24,
    class: `flex-section flex-section-${panel.tone}`
  });
  svg.appendChild(rect);

  const iconBg = createSvgElement("circle", {
    cx: panel.x + 28,
    cy: panel.y + 34,
    r: 16,
    class: `flex-section-icon-bg flex-section-icon-bg-${panel.tone}`
  });
  svg.appendChild(iconBg);
  drawFlexIcon(svg, panel.tone, panel.x + 28, panel.y + 34);

  const title = createSvgElement("text", {
    x: panel.x + 54,
    y: panel.y + 38,
    class: "flex-section-title"
  });
  title.textContent = panel.title;
  svg.appendChild(title);

  drawSvgParagraph(svg, {
    x: panel.x + 20,
    y: panel.y + 58,
    text: panel.subtitle,
    className: "flex-section-subtitle",
    maxChars: Math.max(24, Math.floor((panel.width - 40) / 7.4)),
    lineHeight: 11
  });
}

function drawFlexNode(svg, node) {
  const { width, height } = node;
  const rect = createSvgElement("rect", {
    x: node.x,
    y: node.y,
    width,
    height,
    rx: 20,
    ry: 20,
    class: `flex-node flex-node-${node.tone}`
  });
  const tooltipBody = node.tooltip || node.detail || "";
  if (tooltipBody) {
    rect.classList.add("flex-tooltip-target");
    rect.setAttribute("tabindex", "0");
    rect.setAttribute("role", "button");
    rect.setAttribute("aria-label", `${node.title}. ${tooltipBody}`);
    rect.dataset.tooltipTitle = `${node.index + 1}. ${node.title}`;
    rect.dataset.tooltipBody = tooltipBody;
  }
  svg.appendChild(rect);

  const iconCircle = createSvgElement("circle", {
    cx: node.x + 34,
    cy: node.y + 30,
    r: 18,
    class: `flex-icon-bg flex-icon-bg-${node.tone}`
  });
  svg.appendChild(iconCircle);
  drawFlexIcon(svg, node.iconTone || node.tone, node.x + 34, node.y + 30);

  const badge = createSvgElement("text", {
    x: node.x + width - 18,
    y: node.y + 24,
    class: "flex-node-index"
  });
  badge.textContent = String(node.index + 1).padStart(2, "0");
  svg.appendChild(badge);

  drawSvgParagraph(svg, {
    x: node.x + 72,
    y: node.y + 24,
    text: node.title,
    className: "flex-node-title",
    maxChars: Math.max(18, Math.floor((width - 98) / 7.1)),
    lineHeight: 14
  });
  drawSvgParagraph(svg, {
    x: node.x + 72,
    y: node.y + 54,
    text: node.detail,
    className: "flex-node-detail",
    maxChars: Math.max(20, Math.floor((width - 98) / 6.5)),
    lineHeight: 11
  });

  const platform = node.platform === "flexdeploy" ? "flexdeploy" : "git";
  const platformLabel = platform === "flexdeploy" ? "FlexDeploy" : "Git Host";
  const platformWidth = drawFlexPlatformPill(svg, {
    x: node.x + 18,
    y: node.y + height - 24,
    platform,
    label: platformLabel,
    compact: true
  });

  drawFlexSystemPill(svg, {
    x: node.x + 18 + platformWidth + 8,
    y: node.y + height - 24,
    label: node.system,
    maxWidth: width - (18 + platformWidth + 8) - 18
  });
}

function drawFlexPlatformLegend(svg, x, y) {
  const gitWidth = drawFlexPlatformPill(svg, {
    x,
    y,
    platform: "git",
    label: "Git Host-managed"
  });

  drawFlexPlatformPill(svg, {
    x: x + gitWidth + 12,
    y,
    platform: "flexdeploy",
    label: "FlexDeploy-managed"
  });
}

function drawFlexPlatformPill(svg, { x, y, platform, label, compact = false }) {
  const text = String(label || "").trim();
  const height = compact ? 18 : 20;
  const iconSize = platform === "flexdeploy" ? (compact ? 10 : 11) : 0;
  const textOffset = platform === "flexdeploy" ? (compact ? 24 : 26) : 16;
  const textWidth = measurePillTextWidth(text, "700 9.6px \"IBM Plex Sans\", \"Segoe UI\", sans-serif");
  const width = Math.max(compact ? 64 : 84, Math.min(220, Math.ceil(textWidth + textOffset + 10)));

  const rect = createSvgElement("rect", {
    x,
    y,
    width,
    height,
    rx: height / 2,
    ry: height / 2,
    class: `flex-platform-pill flex-platform-pill-${platform}`
  });
  svg.appendChild(rect);

  if (platform === "flexdeploy") {
    const iconY = y + (height - iconSize) / 2;
    drawFlexExternalIcon(svg, "assets/icons/flexdeploy-mark.svg", x + 8, iconY, iconSize, "flex-platform-icon-image");
  } else {
    const dot = createSvgElement("circle", {
      cx: x + 8,
      cy: y + height / 2,
      r: compact ? 2.6 : 3.1,
      class: "flex-platform-dot"
    });
    svg.appendChild(dot);
  }

  const textNode = createSvgElement("text", {
    x: x + textOffset,
    y: y + height / 2,
    class: "flex-platform-pill-text",
    "dominant-baseline": "middle"
  });
  textNode.textContent = text;
  svg.appendChild(textNode);

  return width;
}

function drawFlexSystemPill(svg, { x, y, label, maxWidth = 380 }) {
  const text = String(label || "").trim();
  const height = 18;
  const textWidth = measurePillTextWidth(text, "700 9px \"IBM Plex Sans\", \"Segoe UI\", sans-serif");
  const letterSpacingWidth = text.length * 0.54;
  const naturalWidth = Math.ceil(textWidth + letterSpacingWidth + 18);
  const width = Math.max(84, Math.min(maxWidth, naturalWidth));

  const rect = createSvgElement("rect", {
    x,
    y,
    width,
    height,
    rx: height / 2,
    ry: height / 2,
    class: "flex-system-pill"
  });
  svg.appendChild(rect);

  const textNode = createSvgElement("text", {
    x: x + 9,
    y: y + height / 2,
    class: "flex-system-pill-text",
    "dominant-baseline": "middle"
  });
  textNode.textContent = text;
  svg.appendChild(textNode);
}

function measurePillTextWidth(text, font) {
  const value = String(text || "");
  if (!value) {
    return 0;
  }
  if (typeof document === "undefined") {
    return value.length * 6.2;
  }

  if (!measurePillTextWidth.canvas) {
    measurePillTextWidth.canvas = document.createElement("canvas");
  }
  const context = measurePillTextWidth.canvas.getContext("2d");
  if (!context) {
    return value.length * 6.2;
  }

  context.font = font;
  return context.measureText(value).width;
}

function drawFlexDecisionNode(svg, node) {
  const diamond = createSvgElement("path", {
    d: [
      `M ${node.x + 56} ${node.y + 8}`,
      `L ${node.x + 112} ${node.y + 62}`,
      `L ${node.x + 56} ${node.y + 116}`,
      `L ${node.x} ${node.y + 62}`,
      "Z"
    ].join(" "),
    class: "flex-node flex-node-gate"
  });
  svg.appendChild(diamond);

  const iconCircle = createSvgElement("circle", {
    cx: node.x + 56,
    cy: node.y + 62,
    r: 18,
    class: "flex-icon-bg flex-icon-bg-gate"
  });
  svg.appendChild(iconCircle);
  drawFlexIcon(svg, "gate", node.x + 56, node.y + 62);

  const badge = createSvgElement("text", {
    x: node.x + node.width - 8,
    y: node.y + 20,
    class: "flex-node-index"
  });
  badge.textContent = String(node.index + 1).padStart(2, "0");
  svg.appendChild(badge);

  drawSvgParagraph(svg, {
    x: node.x + 126,
    y: node.y + 32,
    text: node.title,
    className: "flex-node-title",
    maxChars: 15,
    lineHeight: 14
  });
  drawSvgParagraph(svg, {
    x: node.x + 126,
    y: node.y + 58,
    text: node.detail,
    className: "flex-node-detail",
    maxChars: 21,
    lineHeight: 12
  });

  const system = createSvgElement("text", {
    x: node.x + 126,
    y: node.y + 104,
    class: "flex-node-system"
  });
  system.textContent = node.system;
  svg.appendChild(system);
}

function drawFlexIcon(svg, tone, cx, cy) {
  const group = createSvgElement("g", {
    class: "flex-icon"
  });

  if (tone === "source") {
    drawFlexExternalIcon(group, "assets/icons/git-merge.svg", cx - 10, cy - 10, 20);
  } else if (tone === "webhook") {
    drawFlexExternalIcon(group, "assets/icons/webhook.svg", cx - 10, cy - 10, 20);
  } else if (tone === "build") {
    drawFlexExternalIcon(group, "assets/icons/build-wrench.svg", cx - 10, cy - 10, 20);
  } else if (tone === "deploy") {
    drawFlexExternalIcon(group, "assets/icons/deploy-icon.png", cx - 10, cy - 10, 20, "flex-icon-image flex-icon-image-white");
  } else if (tone === "qa") {
    drawFlexExternalIcon(group, "assets/icons/qa-flask.svg", cx - 10, cy - 10, 20);
  } else if (tone === "gate") {
    group.appendChild(createSvgElement("path", {
      d: `M ${cx} ${cy - 10} L ${cx + 8} ${cy - 6} L ${cx + 6} ${cy + 6} L ${cx} ${cy + 10} L ${cx - 6} ${cy + 6} L ${cx - 8} ${cy - 6} Z`,
      class: "flex-icon-outline"
    }));
    group.appendChild(createSvgElement("path", {
      d: `M ${cx - 4} ${cy} L ${cx - 1} ${cy + 3} L ${cx + 5} ${cy - 3}`,
      class: "flex-icon-stroke"
    }));
  } else if (tone === "observe") {
    group.appendChild(createSvgElement("path", {
      d: `M ${cx - 9} ${cy + 3} C ${cx - 5} ${cy - 4}, ${cx + 5} ${cy - 4}, ${cx + 9} ${cy + 3}`,
      class: "flex-icon-stroke"
    }));
    group.appendChild(createSvgElement("path", {
      d: `M ${cx - 6} ${cy + 1} C ${cx - 3} ${cy - 3}, ${cx + 3} ${cy - 3}, ${cx + 6} ${cy + 1}`,
      class: "flex-icon-stroke"
    }));
    group.appendChild(createSvgElement("circle", { cx, cy: cy + 5, r: 2.6, class: "flex-icon-fill" }));
  } else if (tone === "sync") {
    group.appendChild(createSvgElement("path", {
      d: `M ${cx - 8} ${cy - 1} C ${cx - 8} ${cy - 8}, ${cx + 2} ${cy - 9}, ${cx + 5} ${cy - 4}`,
      class: "flex-icon-stroke"
    }));
    group.appendChild(createSvgElement("path", {
      d: `M ${cx + 3} ${cy - 8} L ${cx + 8} ${cy - 4} L ${cx + 2} ${cy - 2}`,
      class: "flex-icon-stroke"
    }));
    group.appendChild(createSvgElement("path", {
      d: `M ${cx + 8} ${cy + 1} C ${cx + 8} ${cy + 8}, ${cx - 2} ${cy + 9}, ${cx - 5} ${cy + 4}`,
      class: "flex-icon-stroke"
    }));
    group.appendChild(createSvgElement("path", {
      d: `M ${cx - 3} ${cy + 8} L ${cx - 8} ${cy + 4} L ${cx - 2} ${cy + 2}`,
      class: "flex-icon-stroke"
    }));
  } else {
    group.appendChild(createSvgElement("circle", { cx, cy, r: 8, class: "flex-icon-outline" }));
    group.appendChild(createSvgElement("circle", { cx, cy, r: 2.4, class: "flex-icon-fill" }));
  }

  svg.appendChild(group);
}

function bindFlexdeployDiagramTooltips(svg, tooltipTargets = {}) {
  const wrap = svg.closest(".integration-diagram-wrap");
  const tooltip = tooltipTargets.tooltip || elements.flexdeployTooltip;
  const tooltipTitle = tooltipTargets.tooltipTitle || elements.flexdeployTooltipTitle;
  const tooltipBody = tooltipTargets.tooltipBody || elements.flexdeployTooltipBody;
  if (!wrap || !tooltip || !tooltipTitle || !tooltipBody) {
    return;
  }

  const hideTooltip = () => {
    hideFlexTooltip(tooltip);
  };

  const positionTooltip = (event, target) => {
    const wrapRect = wrap.getBoundingClientRect();
    let left;
    let top;

    if (event && typeof event.clientX === "number") {
      left = event.clientX - wrapRect.left + wrap.scrollLeft + 14;
      top = event.clientY - wrapRect.top + wrap.scrollTop + 14;
    } else {
      const targetRect = target.getBoundingClientRect();
      left = targetRect.right - wrapRect.left + wrap.scrollLeft + 14;
      top = targetRect.top - wrapRect.top + wrap.scrollTop + targetRect.height / 2 - 10;
    }

    const maxLeft = Math.max(8, wrap.scrollWidth - tooltip.offsetWidth - 8);
    const maxTop = Math.max(8, wrap.scrollHeight - tooltip.offsetHeight - 8);
    tooltip.style.left = `${Math.max(8, Math.min(left, maxLeft))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(top, maxTop))}px`;
  };

  const showTooltip = (target, event) => {
    tooltipTitle.textContent = target.dataset.tooltipTitle || "Step";
    tooltipBody.textContent = target.dataset.tooltipBody || "";
    tooltip.hidden = false;
    tooltip.classList.add("is-visible");
    positionTooltip(event, target);
  };

  const targets = svg.querySelectorAll(".flex-tooltip-target");
  targets.forEach((target) => {
    target.addEventListener("pointerenter", (event) => showTooltip(target, event));
    target.addEventListener("pointermove", (event) => {
      if (!tooltip.hidden) {
        positionTooltip(event, target);
      }
    });
    target.addEventListener("pointerleave", hideTooltip);
    target.addEventListener("focus", () => showTooltip(target));
    target.addEventListener("blur", hideTooltip);
  });

  wrap.onscroll = hideTooltip;
  svg.onmouseleave = hideTooltip;
  svg.onkeydown = (event) => {
    if (event.key === "Escape") {
      hideTooltip();
    }
  };
}

function drawFlexExternalIcon(container, href, x, y, size, className = "flex-icon-image") {
  const image = createSvgElement("image", {
    href,
    x,
    y,
    width: size,
    height: size,
    "preserveAspectRatio": "xMidYMid meet",
    class: className
  });
  image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
  container.appendChild(image);
}

function drawFlexArtifactBadge(svg, artifact) {
  const rect = createSvgElement("rect", {
    x: artifact.x,
    y: artifact.y,
    width: artifact.width,
    height: artifact.height,
    rx: 18,
    ry: 18,
    class: "flex-artifact-chip"
  });
  svg.appendChild(rect);

  const iconBg = createSvgElement("circle", {
    cx: artifact.x + 28,
    cy: artifact.y + artifact.height / 2,
    r: 16,
    class: "flex-artifact-icon-bg"
  });
  svg.appendChild(iconBg);

  svg.appendChild(createSvgElement("ellipse", {
    cx: artifact.x + 28,
    cy: artifact.y + artifact.height / 2 - 5,
    rx: 7,
    ry: 3.2,
    class: "flex-artifact-icon"
  }));
  svg.appendChild(createSvgElement("path", {
    d: [
      `M ${artifact.x + 21} ${artifact.y + artifact.height / 2 - 5}`,
      `V ${artifact.y + artifact.height / 2 + 7}`,
      `C ${artifact.x + 21} ${artifact.y + artifact.height / 2 + 11}, ${artifact.x + 35} ${artifact.y + artifact.height / 2 + 11}, ${artifact.x + 35} ${artifact.y + artifact.height / 2 + 7}`,
      `V ${artifact.y + artifact.height / 2 - 5}`
    ].join(" "),
    class: "flex-artifact-icon"
  }));

  const title = createSvgElement("text", {
    x: artifact.x + 54,
    y: artifact.y + 26,
    class: "flex-artifact-title"
  });
  title.textContent = "Artifact / Snapshot";
  svg.appendChild(title);

  const detail = createSvgElement("text", {
    x: artifact.x + 54,
    y: artifact.y + 42,
    class: "flex-artifact-detail"
  });
  detail.textContent = "Same build promoted everywhere";
  svg.appendChild(detail);
}

function drawFlexEnvironment(svg, envNode) {
  const rect = createSvgElement("rect", {
    x: envNode.x,
    y: envNode.y,
    width: envNode.width,
    height: envNode.height,
    rx: 18,
    ry: 18,
    class: envNode.isProd ? "flex-env-box flex-env-box-prod" : "flex-env-box"
  });
  svg.appendChild(rect);

  const iconBg = createSvgElement("circle", {
    cx: envNode.x + 28,
    cy: envNode.y + 28,
    r: 14,
    class: envNode.isProd ? "flex-env-icon-bg flex-env-icon-bg-prod" : "flex-env-icon-bg"
  });
  svg.appendChild(iconBg);

  svg.appendChild(createSvgElement("rect", {
    x: envNode.x + 21,
    y: envNode.y + 22,
    width: 14,
    height: 10,
    rx: 2,
    ry: 2,
    class: "flex-env-icon-stroke"
  }));
  svg.appendChild(createSvgElement("line", {
    x1: envNode.x + 24,
    y1: envNode.y + 35,
    x2: envNode.x + 32,
    y2: envNode.y + 35,
    class: "flex-env-icon-stroke"
  }));

  const badge = createSvgElement("text", {
    x: envNode.x + envNode.width - 16,
    y: envNode.y + 22,
    class: "flex-env-index"
  });
  badge.textContent = String(envNode.index + 1).padStart(2, "0");
  svg.appendChild(badge);

  const label = createSvgElement("text", {
    x: envNode.x + 52,
    y: envNode.y + 34,
    class: "flex-env-label-left"
  });
  label.textContent = envNode.label;
  svg.appendChild(label);

  const caption = createSvgElement("text", {
    x: envNode.x + 18,
    y: envNode.y + envNode.height - 16,
    class: "flex-env-caption"
  });
  caption.textContent = envNode.isProd ? "Final deploy after approval" : "Auto promotion lane";
  svg.appendChild(caption);
}

function drawFlexEndpointChip(svg, endpoint) {
  const width = endpoint.width || 96;
  const rect = createSvgElement("rect", {
    x: endpoint.x,
    y: endpoint.y,
    width,
    height: 34,
    rx: 17,
    ry: 17,
    class: "flex-endpoint-chip"
  });
  svg.appendChild(rect);

  const icon = createSvgElement("circle", {
    cx: endpoint.x + 18,
    cy: endpoint.y + 17,
    r: 6,
    class: "flex-endpoint-dot"
  });
  svg.appendChild(icon);

  const text = createSvgElement("text", {
    x: endpoint.x + width / 2 + 8,
    y: endpoint.y + 22,
    class: "flex-endpoint-text"
  });
  text.textContent = endpoint.text;
  svg.appendChild(text);
}

function drawFlexConnector(svg, connector) {
  const attributes = {
    class: connector.dashed ? "flex-edge flex-edge-dashed" : "flex-edge",
    "marker-end": "url(#flexArrowhead)"
  };
  const edge = connector.path
    ? createSvgElement("path", {
        d: connector.path,
        ...attributes
      })
    : createSvgElement("line", {
        x1: connector.x1,
        y1: connector.y1,
        x2: connector.x2,
        y2: connector.y2,
        ...attributes
      });
  svg.appendChild(edge);

  if (connector.label) {
    drawFlexPill(svg, {
      x: connector.labelX ?? connector.x1,
      y: connector.labelY ?? connector.y1,
      text: connector.label
    });
  }
}

function drawFlexPill(svg, pill) {
  const text = shortenDiagramLabel(pill.text, 34);
  const width = Math.max(92, Math.min(232, text.length * 6.2 + 26));
  const x = pill.x - width / 2;

  const rect = createSvgElement("rect", {
    x,
    y: pill.y - 11,
    width,
    height: 22,
    rx: 11,
    ry: 11,
    class: "flex-pill"
  });
  svg.appendChild(rect);

  const label = createSvgElement("text", {
    x: pill.x,
    y: pill.y + 4,
    class: "flex-pill-text"
  });
  label.textContent = text;
  svg.appendChild(label);
}

function drawSvgParagraph(svg, { x, y, text, className, maxChars = 26, lineHeight = 12 }) {
  const lines = splitSvgLines(text, maxChars);
  const textNode = createSvgElement("text", {
    x,
    y,
    class: className
  });

  lines.forEach((line, index) => {
    const tspan = createSvgElement("tspan", {
      x,
      dy: index === 0 ? "0" : String(lineHeight)
    });
    tspan.textContent = line;
    textNode.appendChild(tspan);
  });

  svg.appendChild(textNode);
}

function splitSvgLines(text, maxCharsPerLine) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [""];
  }

  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, 3);
}

function stripFlexPrefix(text, prefix) {
  return String(text || "").startsWith(prefix) ? String(text).slice(prefix.length) : String(text || "");
}

function shortenDiagramLabel(text, maxLength) {
  const value = String(text || "").trim();
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function createFlexArrowDefinition() {
  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker", {
    id: "flexArrowhead",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto-start-reverse"
  });
  const arrowPath = createSvgElement("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    fill: "#2e536f"
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  return defs;
}

function getGitFlowSteps(steps) {
  const ciPattern =
    /(deploy|pipeline|promot|artifact|rollout|feature flag|observability|slo|release marker)/i;
  const movementPattern =
    /(checkout|branch|merge|revert|cherry-pick|tag|pull request|\bpr\b|hotfix|rollback)/i;

  const filtered = steps.filter((step) => {
    const text = `${step.note} ${step.action} ${step.command}`;
    if (movementPattern.test(text)) {
      return true;
    }
    return !ciPattern.test(text);
  });
  return filtered.length >= 2 ? filtered : steps;
}

function renderComparisonMatrix() {
  if (!elements.comparisonTable) {
    return;
  }

  const rows = [
    { label: "Learning curve", key: "learningCurve" },
    { label: "Release cadence", key: "releaseCadence" },
    { label: "Governance depth", key: "governance" },
    { label: "Emergency handling", key: "emergency" },
    { label: "Rollback pattern", key: "rollback" },
    { label: "Best team context", key: "teamFit" }
  ];

  elements.comparisonTable.textContent = "";

  const header = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.appendChild(createCell("th", "Decision Dimension"));

  STRATEGY_ORDER.forEach((strategyId) => {
    const strategy = STRATEGIES[strategyId];
    headerRow.appendChild(createCell("th", strategy.label));
  });

  header.appendChild(headerRow);

  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.appendChild(createCell("th", row.label));
    STRATEGY_ORDER.forEach((strategyId) => {
      const strategy = STRATEGIES[strategyId];
      tr.appendChild(createCell("td", strategy.comparison[row.key]));
    });
    body.appendChild(tr);
  });

  elements.comparisonTable.appendChild(header);
  elements.comparisonTable.appendChild(body);
}

function createArrowDefinition() {
  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker", {
    id: "arrowhead",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto-start-reverse"
  });
  const arrowPath = createSvgElement("path", {
    d: "M 0 0 L 10 5 L 0 10 z",
    fill: "#2e536f"
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  return defs;
}

function createSvgElement(type, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  return element;
}

function createCell(tag, value) {
  const cell = document.createElement(tag);
  cell.textContent = value;
  return cell;
}

function debounce(callback, waitMs) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), waitMs);
  };
}

window.addEventListener(
  "resize",
  debounce(() => {
    const strategy = STRATEGIES[state.strategyId];
    const scenario = strategy.scenarios[state.scenarioId];
    renderBranchMap(strategy, scenario);
  }, 110)
);

renderStrategyTabs();
renderScenarioTabs();
initCompareControls();
initRollbackModeControl();
renderActiveView();
