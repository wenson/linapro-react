# LinaPro TapCanvas Studio

`linapro-tapcanvas-studio` is a managed, tenant-aware source plugin that hosts the TapCanvas project entry and infinite-canvas workspace inside LinaPro. It is not enabled automatically during LinaPro startup.

## Boundaries

- LinaPro owns authentication, users, tenants, RBAC, data permission, database governance, and the React host.
- `linapro-ai-core` owns provider, model, credential, and typed AI capability governance.
- This plugin owns TapCanvas projects, chapters, flows, assets, materials, storyboards, generation jobs, business memory, and the governed Agents Bridge.
- Hono, Prisma, BullMQ, TapCanvas JWT, Team, billing, commerce, and `new-api` runtime paths are not shipped by this plugin.
- The source repository `../../../../TapCanvas` is read-only migration input.

## Current stage

Stage one only provides the managed-plugin manifest, embedded source-plugin registration, bilingual resources, and two lazy React page entries. Enable it explicitly in plugin management when it is ready for use:

- `/tapcanvas/projects` uses the normal page surface.
- `/tapcanvas/studio` uses the workspace surface.

Business APIs, SQL, generated models, workers, and the TapCanvas canvas source are added only by their later frozen Tasklist stages.

## Development

Run repository-level plugin checks and builds from the product root. The plugin reuses the host React singleton and imports host context only from `@linapro/plugin-ui`.
