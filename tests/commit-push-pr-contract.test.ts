import { readFile } from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"
import { parseFrontmatter } from "../src/utils/frontmatter"

async function skill(): Promise<string> {
  return readFile(path.join(process.cwd(), "skills/ce-commit-push-pr/SKILL.md"), "utf8")
}

describe("lean ce-commit-push-pr contract", () => {
  test("defaults to one bounded delivery sequence", async () => {
    const content = await skill()

    expect(content).toContain("one scoped repository snapshot")
    expect(content).toContain("Stage explicit task-owned paths")
    expect(content).toContain("git push -u origin HEAD")
    expect(content).toContain("Create one concise pull request")
    expect(content).toContain("Return the pull-request URL and stop")
  })

  test("does not repeat implementation validation", async () => {
    const content = await skill()

    expect(content).toContain("without repeating implementation work")
    expect(content).toContain("Do not audit every worktree or rerun tests")
    expect(content).toContain("checks already completed during implementation")
  })

  test("never stages the whole workspace", async () => {
    const content = await skill()

    expect(content).toContain("Never use `git add .` or `git add -A`")
    expect(content).toContain("Do not alter unrelated dirty files")
  })

  test("checks existing PR state once and refuses duplicates", async () => {
    const content = await skill()

    expect(content).toContain("gh pr list --head <branch> --state open")
    expect(content).toContain("Do not create a duplicate")
    expect(content).toContain("A nonzero result means PR state is unknown")
  })

  test("keeps advanced work explicit", async () => {
    const content = await skill()

    expect(content).toContain("## Explicit advanced modes")
    expect(content).toContain("PR stack: load `references/stack-submit.md`")
    expect(content).toContain("Babysitting or monitoring: invoke `ce-babysit-pr`")
    expect(content).toContain("Do not proactively suggest stacks")
  })

  test("does not automatically monitor or review", async () => {
    const content = await skill()

    expect(content).toContain("Stop after the PR is open")
    expect(content).toContain("only when the user explicitly requests that behavior")
    expect(content).not.toMatch(/Auto-hand off by default/i)
    expect(content).not.toMatch(/babysit handoff.+default on/i)
  })

  test("is disabled for OpenCode autoinvocation", async () => {
    const content = await skill()
    const { data } = parseFrontmatter(content)

    expect(data.metadata?.["opencode/autoinvoke"]).toBe("false")
  })
})
