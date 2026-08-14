import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"
import { parseFrontmatter } from "../src/utils/frontmatter"

const EXPLICIT_ROUTING_SKILLS = [
  { name: "ce-work", formerBroadTrigger: "Use when implementing from a plan" },
  { name: "ce-debug", formerBroadTrigger: "Use for errors, stack traces" },
  { name: "ce-code-review", formerBroadTrigger: "Use before PRs or when asked for review" },
  { name: "ce-simplify-code", formerBroadTrigger: "Use after implementation and before review" },
]

describe("explicit-only Compound Engineering routing", () => {
  for (const { name, formerBroadTrigger } of EXPLICIT_ROUTING_SKILLS) {
    test(`${name} stays explicit or pipeline invoked`, () => {
      const skillPath = path.join(process.cwd(), "skills", name, "SKILL.md")
      const { data } = parseFrontmatter(readFileSync(skillPath, "utf8"), skillPath)
      const description = typeof data.description === "string" ? data.description : ""

      expect(data.name).toBe(name)
      expect(description).toContain(`explicitly names ${name}`)
      expect(description).toContain("explicitly invoked Compound Engineering pipeline")
      expect(description).toMatch(/do not auto-activate/i)
      expect(description).not.toContain(formerBroadTrigger)
    })
  }
})
