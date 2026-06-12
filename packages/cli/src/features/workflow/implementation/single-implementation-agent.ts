import { type AgentAdapter, type AgentResult, runAdapterAgent } from "adapters";
import { buildFixPrompt, buildImplementPrompt } from "../../../skills/prompts";
import type { ResolvedProjectConfig, RunState } from "../../types";
import { runAgentWithChatLog } from "../agents/agent-chat-log";
import { resolveAgentLogMetadata } from "../agents/agent-log-metadata";

export async function runSingleImplementationAgent({
	agent,
	codexSessionId,
	config,
	fixRound,
	state,
}: {
	agent: AgentAdapter;
	codexSessionId: string;
	config: ResolvedProjectConfig;
	fixRound: boolean;
	state: RunState;
}): Promise<AgentResult> {
	const prompt = fixRound
		? await buildFixPrompt(
				config.skills.implement,
				state.issue,
				state.planSummary ?? "",
				state.testingSummary ?? state.reviewSummary ?? "",
				state.bugs,
				state.pullRequest,
			)
		: await buildImplementPrompt(
				config.skills.implement,
				state.issue,
				state.planSummary ?? "",
			);
	return runAgentWithChatLog({
		workspacePath: config.workspacePath,
		projectId: config.id,
		issue: state.issue,
		agentRole: "implementing",
		...resolveAgentLogMetadata(config, "implementing"),
		skillPath: config.skills.implement,
		prompt,
		invoke: ({ onStream } = { onStream: () => {} }) =>
			runAdapterAgent(agent, {
				role: "implementing",
				prompt,
				sessionId: codexSessionId,
				skills: [{ name: "implementation", path: config.skills.implement }],
				onStream,
			}),
	});
}
