import { describe, expect, it } from "bun:test";

type UiStoreModule = typeof import("../src/lib/ui-store/ui-store");

describe("ui store project pins", () => {
	it("pins projects once and unpins by id", async () => {
		const useUiStore = await loadUiStoreWithStorage(createMemoryStorage());

		useUiStore.getState().pinProject("project-a");
		useUiStore.getState().pinProject("project-b");
		useUiStore.getState().pinProject("project-a");

		expect(useUiStore.getState().pinnedProjectIds).toEqual([
			"project-a",
			"project-b",
		]);

		useUiStore.getState().unpinProject("project-a");

		expect(useUiStore.getState().pinnedProjectIds).toEqual(["project-b"]);
	});

	it("persists project pins across store reloads", async () => {
		const storage = createMemoryStorage();
		const firstStore = await loadUiStoreWithStorage(storage);

		firstStore.getState().pinProject("project-a");
		firstStore.getState().pinProject("project-b");

		const secondStore = await loadUiStoreWithStorage(storage);

		expect(secondStore.getState().pinnedProjectIds).toEqual([
			"project-b",
			"project-a",
		]);
	});

	it("does not persist transient drafts or modal state", async () => {
		const storage = createMemoryStorage();
		const useUiStore = await loadUiStoreWithStorage(storage);

		useUiStore.getState().pinProject("project-a");
		useUiStore.getState().updateDrafts({ commandInputDraft: "run tests" });
		useUiStore.getState().openModal("createRun", "workspace-1");

		const persisted = JSON.parse(storage.getItem("devos-ui-store") ?? "{}");

		expect(persisted.state).toEqual({
			pinnedProjectIds: ["project-a"],
		});
	});
});

async function loadUiStoreWithStorage(
	storage: Storage,
): Promise<UiStoreModule["useUiStore"]> {
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: storage,
	});
	const module = (await import(
		`../src/lib/ui-store/ui-store.ts?test=${Date.now()}-${Math.random()}`
	)) as UiStoreModule;
	return module.useUiStore;
}

function createMemoryStorage(entries: [string, string][] = []): Storage {
	const values = new Map(entries);
	return {
		clear: () => {
			values.clear();
		},
		key: (index) => [...values.keys()][index] ?? null,
		get length() {
			return values.size;
		},
		getItem: (key) => values.get(key) ?? null,
		removeItem: (key) => {
			values.delete(key);
		},
		setItem: (key, value) => {
			values.set(key, value);
		},
	};
}
