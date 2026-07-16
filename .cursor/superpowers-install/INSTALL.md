# Installing Superpowers for Cursor

> Note: Upstream no longer ships `.cursor/INSTALL.md`. Cursor install is via the
> plugin marketplace (or a local plugin copy). This file mirrors the current
> official instructions from https://github.com/obra/superpowers and
> https://cursor.com/docs/plugins.

## Prerequisites

- Cursor IDE installed and running (recent version with Agent plugins support)
- Internet connection (for marketplace install) **or** git (for local install)

## Option A — Marketplace (recommended)

In Cursor Agent chat, run:

```text
/add-plugin superpowers
```

Or search for **superpowers** in the plugin marketplace (Customize → Plugins).

Then start a **new** Agent session and verify:

```text
Do you have superpowers?
```

The agent should confirm and describe available skills (brainstorming, TDD,
debugging, subagent-driven development, etc.).

Update later with:

```text
/plugin-update superpowers
```

## Option B — Local plugin (agent / offline friendly)

Copy the repo into Cursor's local plugins directory (must be a real folder under
`~/.cursor/plugins/local/`, not a symlink to an external path):

```bash
git clone --depth 1 https://github.com/obra/superpowers.git \
  ~/.cursor/plugins/local/superpowers
```

Required layout:

```text
~/.cursor/plugins/local/superpowers/
  .cursor-plugin/plugin.json
  skills/
  hooks/hooks-cursor.json
```

Then reload Cursor: **Cmd+Shift+P → Developer: Reload Window** (or fully quit
with Cmd+Q and reopen).

Verify in a new Agent session:

```text
Do you have superpowers?
```

## What gets installed

- Skills library (brainstorming, writing-plans, TDD, systematic-debugging,
  subagent-driven-development, code review, worktrees, verification, …)
- Session-start hook that bootstraps `using-superpowers`
- Cursor plugin manifest at `.cursor-plugin/plugin.json`

## Uninstall

Marketplace:

```text
/plugin-remove superpowers
```

Local:

```bash
rm -rf ~/.cursor/plugins/local/superpowers
```

Then reload the window.

## Troubleshooting

- Skills not loading → new Agent session; Reload Window; confirm
  `~/.cursor/plugins/local/superpowers/.cursor-plugin/plugin.json` exists
- Enterprise teams → admin may need **Allow Local Plugin Imports** enabled
- Prefer marketplace install when available; local copy is the fallback used by
  setup scripts / agents that cannot run `/add-plugin`
