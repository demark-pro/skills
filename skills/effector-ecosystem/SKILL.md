---
name: effector-ecosystem
description: "Use when designing, reviewing, generating, or refactoring React frontend applications built with Feature-Sliced Design, effector, effector-react, Farfetched, contracts, patronum, atomic-router, effector-storage, forms, i18n, testing, Next.js SSR/hydration, and related tooling. Explains where code belongs, which packages to use, and which Effector/FSD anti-patterns to avoid."
license: MIT
---

# Effector Ecosystem Skill

## Purpose

Use this skill for frontend applications that use or plan to use:

- React or React-compatible UI
- Effector for business logic and state
- `effector-react` for binding units to components
- Feature-Sliced Design for project structure
- Farfetched for remote operations
- `@withease/contracts` or compatible contracts for runtime validation
- Supporting packages from the Effector ecosystem: `patronum`, `atomic-router`, `effector-storage`, `effector-action`, `effector-forms`, `@withease/factories`, `@withease/i18next`, `@withease/web-api`, `@effector/next`, `@effector/reflect`, `@withease/redux`, `eslint-plugin-effector`, Steiger, Effector Babel/SWC plugins

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
- Creating templates for slices, models, API, forms, routing, persistence, or tests
- Next.js App Router, Pages Router, SSR, hydration, or `@effector/next` integration

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
- call events, effects, query/mutation starters, or route actions already prepared in models
- pass props to dumb components
- bind Effector units through `useUnit`

React components must not:

- contain business decisions
- call API directly
- branch over domain workflow rules
- call `sample`, `createEvent`, `createStore`, `createEffect`, or factories during render
- read stores through `$store.getState()`
- use `watch` for application behavior
- pass raw events/effects to DOM handlers or ordinary callback props when Scope/SSR may be used

### 2. Prefer one `useUnit` shape per connected component

For every component that reads/calls several Effector units from the same model, prefer a single `useUnit` call with an object or array shape:

```tsx
const { value, submitDisabled, onValueChange, onSubmit } = useUnit($$form);
```

or:

```tsx
const [value, submitDisabled, onValueChange, onSubmit] = useUnit([
  $value,
  $submitDisabled,
  valueChanged,
  submitted,
]);
```

Then destructure every returned value and pass the bound callbacks to JSX. Name handler-like values returned from `useUnit` with React-style `on*` aliases: expose `onSubmit: submitted`, `onValueChange: valueChanged`, `onRetryClick: retryClicked`. Keep Effector events named as facts in models; alias them only for React binding.

Avoid repeated bindings in the same component:

```tsx
// bad by default: noisy and easier to desync during refactoring
const value = useUnit($value);
const submitDisabled = useUnit($submitDisabled);
const onValueChange = useUnit(valueChangedEvent);
```

Split the component when subscription granularity matters instead of scattering many `useUnit` calls in one component.

### 3. Effector models must be static and declarative

Create units at module level only.

Use:

- `createEvent` for facts that happened
- `createStore` for state
- `createEffect` only for side effects not already handled by Farfetched
- `attach` to inject stores/params into an effect declaratively
- `sample` as the main connection operator
- `combine` for view models
- `split` or `effector-action` for complex branching when it improves readability
- named pure functions for non-trivial data transformation used by `combine`, `sample.fn`, or store `.map`
- `patronum` for common operators like debounce, throttle, reset, status, pending helpers
- factories for repeated same-shaped model logic that needs independent instances
- `scopeBind` for callbacks that leave Effector's call stack and must still work inside a Scope

Avoid:

- imperative chains inside effects
- nested event calls inside effects
- `watch` for logic
- `$store.getState()` for production logic
- creating models from React components
- using derived stores as mutation targets
- long inline mapping, sorting, grouping, normalization, or formatting inside `combine`, `sample.fn`, or store `.map`
- returning `undefined` from store reducers unless `skipVoid: false` is intentional
- oversized models that own several unrelated workflows at once
- huge object stores when several atomic stores are clearer

Prefer concern-based submodels over large all-in-one models. When a model grows into several workflows, split it into submodels such as `$$form`, `$$filters`, `$$list`, `$$selection`, or `$$dialog`; keep each submodel responsible for its own state and local rules. The top-level model should stay thin and orchestrate interactions between submodels with `sample` and other declarative connections.

Keep Effector models declarative by extracting non-trivial data transformation to named pure functions. Small boolean checks or simple field joins can stay inline; complex mapping, sorting, grouping, DTO normalization, permission-derived view models, or formatting should live in `lib`, API mapping files, entity/feature helpers, or a presentation boundary. The model should connect stores/events and call these functions, not hide algorithms inside reactive operators.

Prefer factories over copy-pasted Effector model code for repeated forms, filters, widgets, or other independent instances with the same behavior. In SSR/Scope/SID-sensitive apps, use [`@withease/factories`](https://withease.effector.dev/factories/) and configure the Effector Babel/SWC plugin `factories` field; invoke factories at module top level, never during render.

### 4. Farfetched owns remote operations

Use Farfetched for backend communication:

- `createJsonQuery` for data reads
- `createJsonMutation` for data writes
- `declareParams<T>()` for typed params
- `response.contract` for runtime validation
- `mapData` to map DTOs after validation
- `mapError` to normalize transport/validation/domain errors
- `concurrency` operator for search, filters, submits, route changes, and cancellation
- `createBarrier` + `applyBarrier` for auth refresh or unavailable-resource flows
- `keepFresh`, `cache`, `.refresh`, and `update` for refresh/cache semantics when appropriate
- `request.fetch.credentials` for cookie/session APIs in current Farfetched code
- `@farfetched/atomic-router` for query-driven route loading when Atomic Router is used

Never trust backend data without a contract.

### 5. Application startup must be explicit and scoped

Prefer one application event such as `appStarted` and one page/route event such as `pageStarted` over several free-floating startup functions.

Default pattern:

```ts
const scope = fork();
await allSettled(appStarted, { scope, params: startParams });
```

Connect storage pickup, i18n, router start, initial queries, and browser integrations from that event with `sample` or effects. Avoid sequences like this by default:

```ts
await startAppClock(scope);
await allSettled(appStarted, { scope });
await startRouter(scope);
```

That sequence is allowed only when `startAppClock`/`startRouter` are explicitly documented external adapter installation steps. Even then, business decisions should still be triggered from `appStarted`, route events, or scope-bound callbacks.

Use `allSettled(scope)` only when you intentionally need to wait for already-started async work that was triggered outside the direct `allSettled(event, { scope })` call, for example by a `scopeBind` callback from a timer, SDK, history listener, or WebSocket.

### 6. FSD boundaries must be explicit

Use layers:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

Imports must point only downward by layer.

Each slice must expose public API through `index.ts`.

External code must import from slice public API, not internal files.

Inside a slice, use relative imports. Between slices, use absolute imports.

### 7. Packages are chosen by purpose

Do not add packages because they are popular. Choose them when they solve a specific architectural problem.

Use the package map in `references/01-package-map.md` and the detailed notes in `references/10-ecosystem-library-notes.md`.

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

`useUnit` UI binding shapes should expose these events as handler aliases:

```ts
export const $$form = {
  value: $value,
  onValueChange: valueChanged,
  onSubmit: formSubmitted,
};
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
export const update = createEvent();
export const fx = createEffect();
```

## Required references

Before giving a detailed answer, consult the relevant files:

- `references/00-source-policy.md`
- `references/01-package-map.md`
- `references/02-fsd-placement.md`
- `references/03-effector-modeling.md`
- `references/04-farfetched-contracts.md`
- `references/05-react-ui-binding.md`
- `references/06-routing-forms-persistence-i18n.md`
- `references/07-testing-tooling.md`
- `references/08-anti-patterns.md`
- `references/09-review-checklist.md`
- `references/10-ecosystem-library-notes.md`
- `references/11-nextjs.md`

## Default answer style

Be specific. Prefer concrete placement and code examples.

When correcting code, show the minimal correct version first, then explain.

When a choice is trade-off based, say what the default should be and when to deviate.
