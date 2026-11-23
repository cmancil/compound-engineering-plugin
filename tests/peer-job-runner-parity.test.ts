import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "path"
import { describe, expect, test } from "bun:test"

const PLUGIN_ROOT = path.join(process.cwd(), "skills")

// The peer-job runner is byte-duplicated into every consuming review skill
// (the plugin has no cross-skill import mechanism — see AGENTS.md "File
// References in Skills"). All copies must stay identical.
const RUNNER_ASSETS = ["scripts/peer-job-runner.py"]

const CONSUMER_SKILLS = [
  "ce-doc-review",
  "ce-code-review",
  "ce-pov",
  "ce-work",
  "ce-plan",
  "ce-brainstorm",
]
const PEER_WORKERS = [
  "ce-doc-review/scripts/cross-model-doc-review.sh",
  "ce-code-review/scripts/cross-model-adversarial-review.sh",
  "ce-pov/scripts/cross-model-pov.sh",
  "ce-plan/scripts/elevation-dispatch.sh",
  "ce-brainstorm/scripts/elevation-dispatch.sh",
]
const HEARTBEAT_BLOCK = /start_heartbeat\(\) \{[\s\S]*?\r?\n\}\r?\n(?=\r?\nrun_codex_cmd\(\))/
const TERM_HANDLER = /^on_term\(\) \{[\s\S]*?^\}/m

describe("peer-job-runner shared-asset parity", () => {
  for (const asset of RUNNER_ASSETS) {
    test(`${asset} exists in every consumer and is byte-identical`, async () => {
      const contents = await Promise.all(
        CONSUMER_SKILLS.map(async (skill) => {
          const p = path.join(PLUGIN_ROOT, skill, asset)
          return readFile(p, "utf8")
        }),
      )
      for (let i = 1; i < contents.length; i++) {
        expect(contents[i]).toBe(contents[0])
      }
    })
  }

  test("peer-worker heartbeat lifecycle is identical and exits with its parent", async () => {
    const kernels = await Promise.all(
      PEER_WORKERS.map(async (worker) => {
        const body = await readFile(path.join(PLUGIN_ROOT, worker), "utf8")
        expect(body).toContain('wait "$_HEARTBEAT_PID" 2>/dev/null || true')
        // Tolerate CRLF checkouts (\r?\n) — Windows runners often set
        // core.autocrlf=true; the heartbeat body itself must still match.
        expect(body.match(TERM_HANDLER)?.[0]).toContain("stop_heartbeat")
        const match = body.match(HEARTBEAT_BLOCK)
        expect(match).not.toBeNull()
        return match![0]
      }),
    )
    for (let i = 1; i < kernels.length; i++) {
      expect(kernels[i]).toBe(kernels[0])
    }
    expect(kernels[0]).toContain('parent_pid="$$"')
    expect(kernels[0]).toContain('kill -0 "$parent_pid" 2>/dev/null')
  })

  test.skipIf(process.platform === "win32")("reaps the heartbeat timer and closes output on exit and cancellation", async () => {
    const worker = await readFile(path.join(PLUGIN_ROOT, "ce-pov/scripts/cross-model-pov.sh"), "utf8")
    const heartbeat = worker.match(HEARTBEAT_BLOCK)?.[0]
    const onTerm = worker.match(TERM_HANDLER)?.[0]
    expect(heartbeat).toBeDefined()
    expect(onTerm).toBeDefined()

    const fixture = `
_HEARTBEAT_PID=""
ACTIVE_PEER_PID=""
${onTerm}
${heartbeat}
trap 'on_term' TERM INT
start_heartbeat
for (( attempt=0; attempt<200; attempt++ )); do
  [ -s "$HEARTBEAT_TIMER_PID_FILE" ] && break
  /bin/sleep 0.01
done
[ -s "$HEARTBEAT_TIMER_PID_FILE" ] || exit 1
if [ "$1" = cancel ]; then
  kill -TERM "$$"
  exit 2
fi
stop_heartbeat
`.replace(/\r\n/g, "\n")
    // Model a timer that misses TERM during startup and record its PID independently of the output pipes.
    const dir = await mkdtemp(path.join(tmpdir(), "peer-heartbeat-"))
    try {
      await writeFile(
        path.join(dir, "sleep"),
        '#!/bin/sh\ntrap "" TERM\nprintf "%s\\n" "$$" > "$HEARTBEAT_TIMER_PID_FILE"\nexec /bin/sleep "$@"\n',
        { mode: 0o700 },
      )
      for (const action of ["finish", "cancel"]) {
        const pidFile = path.join(dir, action)
        const result = spawnSync("bash", ["-c", fixture, "heartbeat-fixture", action], {
          encoding: "utf8",
          timeout: 3_000,
          env: {
            ...process.env,
            PATH: dir + path.delimiter + process.env.PATH,
            CROSS_MODEL_HEARTBEAT_SECS: "10",
            HEARTBEAT_TIMER_PID_FILE: pidFile,
          },
        })
        expect(result.error, action).toBeUndefined()
        expect(result.status, result.stderr || action).toBe(0)
        const timerPid = Number(await readFile(pidFile, "utf8"))
        expect(timerPid).toBeGreaterThan(1)
        expect(() => process.kill(timerPid, 0), action).toThrow(/ESRCH|no such process/i)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }, 10_000)
})
