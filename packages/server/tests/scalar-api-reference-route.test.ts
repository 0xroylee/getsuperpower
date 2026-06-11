import { describe, expect, it } from "bun:test";
import { apiReference } from "@scalar/express-api-reference";
import type { Express } from "express";
import {
	API_REFERENCE_PATHS,
	API_REFERENCE_ROUTE_OPTIONS,
	createExpressApp,
} from "../src/express-server";

describe("Scalar API reference routes", () => {
	it("mounts Scalar middleware on the docs routes", () => {
		const app = createExpressApp(fallbackHandler);

		for (const route of API_REFERENCE_PATHS) {
			expect(hasMatchingMiddleware(app, route)).toBeTrue();
			expect(hasMatchingMiddleware(app, `${route}/`)).toBeTrue();
		}
	});

	it("renders Scalar API reference HTML from the OpenAPI spec URL", () => {
		const handler = apiReference(API_REFERENCE_ROUTE_OPTIONS);
		const response = createHtmlCaptureResponse();

		handler({} as never, response as never, (error?: unknown) => {
			if (error) {
				throw error;
			}
		});

		expect(response.contentType).toBe("text/html");
		expect(response.body).toContain("devos.ing API Reference");
		expect(response.body).toContain("/openapi.yaml");
		expect(response.body).toContain("@scalar/api-reference");
	});
});

function fallbackHandler(): Response {
	return Response.json({ error: "unexpected fallback" }, { status: 500 });
}

function hasMatchingMiddleware(app: Express, path: string): boolean {
	return ((app as unknown as ExpressRouterStack).router?.stack ?? []).some(
		(layer) => layer.matchers?.some((matcher) => Boolean(matcher(path))),
	);
}

function createHtmlCaptureResponse(): HtmlCaptureResponse {
	return {
		body: "",
		type(value) {
			this.contentType = value;
			return this;
		},
		send(value) {
			this.body = String(value);
			return this;
		},
	};
}

interface ExpressRouterStack {
	router?: {
		stack?: ExpressLayer[];
	};
}

interface ExpressLayer {
	matchers?: Array<(path: string) => unknown>;
}

interface HtmlCaptureResponse {
	body: string;
	contentType?: string;
	type(value: string): HtmlCaptureResponse;
	send(value: unknown): HtmlCaptureResponse;
}
