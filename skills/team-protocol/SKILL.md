---
name: team-protocol
description: Three-identity (manager / dev / reviewer) collaboration protocol orchestrating a multi-step dev pipeline (dispatch -> code -> open PR -> review -> merge). Use when orchestrating multi-step dev work (implement -> PR -> review -> merge), dispatching parallel subagents/workers, or any multi-agent coordination. On receiving a prompt, first Read this SKILL.md to determine your identity, then Read the matching references file. Generic, not bound to any specific repo/branch/isolation mechanism.
---

# team-protocol

When a complex task is too much for one agent, blindly dispatching subagents creates three classes of problem:

1. subagents do the same thing the manager does (roles not separated)
2. subagents conflict with each other (no protocol)
3. the manager steps onto the field itself and burns its own context (role collapse)

team-protocol defines a separate set of rules for each of these three problems, slicing the work into **manager / dev / reviewer** identities.

## Identity assignment

The first thing to do on receiving a prompt: judge which identity you are, then Read the matching file.

- **main session** (the Claude talking to the user) = **manager** -> Read `references/manager.md`
- dispatched by the manager to **write code / open a PR** = **dev** -> Read `references/dev.md`
- dispatched by the manager to **review a PR / merge a PR** = **reviewer** -> Read `references/reviewer.md`

Can't tell -> default to manager.

## Boundary (what this skill governs / does not govern)

**Governs:** high-level workflow orchestration — who is which identity, when to dispatch, to whom, what to judge before dispatching, what to judge after receiving work back, how to guard the quality gate.

**Does not govern:** concrete execution mechanics.
- **Isolation (worktree / branch switching):** handled by other hooks/tools in the environment. This skill only says "dev's work runs in an isolated environment"; it does not write commands like `git worktree add`.
- **Project-specific commands** (install / build / test / how to open a PR): supplied by the manager for the current project, or read by the dev from the project's docs (CLAUDE.md / README / .github/workflows). This skill never hard-codes any install command, Node version, branch name, repo name, or CI config.

Wherever this document says "per this project's X", it means the manager / dev decides on the spot against the concrete project; the skill does not decide for the project.

## Shared iron-law (all three identities obey)

**Never skip tests** — full text in `references/consensus.md`. In one line: a broken test has only two paths — fix it to green (a), or delete it in the same PR and state why in the body (b); the third path is strictly forbidden (`.skip` / `xit` / `it.todo` / `@pytest.mark.skip` / ignore lists / commenting out `it()` blocks, or any "temporarily skip").

dev self-checks; reviewer REQUEST_CHANGES on sight when a PR diff introduces these patterns (non-negotiable); manager bounces them on sight. All three identities link back to this rule in their own reference.
