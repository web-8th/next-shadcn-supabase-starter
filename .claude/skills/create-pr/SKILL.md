---
name: create-pr
description: Open a pull request from the current branch using the repo's branch names, Conventional Commit titles, PR template, and linked issue. Use when the user invokes /create-pr or asks to create, open, or make a PR. When finished work looks ready for a PR but the user hasn't asked, load this skill only to run its "Confirm first" step, which asks the user for a yes.
---

# Create PR

Extra context (issue number, base branch, notes): $ARGUMENTS

This skill is agent-agnostic: it only needs `git` and the GitHub CLI (`gh`).

## Confirm first

Opening a PR pushes the branch and is visible to the whole team, so never do it as a surprise.

- **The user already said yes** if they typed `/create-pr`, or asked in their own words to open a PR ("open a PR", "make a PR for this"). Go on.
- **Otherwise, ask and stop.** Send this, filled in, and do nothing else until they reply:

  > This looks ready for a PR. Want me to open one? I'll run the checks, push `<branch>`, and open it against `<base>` titled "<title>".
  >
  > Reply **yes** to open it, or **no** to leave it local.

- **Continue only on a clear yes**, like "yes", "go ahead", or "open it". Anything else, including a question or a change of subject, means don't push or open anything.

## 1. Get the branch ready

- If you're on `main`, create a branch first, prefixed `feature/`, `fix/`, or `chore/` (see `AGENTS.md`). Include the issue number when there is one: `feature/12-todo-list`.
- Commit only what belongs in this PR. Leave unrelated changes out, and ask the user what to do with them if any are mixed in.
- Commit messages follow Conventional Commits: `type(optional-scope): summary`, lowercase and imperative, no trailing period.
- Don't add AI-tool attribution to commits, the PR body, or comments. That means no "Generated with …" footers, no AI co-author trailers, and no session links.

## 2. Run the checks

```bash
pnpm format
pnpm check            # format:check + lint + typecheck
pnpm build            # if routing, rendering, or config changed
pnpm db:types:check   # if a migration changed (needs local Supabase running)
```

Fix failures before opening the PR. If something fails and you can't fix it, stop and tell the user with the error. Don't open a PR with known failures unless they say to, and then say so in the body.

## 3. Find the issue

- If the user gave an issue number, use it. Otherwise search: `gh issue list --search "<keywords>" --state open`.
- If one clearly fits, link it. If nothing fits and the change is more than a small fix, offer to open one with the Task template (`.github/ISSUE_TEMPLATE/task.md`). Don't create it without the user's OK. If they say no issue is needed, skip it.

If the feature has a plan in `docs/planning/<feature>/plan.md`, tick off the step this PR completes, add the PR number once it exists, and commit that with the PR.

## 4. Pick the base

- Normally `main`.
- If this PR builds on another open PR that hasn't merged, base it on that PR's branch (`--base <parent-branch>`), and put `Depends on #NN` at the top of the body.

## 5. Check the size

Run `git diff --shortstat <base>...HEAD` and `git diff --stat <base>...HEAD`.

If it's a large change (roughly 500+ changed lines outside lockfiles and generated files), or it mixes unrelated changes, tell the user before opening and propose how to split it. Small PRs merge faster and conflict less, which matters with several people and agents working at once.

## 6. Title

Same format as commits: `type(optional-scope): summary`.

- `type`: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, or `ci`.
- `scope`: optional, e.g. `auth`, `db`, `ui`.
- Summary: imperative, lowercase start, no trailing period.

Examples: `feat: add todo list page`, `fix(auth): redirect after logout`, `chore(deps): bump supabase-js`.

## 7. Body

Fill in `.github/pull_request_template.md` and keep it short. A teammate should take it in at a glance.

- First line: `Closes #NN` if there's an issue.
- **Summary:** 2–4 bullets on what changed. No file-by-file list.
- **Why:** 1–2 bullets.
- **Screenshots:** for UI changes, leave a placeholder for the user to fill in and remind them. Otherwise delete the section, as the template says.

## 8. Open it

```bash
git push -u origin <branch>
gh pr create --base <base> --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

Reply with the PR link, the base branch, and the size (files / lines). Mention anything left for the user, like screenshots or a missing issue.
