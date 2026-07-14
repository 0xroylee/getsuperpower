import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  DEFAULT_ORCHESTRATION_CONFIG,
  type OrchestrationConfig,
  OrchestrationConfigSchema,
  orchestrationConfigFileName,
  type PlannedAgentProfile,
} from "../runtimes/omniskill/orchestration";

export type AgentProfileInstallStatus = "create" | "unchanged" | "update" | "conflict";

export interface AgentProfileArtifact {
  kind: "agent_profile";
  source: string;
  profileId: string;
  agent: "codex" | "claude";
  status: "installed" | "updated" | "unchanged";
  path: string;
  contentHash: string;
}

export interface PlannedAgentProfileWrite {
  profile: PlannedAgentProfile;
  status: AgentProfileInstallStatus;
  artifact: AgentProfileArtifact;
}

function hash(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export async function loadOrchestrationConfigPlan(input: { homeDir: string }): Promise<{
  path: string;
  status: "create" | "unchanged";
  config: OrchestrationConfig;
  content: string;
}> {
  const path = join(input.homeDir, ".omniskills", orchestrationConfigFileName);
  if (!existsSync(path)) {
    const content = `${JSON.stringify(DEFAULT_ORCHESTRATION_CONFIG, null, 2)}\n`;
    return { path, status: "create", config: DEFAULT_ORCHESTRATION_CONFIG, content };
  }
  const content = await readFile(path, "utf8");
  return {
    path,
    status: "unchanged",
    config: OrchestrationConfigSchema.parse(JSON.parse(content)),
    content,
  };
}

export async function preflightAgentProfiles(input: {
  profiles: PlannedAgentProfile[];
  previousArtifacts: AgentProfileArtifact[];
  force?: boolean;
}): Promise<PlannedAgentProfileWrite[]> {
  const previousByPath = new Map(
    input.previousArtifacts.map((artifact) => [artifact.path, artifact]),
  );
  const writes: PlannedAgentProfileWrite[] = [];
  for (const profile of input.profiles) {
    const previous = previousByPath.get(profile.destination);
    const exists = existsSync(profile.destination);
    let status: AgentProfileInstallStatus;
    if (!exists) {
      status = "create";
    } else {
      const actualHash = hash(await readFile(profile.destination, "utf8"));
      if (!previous || actualHash !== previous.contentHash) {
        status = input.force ? "update" : "conflict";
      } else {
        status = actualHash === profile.contentHash ? "unchanged" : "update";
      }
    }
    writes.push({
      profile,
      status,
      artifact: {
        kind: "agent_profile",
        source: profile.source,
        profileId: profile.profileId,
        agent: profile.target,
        status:
          status === "update" ? "updated" : status === "unchanged" ? "unchanged" : "installed",
        path: profile.destination,
        contentHash: profile.contentHash,
      },
    });
  }
  return writes;
}

export async function executeAgentProfilePlan(input: {
  profiles: PlannedAgentProfileWrite[];
  config?: { path: string; status: "create" | "unchanged"; content: string };
}): Promise<AgentProfileArtifact[]> {
  const conflict = input.profiles.find(({ status }) => status === "conflict");
  if (conflict) {
    throw new Error(`Agent profile conflict: ${conflict.profile.destination}`);
  }

  const changed: Array<{ path: string; previous: string | null }> = [];
  try {
    for (const planned of input.profiles) {
      if (planned.status === "unchanged") continue;
      const destination = planned.profile.destination;
      const previous = existsSync(destination) ? await readFile(destination, "utf8") : null;
      await mkdir(dirname(destination), { recursive: true });
      const temporary = `${destination}.omniskills-tmp`;
      await writeFile(temporary, planned.profile.content);
      await rename(temporary, destination);
      changed.push({ path: destination, previous });
    }

    if (input.config?.status === "create") {
      await mkdir(dirname(input.config.path), { recursive: true });
      const temporary = `${input.config.path}.omniskills-tmp`;
      await writeFile(temporary, input.config.content);
      await rename(temporary, input.config.path);
      changed.push({ path: input.config.path, previous: null });
    }
  } catch (error) {
    for (const entry of changed.reverse()) {
      if (entry.previous === null) {
        await rm(entry.path, { force: true });
      } else {
        await writeFile(entry.path, entry.previous);
      }
    }
    throw error;
  }

  return input.profiles.map(({ artifact }) => artifact);
}
