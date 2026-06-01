import { describe, expect, it } from "bun:test";
import { captureWithRuntime } from "./args-test-helpers";

describe("createCliProgram release", () => {
	it("routes GitHub release listing without loading project config", async () => {
		const result = await captureWithRuntime([
			"bun",
			"devos",
			"release",
			"list",
			"--limit",
			"5",
			"--repo",
			"acme/devos",
		]);

		expect(result.calls).toEqual([
			{
				name: "release",
				payload: {
					command: {
						action: "list",
						limit: 5,
						repo: "acme/devos",
					},
					cwd: "/tmp/devos-test",
				},
			},
		]);
	});

	it("routes tag-only release processing", async () => {
		const result = await captureWithRuntime([
			"bun",
			"devos",
			"release",
			"tag",
			"v0.0.1",
			"--message",
			"Release v0.0.1",
		]);

		expect(result.calls).toEqual([
			{
				name: "release",
				payload: {
					command: {
						action: "tag",
						tag: "v0.0.1",
						message: "Release v0.0.1",
						remote: "origin",
					},
					cwd: "/tmp/devos-test",
				},
			},
		]);
	});
});
