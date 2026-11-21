# Implementation Loop

1. **Task Execution Loop**

For each task in priority order:

When the selected engine is cross-model execution, this loop still owns unit ordering, evidence selection, actual-scope inspection, authoritative verification, and incremental canonical commits, but worker authoring follows the serial external-unit protocol in `references/cross-model-execution.md`. Detached process completion is only authoring evidence; do not mark the task complete until the controller records the host-owned canonical commit. A preserved or restoration-blocked unit stops this loop before fallback, retry, or the next unit.

```
while (tasks remain):
  - Mark task as in-progress
  - Read any referenced files from the plan or discovered during Phase 0
  - **If the unit's work is already present and matches the plan's intent** (files exist with the expected capability, or the unit's `Verification` criteria are already satisfied by the current code), the work has likely shipped on a prior branch or session. Verify it matches, mark the task complete, and move on. Do not silently reimplement.
  - Look for similar patterns in codebase
  - Find existing coverage for the affected behavior (Test Discovery — see below)
  - Choose the evidence strategy for this task before changing behavior
  - When the evidence strategy calls for pre-implementation proof, create/update/strengthen the test or characterization coverage now and verify the expected failure or baseline capture before changing production code
  - Implement following existing conventions
  - Update coverage only where the task changes an expectation or leaves a material gap
  - Run System-Wide Test Check when the change affects an interaction between components or a persistent state transition
  - Run tests after changes as needed under Verification Scope, reusing applicable results
  - Assess testing coverage for the changed behavior and record the reason for any replacement verification
  - Record verification evidence for the task: behavior-change signal, existing tests inspected, tests added/changed/used unchanged, red failure or characterization observed when applicable, verification run, and any exception reason
  - Mark task as completed
  - Evaluate for incremental commit (see below)
```

For a parallel wave, the loop pauses at a host-owned integration stop after every canonical result. Inspect the actual result rather than its declared scope, re-run the independence judgment against the advancing tree, and recompute readiness from committed prerequisites. Affected dependents remain queued. An unaffected sibling may continue only after any failed apply or verification has been restored exactly and the prior integration lock released. Re-dispatch a stale or colliding result on the new base, resolve it explicitly, or finish it serially; never treat a conflict-free apply as semantic proof. Repeated collision or broad edits disable further parallel waves for the run.

**Verification Scope**

- Follow the user's and project's validation rules and applicable plan or controller gates. For routine work, use one focused existing validation pass for the coherent change. Combine related targets in one invocation where practical. For non-behavioral edits, use an artifact-specific check or diff inspection.
- Reuse a passing result when it covers the same behavior and its relevant code, tests, configuration, and environment inputs are still current. At commits and handoffs, record existing evidence. After simplification or review fixes, use the smallest check that restores affected evidence or covers a new gap. Controller-owned checks still run through the controller.
- Broaden only to satisfy an explicit requirement or cover a material risk a narrower check cannot address, such as auth, payments, migrations, data loss, or a changed shared contract. Add lint, typecheck, or build when it addresses a distinct risk or is required. If the runner cannot scope a necessary check, explain why the broader command is needed.
- After a failed check, fix an in-scope cause and verify the fix within the project's retry rules. Report unrelated failures and their effect on verification.

Honor the user's requested verification style and a unit's applicable `Execution note`. For a non-obvious regression or fragile legacy contract, default to test-first or characterization-first when recording the old behavior materially improves confidence. For routine changes with adequate existing coverage, one focused post-change pass is enough.

Guardrails for execution evidence:
- Do not write the test and implementation in the same step when working proof-first
- When using a failing test as proof, verify that it fails for the expected reason before implementing the fix or feature
- Do not over-implement beyond the current behavior slice when working proof-first
- Do not add a duplicate regression test. Update the existing test when it owns the changed expectation.

**Test Discovery** — For behavior changes, start with the plan's named tests or the existing tests for the affected entry point. Inspect enough to determine whether they exercise the changed behavior.

**Evidence Strategy** — Test discovery decides where proof belongs:

| Situation | Action |
|-----------|--------|
| Existing test covers the behavior | Use it unchanged. Reuse a known failure for regression reproduction when needed. |
| Existing test asserts an expectation the task changes | Update it to reflect the new contract. |
| A material regression could escape existing checks | Strengthen an existing test or add one focused test that would catch it. |
| A test adds little evidence or is unsuitable for the surface | Use an appropriate artifact, smoke, or manual check and record why. |

**Test Scenario Completeness** — Cover required plan scenarios and material risks introduced by the change. Use happy paths, boundaries, failure paths, and integration as prompts for spotting gaps in existing evidence.

**System-Wide Test Check** — Trace affected callers, callbacks, retries, and state transitions where they determine the outcome. If a changed interaction needs proof, choose a focused case that exercises the real boundary and reuse existing integration coverage when it suffices. For example, a retry change that can duplicate a persisted write should verify that state across failure and retry.
