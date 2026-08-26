---
name: ce-commit-push-pr
description: Commit task-owned changes, push HEAD, and create or update one concise pull request. Use when asked to ship, commit and open a PR, or when repository instructions require automatic PR delivery. Stop after the PR is open unless the user explicitly requests monitoring, review, stacking, or merge work.
metadata:
  opencode/autoinvoke: "false"
argument-hint: "[PR ref] [description-only] [stack] [babysit]"
---

# Commit, push, and open a pull request

Deliver the completed change without repeating implementation work.

## Default workflow

1. Run one scoped repository snapshot: current branch plus `git status --short` and the task-owned diff. Do not audit every worktree or rerun tests.
2. If HEAD is detached or on the default branch, create one feature branch from the current commit while preserving task-owned changes. Do not alter unrelated dirty files.
3. Stage explicit task-owned paths. Never use `git add .` or `git add -A`.
4. Create one commit unless the completed work already contains appropriate commits or clearly requires separate independently useful commits.
5. Confirm the current branch once, then push the live HEAD with `git push -u origin HEAD`.
6. Check once for an open pull request for the current head branch.
7. Create one concise pull request when absent, or leave the existing pull request unchanged unless its description is materially stale.
8. Return the pull-request URL and stop.

Use repository commit conventions. A concise PR body contains:

```markdown
## Summary
- user-visible or operational value
- material implementation boundary

## Validation
- checks already completed during implementation
```

Preserve any existing `Fixes`, `Closes`, or `Related` lines. Never invent test results or evidence.

## Existing pull requests

Use `gh pr list --head <branch> --state open --json number,url,title,body,headRefName,headRepositoryOwner`. Exit 0 with `[]` means no open PR. A nonzero result means PR state is unknown; resolve authentication or connectivity once before creating anything. Do not create a duplicate.

## Description-only mode

When the user asks only to write or update a PR description, inspect that PR and edit only its title/body. Do not commit, push, test, review, or monitor.

## Explicit advanced modes

Load advanced references or invoke another CE skill only when the user explicitly requests that behavior:

- PR stack: load `references/stack-submit.md`.
- Detailed branded or teaching description: load `references/pr-description-writing.md` and the requested supporting reference only.
- Babysitting or monitoring: invoke `ce-babysit-pr` after the PR opens.
- Review, simplification, or feedback resolution: invoke the named workflow separately.

Do not proactively suggest stacks, evidence capture, concept archives, review waves, description rewrites, or babysitting. Pipeline callers receive the same lean default unless their explicit contract names an advanced mode.
