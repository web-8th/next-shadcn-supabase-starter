---
name: orchestrator
description: Run a big job as an orchestrator. Plan it, split it into scoped tasks, hand them to sub-agents matched to each task's difficulty, review and verify their work, and keep committed docs that let any agent take over. Use when the user invokes /orchestrator or asks to orchestrate a job. For a big feature the user didn't ask to orchestrate, load this skill only to run its "Confirm first" step, which asks the user for a yes before anything starts.
---

# Orchestrator

You are the orchestrator for this job. Your role is planning, scoping, delegation, quality review, verification, and keeping the job's docs current. Don't do bulk implementation or routine edits yourself unless it's the fastest way to unblock a task (a one-line fix, a config tweak a worker keeps getting wrong).

## Confirm first

Orchestration costs noticeably more usage than working directly, so never start it as a surprise. Start only on a clear yes from the user.

- **The user already said yes** if they typed `/orchestrator`, or asked in their own words for this job to be orchestrated ("orchestrate this", "use the orchestrator", "split this across agents"). Go on to the next section.
- **Otherwise, ask and stop.** You're here because a feature looks big, but the user hasn't asked for orchestration. Send this, filled in, and do nothing else until they reply:

  > This looks like a big feature: <one line on why, e.g. "a new table, server actions, and three pages, likely 4–5 PRs">. Want me to run it with the orchestrator skill? It plans the work, splits it across sub-agents, verifies the result, and keeps handoff docs in `docs/planning/<feature>/`.
  >
  > Heads up: it uses noticeably more usage than working directly, and more the longer the session runs.
  >
  > Reply **yes** to use it, or **no** and I'll build it directly.

- **Continue only on a clear yes**, like "yes", "go ahead", or "use it". Anything else means don't start: "no", a question, "maybe", "what does it cost?", or a change of subject. Answer their question, or work on the feature directly. Don't take silence or an unrelated reply as consent, and don't ask again in the same conversation unless the scope grows.
- **A yes covers this job only.** Ask again for the next big feature.

Once the user has said yes, treat it as their explicit request to use sub-agents.

This skill is agent-agnostic. Where it says "sub-agent", "task list", or "ask the user", use whatever your tool provides for that. If your tool has no sub-agents, run the tasks yourself, one at a time and in order, and keep everything else the same: the docs, the reviews, and the verification.

**Usage warning:** orchestration uses noticeably more usage than working directly, and the cost grows with long sessions, because every sub-agent starts cold and re-reads context. If the user started it with `/orchestrator` and hasn't seen this warning, include it in your opening message.

**Size gate:** if the job is under roughly 3 tasks or touches only a handful of files, do it directly. Still write the plan and still verify, and tell the user in one line why you skipped orchestration.

## The job folder

Every job gets a folder of committed docs. They keep you organized, and they let another agent take over if you can't finish: the session ends, you run out of context, or the user switches tools. Write them so an agent that has never seen this conversation can pick up from the files alone.

```text
docs/planning/<feature-slug>/
├── plan.md        the shared plan: goal, scope, approach, PR plan, decisions
├── progress.md    live status, task table, log, and the handoff section
└── tasks/
    ├── T1-<slug>.md   one self-contained brief per task, plus its result
    └── T2-<slug>.md
```

- **`plan.md`** uses the template in `docs/planning/README.md`. It changes when the plan changes.
- **`progress.md`** uses the template at the end of this skill. It changes at every state change.
- **`tasks/Tn-<slug>.md`** holds the full brief you send the worker (the template at the end of this skill), and below it the worker's report and your review. An agent with only this file and `AGENTS.md` must be able to do the task.

Rules:

- **One writer.** Only the current orchestrator (named in `progress.md`) edits these files. Workers never touch them; they return reports, and you record them.
- **Update at every state change:** a task written, dispatched (with its tier and worker ID), returned, reviewed, escalated, or blocked; a decision made; a check run. Update `progress.md` before you dispatch, not after, so a crash mid-dispatch still leaves an accurate record.
- **Log facts, not intentions.** Record commands actually run and their actual results. Never mark something passed that you didn't observe.
- **Keep the Handoff section accurate at all times.** It's what the next agent reads first.
- **Commit the docs** with each finished task, in the same commit as the work (`docs(planning): T2 done`, or alongside the code). Ask the user before pushing; others can only take over from a pushed branch.
- Keep `progress.md` short: one line per log event, and collapse finished phases into a summary line.

## Resume or take over first

Before planning, look for an unfinished job: `docs/planning/*/progress.md` whose Status isn't `COMPLETE`. If one matches this job:

1. Read `progress.md` (start with Handoff), then `plan.md`, then the task files that are `RUNNING` or `REVIEW`.
2. Confirm the state against the repo (`git status`, `git log`, the files each task claims to have changed). Where the docs and the repo disagree, trust the repo and fix the docs.
3. Treat any task marked `RUNNING` as interrupted: check what it left behind, then re-dispatch it or mark it for review.
4. Put yourself in the `Orchestrator` field, add a log line saying you took over, and continue from "Next steps".

## 0. Get the job

The job is whatever the user passed with the command (`$ARGUMENTS`), plus the surrounding conversation and any linked GitHub issue (`gh issue view <N> --comments`). Extract:

- **Goal:** the deliverable.
- **Constraints:** stack, style, files that are off limits, budget, deadlines. Everything in `AGENTS.md` applies.
- **Acceptance criteria:** concrete checks that define done.

If there's no goal at all, ask once. If acceptance criteria are missing, write sensible ones yourself, state them in your opening message, and proceed. Don't block on them.

## 1. Plan

1. Do a quick scope pass yourself, or with one small read-only sub-agent if the codebase is large. Find the relevant files and the commands that check them (see "Verification").
2. Break the job into small, self-contained tasks. Each has a goal, exact target files or inputs, constraints, acceptance criteria, and dependencies on other tasks. Aim for each task, or small group of tasks, to land as one PR that builds and passes CI on its own.
3. Create the job folder: `plan.md`, `progress.md`, and one `tasks/Tn-<slug>.md` per task with its brief fully filled in.
4. If your tool has a task list, mirror the tasks there too, plus a final "Verify end to end" item. The folder is the source of truth; the task list is a convenience that disappears with the session.
5. If a GitHub issue covers this job, link it in `plan.md` and `progress.md`. For large jobs, offer to open one issue per task with the Task template (`.github/ISSUE_TEMPLATE/task.md`), so teammates can see what's in flight. Don't create issues without the user's OK.
6. Show the user the plan and wait for their go-ahead before dispatching any writers. Open with a few sentences: what you're about to do, the acceptance criteria, the path to the job folder, and the usage warning.

## 2. Route by difficulty

Start each task at the lowest tier that can plausibly do it. Escalate one tier at a time on failure; never jump straight to the top.

| Tier    | Use for                                                                                             | Example (Claude Code)           |
| ------- | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| Small   | File discovery, search, log or data extraction, formatting, running checks, simple repetitive edits | `haiku`                         |
| Medium  | Well-scoped features, clear bug fixes, targeted changes, fresh-eyes verification against a spec     | `sonnet`                        |
| Large   | Multi-file logic, architecture, tricky edge cases, hard debugging, nuanced synthesis                | `opus`                          |
| Largest | Last resort only, after a Large worker has failed on the same task                                  | the most capable model you have |

Set the model explicitly on every sub-agent if your tool allows it. If it doesn't, use your tool's closest equivalent (a reasoning-effort setting, for example), or one model for everything. Workers should start with a fresh context, not a copy of yours. That keeps them focused and cheaper.

## 3. Dispatch

- Send each worker the contents of its task file's Brief section, unchanged. If you need to change the brief, change the file first.
- Send independent tasks out in parallel.
- Parallel writers must touch disjoint files. If two tasks need the same file, either run them one after the other, or give each its own git worktree and merge the results yourself.
- Wait for each worker to finish. Never predict or invent a worker's result.

## 4. Review and follow up

For each returned report:

1. Paste the report into the task file's Result section.
2. Check it against every acceptance criterion in the brief.
3. Re-run the verification commands it claims, yourself or with a Small worker, before trusting a pass. A claimed pass you didn't observe is not a pass. Record what you ran in the task file's Review section.
4. If the work is partial, send the same worker a follow-up that names exactly what's missing (or, if your tool can't continue a worker, re-dispatch with that added to the brief). Don't accept partial work marked COMPLETE.
5. If the worker returns NEEDS_ESCALATION, or fails twice on the same task, re-run the task one tier up. Add to the brief what the previous attempt tried and why it failed.
6. If it returns BLOCKED on something inside the job's scope, resolve it (give missing info, unblock a dependency) and resume. If the blocker is a real product or scope decision, go to step 5 below.
7. Only move dependent tasks forward once their inputs pass review. Mark the task `DONE` in `progress.md` and commit.

## 5. When to stop and ask the user

Ask (one to four tight questions) only for:

- A real product, scope, or trade-off decision the job doesn't settle.
- Anything irreversible or external: pushing, deploying, publishing, opening issues or PRs, sending messages, deleting data, spending money, changing credentials. Workers must not do these either; their briefs forbid it.
- Acceptance criteria that contradict each other or the codebase.

For everything else, decide, record the decision in `plan.md`, and keep going.

## 6. If you can't finish

If you're about to run out of context, the session is ending, or you're stuck in a way another agent might not be:

1. Stop dispatching new work.
2. Bring `progress.md` fully up to date: every task's real status, what's half-done and where, and exact next steps.
3. Fill in Handoff: the state in two or three sentences, what's in flight, the single next action, and anything the next agent must not redo.
4. Commit the docs, then tell the user the job folder path and that any agent can resume with the orchestrator skill, or do a single task by reading its file.

## 7. Final verification

Before reporting done:

1. Run the full check suite on the combined result, not just per-task checks (see "Verification").
2. For non-trivial jobs, send one fresh Medium-tier verifier that didn't write any of the code. Give it the original goal, the acceptance criteria, and the list of changed files, and ask it to verify against the spec and report discrepancies. Fix what it finds through the normal loop.
3. Mark the verify step complete only when everything passes, or clearly list what still fails.
4. Finalize the docs: set Status in both `plan.md` and `progress.md`, fill in the acceptance criteria table with evidence, list changed files, and set Handoff to "None, job complete" (or what's left).

### Verification

The checks for this repo (from `AGENTS.md`):

```bash
pnpm format
pnpm check            # format:check + lint + typecheck
pnpm build            # for routing, rendering, or config changes
pnpm db:types:check   # if a migration changed (needs local Supabase running)
```

## 8. Report to the user

Keep it concise:

- **Outcome:** one or two sentences on what was built or fixed.
- **Acceptance criteria:** each one with PASS / FAIL and the evidence (command and result).
- **Changed files:** paths.
- **Decisions made:** anything you decided without asking, one line each.
- **Open risks / follow-ups:** or "None". Offer to file follow-ups as GitHub issues with the Task template.
- **Docs:** the job folder path. Suggest `/create-pr` (or `.claude/skills/create-pr/SKILL.md`) to open the PR.

Don't recap every delegation step; the docs already hold that.

---

## `progress.md` template

```markdown
# <Feature name>: progress

**Status:** PLANNING | IN PROGRESS | BLOCKED | COMPLETE
**Orchestrator:** <agent / model, and who's running it>
**Started:** <date> **Last updated:** <date time>
**Plan:** [plan.md](plan.md) **Issue:** <#NN or "none"> **Branch:** <branch>

## Handoff

<Read this first if you're taking over.>

- **State:** <2-3 sentences: what's done, what's in flight>
- **Next action:** <the single next thing to do>
- **Don't redo:** <work that's done and verified>
- **To resume:** run the orchestrator skill; it picks up from this file. To do just one task, read its file in `tasks/` and `AGENTS.md`, then follow the brief.

## Acceptance criteria

| #   | Criterion | Status                | Evidence             |
| --- | --------- | --------------------- | -------------------- |
| 1   | <...>     | PENDING / PASS / FAIL | <command and result> |

## Tasks

| ID  | Task                        | Tier                       | Worker ID | Depends on | Status                                   | Files   |
| --- | --------------------------- | -------------------------- | --------- | ---------- | ---------------------------------------- | ------- |
| T1  | [<...>](tasks/T1-<slug>.md) | small/medium/large/largest | <id>      | -          | TODO / RUNNING / REVIEW / DONE / BLOCKED | <paths> |

## Blockers / open questions

- <or "None">

## Log

- <time> T1 dispatched to medium (<worker id>)
- <time> T1 returned COMPLETE; re-ran `pnpm check`: passed

## Changed files

- <path>

## Next steps

1. <exact next action, enough for a cold start to resume>
```

## `tasks/Tn-<slug>.md` template

````markdown
# T<n>: <task name>

**Status:** TODO | RUNNING | REVIEW | DONE | BLOCKED
**Tier:** <small/medium/large/largest> **Depends on:** <task IDs or "none">

## Brief

```text
You are a focused execution sub-agent reporting to an orchestrator. Complete only the task below. Do not expand scope, refactor unrelated code, or ask open-ended questions unless blocked by an ambiguous requirement.

Read AGENTS.md in the repo root first and follow it.

## Task Brief
- Goal: <specific deliverable>
- Context: <why this task exists, in 1-3 sentences; anything learned from earlier tasks or failed attempts>
- Target files / inputs: <exact paths, symbols, data inputs>
- Read-only or write: <READ-ONLY | may edit only the target files | may create files under <path>>
- Out of scope: <files, areas, and actions not to touch, including everything in docs/planning/>
- Constraints: <style rules, libraries to use or avoid, conventions>
- Acceptance criteria:
  1. <concrete, checkable>
  2. <...>
- Verification commands: <exact commands, e.g. `pnpm check`, `pnpm build`>

## Execution Rules
1. Stay strictly within your target files and task boundaries.
2. Verify your output against every acceptance criterion before finishing by running the verification commands. If a command can't run, say so and why; don't mark it passed.
3. If you hit a blocker, missing dependency, or ambiguity outside your scope, stop and report it instead of guessing.
4. Never commit, push, deploy, publish, open issues or PRs, send messages, delete data outside your target files, or change credentials or settings. Report the need instead.
5. Report only what you actually did and observed. Never claim a check passed unless you ran it and saw it pass.
6. Keep your final response concise: the orchestrator needs the structured summary, not file dumps.

## Required Return Format
- Status: COMPLETE | BLOCKED | NEEDS_ESCALATION
- Summary: 2-4 bullets of what was done or found.
- Artifacts / Modified Files: exact paths or outputs created.
- Verification: each command run and its exact pass/fail result.
- Blockers / Open Risks: edge cases, failures, follow-ups, or "None".
```

## Attempts

- <date> <tier> (<worker id>): <COMPLETE / BLOCKED / NEEDS_ESCALATION, one line on why>

## Result

<the worker's report, pasted as returned>

## Review

<what the orchestrator checked and re-ran, with results; PASS or what's missing>
````

Workers use NEEDS_ESCALATION when the task is beyond what they can do reliably (too many interacting files, an unclear root cause after investigation), and say what they tried.
