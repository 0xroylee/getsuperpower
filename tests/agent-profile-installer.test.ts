import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  executeAgentProfilePlan,
  loadOrchestrationConfigPlan,
  preflightAgentProfiles,
} from "../src/plugins/agent-profile-installer";
import {
  DEFAULT_ORCHESTRATION_CONFIG,
  type PlannedAgentProfile,
} from "../src/runtimes/omniskill/orchestration";

function profile(homeDir: string): PlannedAgentProfile {
  const content = 'name = "omniskills-test-team-cto"\n';
  return {
    source: "catalog:cto",
    profileId: "omniskills-test-team-cto",
    target: "codex",
    tier: "deep",
    model: "gpt-5.6",
    effort: "high",
    access: "read-only",
    candidateIndex: 0,
    destination: join(homeDir, ".codex", "agents", "omniskills-test-team-cto.toml"),
    content,
    contentHash: "sha256:dc1e7574859a9c5ffaf59e58344aabf284394fcb97d8d5775e5af5a8390eb285",
  };
}

describe("agent profile installer", () => {
  test("plans a missing global config without writing it", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "orchestration-config-"));
    try {
      const plan = await loadOrchestrationConfigPlan({ homeDir });
      expect(plan.status).toBe("create");
      expect(plan.config).toEqual(DEFAULT_ORCHESTRATION_CONFIG);
      await expect(readFile(plan.path, "utf8")).rejects.toThrow();
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });

  test("creates, detects unchanged, and refuses drifted profiles", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "orchestration-profile-"));
    const planned = profile(homeDir);
    try {
      const first = await preflightAgentProfiles({ profiles: [planned], previousArtifacts: [] });
      expect(first.map(({ status }) => status)).toEqual(["create"]);
      await executeAgentProfilePlan({ profiles: first });

      const unchanged = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: [
          {
            kind: "agent_profile",
            source: planned.source,
            profileId: planned.profileId,
            agent: planned.target,
            status: "installed",
            path: planned.destination,
            contentHash: planned.contentHash,
          },
        ],
      });
      expect(unchanged.map(({ status }) => status)).toEqual(["unchanged"]);

      const updatedContent = 'name = "omniskills-test-team-cto-v2"\n';
      const updated = {
        ...planned,
        content: updatedContent,
        contentHash: `sha256:${createHash("sha256").update(updatedContent).digest("hex")}`,
      };
      const update = await preflightAgentProfiles({
        profiles: [updated],
        previousArtifacts: unchanged.map(({ artifact }) => artifact),
      });
      expect(update.map(({ status }) => status)).toEqual(["update"]);

      await writeFile(planned.destination, "user edit\n");
      const conflict = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: unchanged.map(({ artifact }) => artifact),
      });
      expect(conflict.map(({ status }) => status)).toEqual(["conflict"]);

      const forced = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: unchanged.map(({ artifact }) => artifact),
        force: true,
      });
      expect(forced.map(({ status }) => status)).toEqual(["update"]);
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });

  test("refuses an unowned foreign profile unless force is explicit", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "orchestration-foreign-"));
    const planned = profile(homeDir);
    try {
      const initial = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: [],
      });
      await executeAgentProfilePlan({ profiles: initial });
      const conflict = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: [],
      });
      expect(conflict.map(({ status }) => status)).toEqual(["conflict"]);

      const forced = await preflightAgentProfiles({
        profiles: [planned],
        previousArtifacts: [],
        force: true,
      });
      expect(forced.map(({ status }) => status)).toEqual(["update"]);
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });

  test("rolls back earlier profile writes when a later write fails", async () => {
    const homeDir = await mkdtemp(join(tmpdir(), "orchestration-rollback-"));
    const firstProfile = profile(homeDir);
    const blockedParent = join(homeDir, "blocked-parent");
    const blockedProfile: PlannedAgentProfile = {
      ...firstProfile,
      source: "explorer",
      profileId: "omniskills-test-team-explorer",
      destination: join(blockedParent, "omniskills-test-team-explorer.toml"),
    };
    try {
      await writeFile(blockedParent, "not a directory\n");
      const writes = await preflightAgentProfiles({
        profiles: [firstProfile, blockedProfile],
        previousArtifacts: [],
      });
      await expect(executeAgentProfilePlan({ profiles: writes })).rejects.toThrow();
      await expect(readFile(firstProfile.destination, "utf8")).rejects.toThrow();
    } finally {
      await rm(homeDir, { recursive: true, force: true });
    }
  });
});
