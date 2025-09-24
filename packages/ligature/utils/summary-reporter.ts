// reporters/summary.ts
import type { RunnerTask, RunnerTestFile } from "vitest"
import type { Reporter } from "vitest/reporters"

function printTask(t: RunnerTask, prefix = "") {
  if (t.type === "suite") {
    console.log(`${prefix}${t.name}`)
    for (const child of t.tasks) {
      printTask(child, prefix + "  ")
    }
  } else if (t.type === "test" && t.result) {
    const status =
      t.result.state === "pass"
        ? "✅"
        : t.result.state === "fail"
        ? "❌"
        : "➖"
    console.log(`${prefix}${status} ${t.name}`)
  }
}

export default class SummaryReporter implements Reporter {
  onFinished(files: RunnerTestFile[]) {
    for (const f of files) {
      for (const t of f.tasks) printTask(t)
    }
  }
}
