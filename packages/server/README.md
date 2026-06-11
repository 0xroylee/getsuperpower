# devos Server

The `devos-server` package owns the local HTTP API process for the operator
app. It handles route registration, OpenAPI request validation, realtime and
workflow websocket behavior, cron runtime entrypoints, read repositories,
database startup, and server-side tests.

For the broader product story and contributor setup, start with the
[root README](../../README.md).

## Run The Server

Start the HTTP API from the repository root:

```bash
bun run --filter devos-server start
```

The server defaults to port `3001` in local daemon flows. The web app proxies
`/api/*` requests to `DEVOS_SERVER_BASE_URL`, which defaults to
`http://127.0.0.1:3001`.

Cron jobs use the server runtime but run through a separate command:

```bash
bun run --filter devos-server cron
bun run --filter devos-server cron:once
```

## API Documentation

The canonical request-validation contract is the root
[openapi.yaml](../../openapi.yaml). The Express server serves it at
`/openapi.yaml` and mounts Scalar API Reference at `/api-docs` and `/openapi`.

Server route metadata also powers `GET /api/docs/routes`, which returns the
current route list used by the web UI and documentation tooling.

Generate the committed Markdown API reference with:

```bash
bun run docs:api
```

That command writes [docs/api-reference.md](../../docs/api-reference.md). When
adding or changing routes, update the route docs under `src/http/`, keep
`openapi.yaml` aligned, and rerun `bun run docs:api`.

Useful focused API-doc checks:

```bash
bun test packages/server/tests/api-docs-routes.test.ts
bun test packages/server/tests/api-reference-markdown.test.ts
bun test packages/server/tests/openapi-contract.test.ts
```

## Package Checks

Run these before handing off server changes:

```bash
bun run --filter devos-server check
bun run --filter devos-server typecheck
bun run --filter devos-server test
```

For cross-workspace changes or release readiness, run the root quality gates:

```bash
bun run check
bun run typecheck
bun test
```

## Package Boundaries

- Keep server runtime code under `src/`.
- Keep HTTP request handling, validation, and response mapping in `src/http/`
  or route-specific modules.
- Keep server contracts in `src/**/types/` files separate from runtime
  implementation.
- Keep realtime and workflow websocket behavior under `src/realtime/` and
  `src/workflow-data/`.
- Keep cron scheduling/runtime behavior under `src/features/cron/` or the
  legacy cron entrypoints.
