# team-protocol

A **multi-agent collaboration protocol** for Claude Code, packaged as an installable plugin skill.

It splits a single Claude session into three identities — **manager / dev / reviewer** — and orchestrates a multi-step development pipeline: dispatch work → write code → open PR → review → merge. The manager never does dev work itself; everything stays grounded in concrete tasks on the TaskList.

This is the **generic** version: it does not hard-code any repository, branch name, CI config, or isolation mechanism. Project-specific details (install commands, branch flow, how to open a PR) are decided by the manager/dev against the actual project, or read from the project's own docs.

## The three identities

| Identity | Who | Does | Never does |
|----------|-----|------|------------|
| **manager** | the main session talking to the user | judge necessity / scope / split, dispatch workers, keep global view, guard the quality gate | write product code, run builds/long tests, merge PRs |
| **dev** | a subagent dispatched to write code | implement the task, run lint/typecheck/build/tests locally, open a PR | merge its own PR, decide direction, arbitrate |
| **reviewer** | a subagent dispatched to review | judge whether a PR should merge, poll CI, squash-merge on green | write any file, fix dev's code, resolve conflicts |

When a prompt arrives, the first thing each identity does is read `SKILL.md` to determine which identity it is, then read the matching file under `references/`.

## Layout

```
.claude-plugin/
  plugin.json          plugin manifest
  marketplace.json     marketplace manifest (lets other machines install from GitHub)
skills/team-protocol/
  SKILL.md             entry point — decide identity, then read the matching reference
  references/
    consensus.md       shared iron-laws all three identities obey
    manager.md         coordinator protocol
    dev.md             engineer protocol
    reviewer.md        reviewer protocol
```

## Install

**On any machine (from GitHub):**

```
/plugin marketplace add Jiahui-Gu/team-protocol-plugin
/plugin install team-protocol
```

**Local testing (from a checkout):**

```
/plugin marketplace add /path/to/team-protocol-plugin
/plugin install team-protocol
```

After install, `team-protocol` appears in the skill list and triggers automatically when a task needs the multi-step dev pipeline or parallel subagent dispatch.

## /team — opt-in enforcement

The plugin ships with a hook + a `/team` slash command that can re-inject the team-protocol entry-point reminder into the model's context across session boundaries. The hook is **OFF by default** — installing the plugin alone changes nothing about your runtime; you have to opt in.

### Usage

- `/team` — show current status (global / session / effective)
- `/team on` — enable for the current session
- `/team on global` — enable for every session on this machine
- `/team off` — disable for the current session
- `/team off global` — disable globally

The toggle is stored as a flag file under `~/.claude/hooks/state/` (user-global, intentionally not plugin-scoped), so it survives plugin upgrade / reinstall.

### Mechanism

When ON, the hook fires at:

- **SessionStart** — every new Claude Code session
- **PostCompact** — right after the model's context window is compacted

It injects a short reminder pointing the model at this plugin's `SKILL.md`, so the team-protocol identity decision (manager / dev / reviewer) survives compaction. It does **not** fire on every user prompt, so the per-turn token cost is approximately zero after the initial injection.

### Why not UserPromptSubmit

A `UserPromptSubmit` hook (the previous local-only approach) achieves the same compact-survival property but re-injects the reminder on every user message — verbose and noisy. `SessionStart` + `PostCompact` is a leaner alternative for users who want the same guarantee at lower per-turn cost.

Trade-off: between two compactions the reminder ages out of the visible context window faster than per-prompt injection. In practice the `SKILL.md` and `references/` files remain reachable via the model's `Read` tool, so the protocol stays enforceable.

## Scope

- **In scope:** high-level workflow orchestration — who is which identity, when to dispatch, to whom, what to judge before dispatching and after receiving work back, how to guard the quality gate.
- **Out of scope:** concrete execution mechanics. Isolation (worktree / branch switching) is left to other hooks/tools in your environment. Project-specific commands (install / build / test / how to open a PR) are supplied by the manager for the current project, or read by the dev from the project's docs.

## Shared iron-law: never skip tests

A broken test has exactly two valid paths: fix it until green, or delete the file in the same PR with the reason stated in the PR body. Any form of "temporarily skip" (`.skip` / `xit` / `it.todo` / `@pytest.mark.skip` / ignore lists / commenting out `it()` blocks) is forbidden. See `references/consensus.md` for the full set of shared iron-laws.

## License

MIT.
