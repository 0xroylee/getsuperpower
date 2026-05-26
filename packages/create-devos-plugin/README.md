# create-devos-plugin

Scaffold devos runtime plugins with the files needed for local development and
installation. Generated plugins include a `devos.plugin.json` manifest, a skill,
worker source, tests, and optional MCP configuration.

## Quick Start

Use the standalone package bin:

```bash
create-devos-plugin docs-helper --template skill
cd docs-helper
bun install
bun test
bun run build
devos plugins install .
devos plugins enable docs-helper
devos plugins check docs-helper
```

Or use the devos CLI wrapper:

```bash
devos plugins create docs-helper --template skill
cd docs-helper
bun install
bun test
bun run build
devos plugins install .
devos plugins enable docs-helper
devos plugins check docs-helper
```

Plugin names are normalized to kebab-case IDs. For example,
`"Docs Helper"` becomes `docs-helper`.

## Templates

Choose the smallest template that matches the plugin surface:

```bash
create-devos-plugin docs-helper --template skill
create-devos-plugin local-tools --template mcp
create-devos-plugin slack-helper --template connector
```

- `skill`: agent-facing instructions plus a worker and validation test.
- `mcp`: a skill, worker, `.mcp.json`, and manifest MCP server entry.
- `connector`: a skill, worker, and connector-oriented manifest category.

If no template or preset is provided, the generator uses `skill`.

## Presets

Presets choose a template and add known manifest entries for common integrations:

```bash
create-devos-plugin codegraph --preset codegraph
create-devos-plugin slack --preset slack
create-devos-plugin telegram --preset telegram
```

- `codegraph`: creates an MCP plugin that runs `codegraph serve --mcp` and
  checks `codegraph --version`.
- `slack`: creates a connector plugin that prompts for `SLACK_BOT_TOKEN`.
- `telegram`: creates a connector plugin that prompts for `TELEGRAM_BOT_TOKEN`.

## Options

```bash
create-devos-plugin <name> [options]
devos plugins create <name> [options]
```

- `--template <type>`: `skill`, `mcp`, or `connector`.
- `--preset <preset>`: `codegraph`, `slack`, or `telegram`.
- `--output <dir>`: parent directory for the generated plugin.
- `--display-name <name>`: human-readable plugin name.
- `--description <text>`: manifest and skill description.
- `--author <text>`: author value stored in generated `package.json` metadata.
- `--force`: replace an existing generated plugin directory.
- `--json`: print the scaffold result as formatted JSON.

## Generated Files

Every generated plugin contains:

- `devos.plugin.json`: declares skills, MCP servers, credentials, and checks.
- `package.json`: Bun scripts and plugin metadata.
- `README.md`: generated plugin development notes.
- `skills/<plugin-id>/SKILL.md`: agent-facing usage instructions.
- `src/worker.ts`: editable worker source.
- `src/types/worker.types.ts`: worker context types.
- `dist/worker.mjs`: workflow-readable runtime artifact.
- `tests/worker.test.ts`: focused worker startup test.

Plugins with MCP servers also include `.mcp.json`.
