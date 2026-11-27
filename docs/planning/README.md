# Planning docs

One folder per big feature, with the plan in `plan.md`:

```text
docs/planning/
└── team-invites/
    ├── plan.md        the plan (template below)
    ├── progress.md    added by the orchestrator skill: live status and handoff
    └── tasks/         added by the orchestrator skill: one brief per task
```

Write a plan before building a feature that's large or touches several areas at once: a new table plus server code plus UI, changes to auth, or anything that will take more than one PR. Small, single-area changes don't need one; the issue and PR are enough.

The docs are committed, so teammates and their agents can see the plan, how far it got, and what was decided. Keep the plan current as the work moves: tick off PRs, record decisions, and update open questions. When the feature ships, set its status to `Done` and leave the folder as a record.

When the orchestrator skill runs a job, it adds `progress.md` and `tasks/` and keeps them current. They're written so that any agent can take over: read the Handoff section of `progress.md` first, or do a single task from its file in `tasks/`. See `.claude/skills/orchestrator/SKILL.md` for their templates.

## `plan.md` template

```markdown
# <Feature name>

**Status:** Draft | In progress | Done
**Issue:** #NN
**Owner:** <name>
**Last updated:** <date>

## Goal

<1-3 sentences: what users get and why it matters.>

## Scope

- In: <...>
- Out: <...>

## Areas affected

- [ ] Database: <tables, migrations, RLS policies>
- [ ] Server: <Server Actions, Route Handlers, `utils/`>
- [ ] UI: <pages, components>
- [ ] Auth: <routes in `proxy.ts`, `config/auth.ts`>
- [ ] Config / env vars: <new variables, added to `.env.example`>

## Approach

<How it works: data flow, key decisions, which existing components and helpers to reuse.>

## Data model

<New or changed tables, columns, and RLS policies. Link the migration file once it exists.>

## Plan

Each step should be one PR that builds and passes CI on its own.

1. [ ] <step> (#PR)
2. [ ] <step> (#PR)

## Decisions

- <date>: <decision and why>

## Open questions

- <question, or "None">

## Done when

- [ ] <checkable outcome>
```
