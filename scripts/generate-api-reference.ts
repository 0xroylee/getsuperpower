import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectApiRouteDocs } from "../packages/server/src/http/api-docs";
import { generateApiReferenceMarkdown } from "../packages/server/src/http/api-reference-markdown";
import { createAppRoutes } from "../packages/server/src/http/app-routes";
import type { AppDeps } from "../packages/server/src/types/app.types";

const API_REFERENCE_PATH = path.resolve(
	import.meta.dir,
	"../docs/api-reference.md",
);

export async function writeApiReferenceMarkdown(
	outputPath = API_REFERENCE_PATH,
): Promise<void> {
	const markdown = generateApiReferenceMarkdown(readApiRouteDocs());
	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, markdown, "utf8");
}

export function readApiRouteDocs() {
	return collectApiRouteDocs(createAppRoutes(createDocsDeps()));
}

function createDocsDeps(): AppDeps {
	return {
		cliExecutor: {
			execute: async (request) => ({ status: "succeeded", request }),
			executeStream: async (request) => ({ status: "succeeded", request }),
			getHistory: () => [],
		},
	};
}

if (import.meta.main) {
	await writeApiReferenceMarkdown();
	console.log(`Generated ${path.relative(process.cwd(), API_REFERENCE_PATH)}`);
}
