# Effector Skills

[![skills.sh](https://skills.sh/b/demark-pro/skills)](https://skills.sh/demark-pro/skills)

Reusable agent skills for designing, reviewing, refactoring, and generating frontend code with the Effector ecosystem.

## Skills

- `effector-ecosystem`: Effector, `effector-react`, Farfetched, Atomic Router, `@effector/next`, Scope, SSR/hydration, persistence, forms, i18n, testing, and ecosystem package guidance.
- `effector-fsd`: Feature-Sliced Design structure for Effector projects: layers, slices, segments, public APIs, imports, placement, Next.js adapters, Farfetched placement, and Steiger checks.

Core principle:

> UI is dumb. Business logic is declarative. Remote data is validated. Structure follows ownership and dependency direction.

## Install

Install both skills with the `skills` CLI:

```bash
npx skills add demark-pro/skills --agent codex -g
```

Install one skill explicitly:

```bash
npx skills add demark-pro/skills --skill effector-ecosystem -a codex -g
npx skills add demark-pro/skills --skill effector-fsd -a codex -g
```

To preview available skills in this repository:

```bash
npx skills add demark-pro/skills --list
```

## Use

Invoke skills explicitly:

```text
Use $effector-ecosystem to review this Farfetched mutation and scope handling.
Use $effector-fsd to decide where this route model and protected auth flow belong.
```

Or ask for work that matches a skill description, such as:

- Designing Effector/Farfetched/Atomic Router models
- Reviewing Scope, SSR, `useUnit`, or Farfetched anti-patterns
- Creating queries, mutations, barriers, route models, forms, or tests
- Designing an Effector + FSD project structure with correct placement
- Deciding where pages, widgets, features, entities, API code, forms, contracts, routes, and adapters belong
- Refactoring legacy `src/api`, `src/store`, `src/components`, and `src/utils` into FSD

## Repository Layout

```txt
skills/
  effector-ecosystem/
    SKILL.md
    agents/openai.yaml
    references/
    templates/
    examples/
  effector-fsd/
    SKILL.md
    agents/openai.yaml
    references/
    templates/
    examples/
skills.sh.json
```

## Skill Files

- [`skills/effector-ecosystem/SKILL.md`](skills/effector-ecosystem/SKILL.md)
- [`skills/effector-fsd/SKILL.md`](skills/effector-fsd/SKILL.md)
