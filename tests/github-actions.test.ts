import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const workflowRoot = join(import.meta.dir, "..", ".github", "workflows");

async function readWorkflow(fileName: string): Promise<string> {
  return readFile(join(workflowRoot, fileName), "utf8");
}

function expectRootQualityGate(workflow: string): void {
  expect(workflow).toContain("- name: Run root checks\n        run: bun run check");
  expect(workflow).toContain("- name: Build CLI\n        run: bun run build");
  expect(workflow).toContain("- name: Smoke built CLI\n        run: node dist/cli.js --help");
}

function expectLandingQualityGate(workflow: string): void {
  expect(workflow).toContain(
    "- name: Install landing dependencies\n        working-directory: landing\n        run: bun install --frozen-lockfile",
  );
  expect(workflow).toContain(
    "- name: Run landing checks\n        working-directory: landing\n        run: bun run check",
  );
}

describe("GitHub Actions quality gates", () => {
  test("checks the root CLI surface for PRs and main pushes", async () => {
    const workflow = await readWorkflow("pr-check.yml");

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:\n    branches:\n      - main");
    expectRootQualityGate(workflow);
    expect(workflow).not.toContain("working-directory: landing");
  });

  test("checks the full build and test surface before release packaging", async () => {
    const workflow = await readWorkflow("release.yml");
    const qualityGateIndex = workflow.indexOf("- name: Run root checks");
    const packIndex = workflow.indexOf("- name: Pack release assets");

    expect(qualityGateIndex).toBeGreaterThan(-1);
    expect(packIndex).toBeGreaterThan(qualityGateIndex);
    expectRootQualityGate(workflow);
    expectLandingQualityGate(workflow);
  });

  test("publishes releases through npm trusted publishing", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("registry-url: https://registry.npmjs.org");
    expect(workflow).toContain("npm publish --ignore-scripts --provenance --access public");
    expect(workflow).not.toContain("secrets.NPM_TOKEN");
    expect(workflow).not.toContain("NODE_AUTH_TOKEN");
    expect(workflow).not.toContain("npm whoami");
  });
});
