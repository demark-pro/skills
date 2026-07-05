# Effector Ecosystem Skill

[![skills.sh](https://skills.sh/b/demark-pro/skills)](https://skills.sh/demark-pro/skills)

Reusable agent skill for designing, reviewing, refactoring, and generating frontend code with the Effector ecosystem.

It covers React, Feature-Sliced Design, Effector, `effector-react`, Farfetched, contracts, Patronum, routing, forms, persistence, i18n, testing, and tooling. The skill is intentionally not admin-panel-specific: it works for product applications with auth flows, lists, detail screens, dashboards, settings, profiles, and other frontend workflows.

Core principle:

> UI is dumb. Business logic is declarative. Remote data is validated. Pages orchestrate. Features represent user actions. Entities represent domain objects. Shared code has no business knowledge.

## Install

Install with the `skills` CLI:

```bash
npx skills add demark-pro/skills --skill effector-ecosystem -a codex -g
```

For all supported agents:

```bash
npx skills add demark-pro/skills --skill effector-ecosystem --agent '*' -g
```

To preview available skills in this repository:

```bash
npx skills add demark-pro/skills --list
```

## Use

Invoke it explicitly:

```text
Use $effector-ecosystem to review this Effector/FSD feature and suggest a better structure.
```

Or ask for work that matches the skill description, such as:

- Designing an Effector + FSD project structure
- Reviewing Effector models for anti-patterns
- Creating Farfetched queries or mutations with contracts
- Deciding where pages, widgets, features, entities, API code, forms, and routes belong
- Refactoring React component logic into declarative Effector models

## Repository Layout

```txt
skills/
  effector-ecosystem/
    SKILL.md
    agents/openai.yaml
    references/
    templates/
    examples/
skills.sh.json
```

## Skill

The skill lives at [`skills/effector-ecosystem/SKILL.md`](skills/effector-ecosystem/SKILL.md).
