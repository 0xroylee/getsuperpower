import { describe, expect, it } from "bun:test";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
	PGLITE_RUNTIME_ASSETS,
	resolvePglitePackageEntry,
	resolvePgliteRuntimeAssets,
} from "../scripts/build";

const DIST_DIR = path.resolve(import.meta.dir, "../dist");
const EXPECTED_MIGRATIONS = [
	"0001_initial_schema.sql",
	"0002_token_usage_upgrade.sql",
	"0003_project_cron_jobs.sql",
	"0004_inbox_messages.sql",
	"0005_agent_details.sql",
	"0006_board_task_linear_refs.sql",
	"0007_nullable_board_task_project.sql",
	"0008_board_task_keys.sql",
	"0009_merge_pr_created_status.sql",
	"0010_polling_observability.sql",
	"0011_project_metadata.sql",
];

describe("CLI build script", () => {
	it("resolves PGlite from the database package boundary", async () => {
		const calls: Array<{ specifier: string; parent: string }> = [];
		const dbEntry = "/workspace/packages/db/src/index.ts";
		const pgliteEntry = "/workspace/node_modules/pglite/dist/index.js";

		const entry = await resolvePglitePackageEntry(async (specifier, parent) => {
			calls.push({ specifier, parent });
			if (specifier === "devos-db") {
				return dbEntry;
			}
			if (specifier === "@electric-sql/pglite") {
				return pgliteEntry;
			}
			throw new Error(`Unexpected specifier: ${specifier}`);
		});

		expect(entry).toBe(pgliteEntry);
		expect(calls).toEqual([
			{
				specifier: "devos-db",
				parent: path.resolve(import.meta.dir, ".."),
			},
			{ specifier: "@electric-sql/pglite", parent: dbEntry },
		]);
	});

	it("resolves PGlite runtime assets required by bundled devos", async () => {
		const assets = await resolvePgliteRuntimeAssets();

		expect(assets.map((asset) => asset.fileName).sort()).toEqual(
			[...PGLITE_RUNTIME_ASSETS].sort(),
		);
		for (const asset of assets) {
			expect(path.basename(asset.path)).toBe(asset.fileName);
			expect((await stat(asset.path)).isFile()).toBe(true);
		}
	});

	describe("post-build dist directory contents", () => {
		it("includes all migration SQL files in dist/migrations/", async () => {
			const migrationsDir = path.join(DIST_DIR, "migrations");
			const files = await readdir(migrationsDir);

			for (const expected of EXPECTED_MIGRATIONS) {
				expect(files).toContain(expected);
				expect((await stat(path.join(migrationsDir, expected))).isFile()).toBe(
					true,
				);
			}
		});

		it("does not include non-SQL files in dist/migrations/", async () => {
			const migrationsDir = path.join(DIST_DIR, "migrations");
			const files = await readdir(migrationsDir);

			for (const file of files) {
				expect(file.endsWith(".sql")).toBe(true);
			}
		});
	});
});
