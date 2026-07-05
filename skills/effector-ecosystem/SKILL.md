---
name: effector-ecosystem
description: "Use when designing, reviewing, generating, or refactoring React frontend applications built with Feature-Sliced Design, effector, effector-react, Farfetched, contracts, patronum, atomic-router, effector-storage, forms, i18n, testing, and related tooling. Explains where code belongs, which packages to use, and which Effector/FSD anti-patterns to avoid."
---

# Effector Ecosystem Skill

## Purpose

Use this skill for frontend applications that use or plan to use:

- React or React-compatible UI
- Effector for business logic and state
- effector-react for binding units to components
- Feature-Sliced Design for project structure
- Farfetched for remote operations
- `@withease/contracts` or compatible contracts for response validation
- Supporting packages from the Effector ecosystem: `patronum`, `atomic-router`, `effector-storage`, `effector-action`, `@withease/factories`, `@withease/i18next`, `@withease/web-api`, `eslint-plugin-effector`, Steiger

This skill is **not specific to admin panels**. Admin tables and CRUD are examples, not the default assumption.

The target architecture:

> UI is dumb. Business logic is declarative. Remote data is validated. Pages orchestrate. Features represent user actions. Entities represent domain objects. Shared code has no business knowledge.

## Activation triggers

Use this skill when the user asks about:

- Project structure for Effector/FSD
- Where to place models, queries, mutations, contracts, forms, routes, widgets, or UI
- How to split code into `app`, `pages`, `widgets`, `features`, `entities`, `shared`
- Best practices or anti-patterns in Effector
- Farfetched query/mutation organization
- Contracts and API validation
- Choosing packages in the Effector ecosystem
- Refactoring from component-local logic into Effector models
- Reviewing code for architecture violations
- Creating templates for slices, models, API, forms, routing, or tests

## First response behavior

When answering, do not immediately generate a huge structure unless the user asks for it. First identify the goal:

1. Designing a new project
2. Refactoring an existing project
3. Reviewing a code fragment
4. Choosing packages
5. Creating a slice/model/query/form/route
6. Writing architecture rules for a team

If the user gives code, review the code against this skill and return:

- What is good
- What is wrong
- Why it is wrong
- Where the code should live
- A corrected version

## Non-negotiable principles

### 1. UI must stay dumb

React components must:

- render data
- call events or mutation/query starters
- pass props to dumb components

React components must not:

- contain business decisions
- call API directly
- branch over domain workflow rules
- call `sample`, `createEvent`, `createStore`, `createEffect`, or factories during render
- read stores through `$store.getState()`
- use `watch` for application behavior

### 2. Effector models must be static and declarative

Create units at module level only.

Use:

- `createEvent` for facts that happened
- `createStore` for state
- `createEffect` only for side effects not already handled by Farfetched
- `sample` as the main connection operator
- `combine` for view models
- `split` or `effector-action` for complex branching when it improves readability
- `patronum` for common operators like debounce, throttle, reset, status, pending helpers

Avoid:

- imperative chains inside effects
- nested event calls inside effects
- `watch` for logic
- `$store.getState()` for production logic
- creating models from React components
- huge object stores when several atomic stores are clearer

### 3. Farfetched owns remote operations

Use Farfetched for backend communication:

- `createJsonQuery` for data reads
- `createJsonMutation` for data writes
- `declareParams<T>()` for typed params
- `response.contract` for runtime validation
- `concurrency` for search, filters, and fast-changing requests
- `Barrier` for auth refresh or unavailable-resource flows
- `update` only when local cache update is safe and predictable

Never trust backend data without a contract.

### 4. FSD boundaries must be explicit

Use layers:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

Imports must point only downward by layer.

Each slice must expose public API through `index.ts`.

External code must import from slice public API, not internal files.

Inside a slice, use relative imports. Between slices, use absolute imports.

### 5. Packages are chosen by purpose

Do not add packages because they are popular. Choose them when they solve a specific architectural problem.

Use the package map in `references/01-package-map.md`.

## Default project shape

```txt
src/
  app/
    entrypoint/
    providers/
    routes/
    store/
    styles/

  pages/
    <page-name>/
      index.ts
      route.ts
      ui/
      model/
      api/        # only page-specific remote operations
      lib/

  widgets/
    <widget-name>/
      index.ts
      ui/
      model/
      lib/

  features/
    <user-action>/
      index.ts
      ui/
      model/
      api/
      lib/

  entities/
    <domain-entity>/
      index.ts
      @x/         # only for explicit entity cross-imports
      ui/
      model/
      api/
      lib/

  shared/
    api/
    config/
    routes/
    ui/
    lib/
    i18n/
    assets/
```

Do not create all segments automatically. Add a segment only when it has real content.

## Placement rules

Use this decision tree:

1. Is it application bootstrap, providers, router config, scope, global styles? Put it in `app`.
2. Is it a complete route/screen and page-specific orchestration? Put it in `pages/<page>`.
3. Is it a large reusable block assembled from entities/features? Put it in `widgets/<widget>`.
4. Is it a user action or business capability? Put it in `features/<action>`.
5. Is it a domain object, type, contract, basic entity API, or entity visual? Put it in `entities/<entity>`.
6. Is it domain-independent infrastructure, UI primitive, helper, config, route path, or adapter? Put it in `shared`.

## Naming rules

Stores:

```ts
export const $user = createStore<User | null>(null);
export const $isAuthorized = createStore(false);
```

Events:

```ts
export const formSubmitted = createEvent<FormValues>();
export const searchChanged = createEvent<string>();
export const pageOpened = createEvent();
```

Effects:

```ts
export const analyticsTrackedFx = createEffect<AnalyticsPayload, void>();
```

Queries/mutations:

```ts
export const userQuery = createJsonQuery(...);
export const updateProfileMutation = createJsonMutation(...);
```

Avoid vague names:

```ts
// bad
export const setData = createEvent<any>();
export const $state = createStore({});
export const doSomethingFx = createEffect();
```

## Output style for generated code

When generating code:

1. Show the target folder path first.
2. Keep UI and model separate.
3. Export only public API.
4. Add contracts for remote data.
5. Use `sample` instead of imperative glue.
6. Add notes for package choice only when needed.
7. Mention any assumptions.

## Required references

When a task involves a specific area, consult the matching reference file:

- Package choice: `references/01-package-map.md`
- FSD placement: `references/02-fsd-placement.md`
- Effector modeling: `references/03-effector-modeling.md`
- Farfetched/contracts: `references/04-farfetched-contracts.md`
- React binding: `references/05-react-ui-binding.md`
- Routing/forms/persistence/i18n: `references/06-routing-forms-persistence-i18n.md`
- Testing/tooling: `references/07-testing-tooling.md`
- Anti-patterns: `references/08-anti-patterns.md`
- Review checklist: `references/09-review-checklist.md`

## Final answer checklist

Before answering, check:

- Did I keep business logic out of UI?
- Did I keep imports downward by FSD layers?
- Did I avoid deep imports across slice boundaries?
- Did I choose packages by purpose?
- Did I validate remote data?
- Did I avoid `watch`, `getState`, runtime units, and imperative effects?
- Did I place orchestration at the right layer, usually page/model or app/model?
- Did I explain what is wrong and how to fix it?
