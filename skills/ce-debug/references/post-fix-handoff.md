# ce-debug — post-fix handoff (interactive)

Loaded at Phase 4 when Phase 3 actually applied a fix in interactive mode. Not used in `mode:pipeline` (see `pipeline-mode.md`) and not used when the user chose "Diagnosis only" — in both cases Phase 4 ends at the Debug Summary.

Deliver the verified fix using the Phase 3 evidence, without repeating validation or expanding the bug's scope.

## Optional post-fix polish/review (before commit or PR)

**Opt-in only.** Invoke `ce-simplify-code` or `ce-code-review` only when the user explicitly requested that work or an explicitly invoked pipeline requires it. A non-trivial diff, multiple files, or a high-risk surface does not independently authorize another workflow. Required risk-based validation remains part of Phase 3.

**Default handoff.** When no extra workflow was requested, proceed directly to delivery with the existing focused validation and diff inspection. Do not add a review menu or a Post-Fix Quality block merely to report skipped steps.

**Scope requested simplification.** Use the branch diff only when the branch is skill-owned or clearly contains only this fix; otherwise scope to fix-owned files that were clean before Phase 3. Skip files containing pre-existing user edits.

**Scope requested review.** Run `ce-code-review` only on a fix-only branch or with `base:<pre-fix-HEAD>` from a clean pre-fix tree. Otherwise use an explicitly file-scoped review, or the Phase 3 manual inspection, and disclose the scope limit.

**Handle residual findings before shipping.** Do not auto-open a PR with unresolved P0/P1 findings, or with findings whose fix needs a product/design decision — ask whether to fix now, accept/defer durably, or stop. Accepted residuals must not live only in the session: if a PR will be opened, pass them as "Known Residuals" context to `ce-commit-push-pr`; on commit-only or stop, prefer filing a ticket per finding in the tracker detected in Phase 1.4, with enough background to action it standalone (the finding, why it matters, file:line, severity, a pointer to the review run, and the branch/head SHA so it points at the code even without a PR). Only when no tracker is reachable, write `<root>/residual-review-findings/<branch-or-head-sha>.md`, stage it with the fix, and name the path in the final summary.

**Re-verify only invalidated evidence.** If requested simplification or review changes relevant behavior, tests, dependencies, or configuration, rerun the affected focused check. Reuse successful results after formatting, committing, pushing, and PR-description edits. Report unrelated pre-existing failures without expanding the fix.

Only when extra quality work actually ran, append this block below the Debug Summary:

```
## Post-Fix Quality
**Scope**: [fix-only branch / base:<pre-fix-HEAD> / fix-owned files only / targeted manual due to unrelated branch work]
**Simplify**: [ran/skipped + reason]
**Review**: [ran/skipped/manual + outcome]
**Residuals**: [none / accepted Known Residuals for PR / filed as tracker tickets / accepted residuals written to <root>/residual-review-findings/<branch-or-head-sha>.md (last resort) / blocked pending user decision]
**Re-verification**: [checks rerun after tail edits]
```

## Commit / PR handoff detail

SKILL.md's Phase 4 **Routing** block owns the bare per-option actions — which skill fires on which branch, and the three pre-existing-branch options. It stays there because it must fire even if this file is never read. This section owns only the detail that shapes those actions.

**Contextual overrides come first, on either branch.** An explicit, clearly applicable instruction — "always review before pushing", "open PRs as drafts", "don't open PRs from skills" — outranks the default routing. On a skill-owned branch that means switching to the pre-existing-branch question or skipping the PR step, whichever matches what the user said. A vague tonal cue is not an override.

**The skill-owned-branch preview is not a question.** State what gets committed, on what branch, and that a PR will be opened, then proceed without waiting. It exists so the user can interrupt.

**`branding:on` is load-bearing on both paths.** The explicit branding signal records that `ce-debug` produced the fix; a handoff without it loses that provenance.

**Issue auto-close syntax.** When the entry came from an issue tracker, include that tracker's auto-close syntax in the location it requires — most parse PR descriptions (`Fixes #N` for GitHub, `Closes ABC-123` for Linear), but some parse only commit messages (Jira Smart Commits) — so the fix flows back to the issue and closes it on merge.

## Learning-capture criteria (after a PR is open, either path)

Most bugs are localized mechanical fixes where the only "lesson" is the bug itself, and compounding those clutters `<root>/solutions/` without adding value.

- **Skip silently** when the fix is mechanical with no generalizable insight. Default to this when in doubt.
- **Offer neutrally** when the lesson fits in one sentence — "X.foo() returns T | undefined when Y, not just T", or "the diagnostic path was non-obvious and worth recording." If you cannot articulate the lesson, skip rather than offer.
- **Lean into the offer** when the pattern appears in 3+ locations, or the root cause reveals a wrong assumption about a shared dependency, framework, or convention that other code is likely to repeat.

These are the criteria only; SKILL.md's Routing block owns what fires when the user accepts.
