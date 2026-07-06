# Ecosystem library notes

This file summarizes the practical rules for each common Effector ecosystem library.

## Contents

- Effector
- effector-react
- @effector/next
- @effector/reflect
- Farfetched
- @withease/contracts
- patronum
- effector-action
- @withease/factories
- atomic-router
- effector-storage
- effector-forms
- i18next / @withease/i18next
- @withease/web-api
- @withease/redux
- eslint-plugin-effector
- Steiger
- Effector Babel/SWC plugin

## Effector

Use Effector for static, declarative business models. Default to `sample`, atomic stores, derived view models, and tests with `fork`/`allSettled`.

Avoid `watch` for behavior, `getState` for production logic, units in render, and imperative event calls inside effects.

## effector-react

Use `useUnit` as the default React binding.

Default connected-component pattern:

```tsx
const { value, pending, onChange, onSubmit } = useUnit($$model);
```

The model should expose an object shape suitable for UI binding:

```ts
export const $$model = {
  value: $value,
  pending: mutation.$pending,
  onChange: changed,
  onSubmit: submitted,
};
```

Use arrays for small local bindings, object shapes for public model APIs. In both cases, name bound handlers with `on*` aliases in React-facing code.

## @effector/next

Use for Next.js SSR/hydration with Effector Scope. Enable Effector plugin for SIDs and bind all component event/effect handlers through `useUnit`.

## @effector/reflect

Use when the team intentionally wants declarative mapping from stores to presentational components. Do not use it as a universal replacement for simple `useUnit` connected components.

## Farfetched

Use `createJsonQuery`/`createJsonMutation` for JSON HTTP APIs.

Checklist:

- `declareParams<T>()` for params
- request object owns method/url/query/body/headers
- `response.contract` validates unknown data
- `mapData` maps DTO to domain shape
- `mapError` normalizes errors
- `concurrency(operation, { strategy })` is an operator
- `keepFresh`, `cache`, `.refresh`, `update`, barriers are used deliberately

## @withease/contracts

Use for small runtime validators and type inference through `UnContract`.

Use with:

- Farfetched `response.contract`
- effector-storage `contract`
- reusable domain DTO validation

## patronum

Use for common reactive utilities: debounce, throttle, reset, condition, pending/status, spread, reshape, combineEvents, interval.

Do not reimplement these with `watch` and timers unless there is a very specific reason.

## effector-action

Use for readable complex branching from one decision point. Avoid for simple flows where `sample` is clearer.

## @withease/factories

Use for repeated same-shaped Effector model code that needs independent model instances. Prefer it over copy-pasting repeated forms, filters, widgets, or similar models.

Rules:

- factory invocation at module top level
- one config object parameter by default
- plugin `factories` field configured for SSR/SIDs
- no factory calls in React render/hooks

## atomic-router

Use for typed routes, route lifecycle, guards, and route-driven data loading.

Patterns:

- `createRoute` for route units
- `chainRoute` for data/permission gating
- `RouterProvider`/framework integration at app level
- Farfetched integration for query-driven route loading

## effector-storage

Use for syncing stores with external storage. Persist only safe data. Add contracts for untrusted storage data. Use explicit `pickup` when Scope/SSR is used.

## effector-forms

Use when field-level form abstraction is worth it. For small forms, plain Effector stores/events are often clearer.

## i18next / @withease/i18next

Use `react-i18next` for UI-only translations. Use `@withease/i18next` when language participates in Effector models, queries, routing, or app lifecycle.

Do not store translated strings in domain stores.

## @withease/web-api

Use for browser signals as units/triggers: page visibility, network, media query, orientation, languages, geolocation. Use explicit setup/teardown and connect to Farfetched `keepFresh` when refetch on focus/reconnect is needed.

## @withease/redux

Use only for Redux migration/interoperability. Do not add Redux to new Effector-first projects.

## eslint-plugin-effector

Use recommended/react/scope/patronum presets as appropriate. Pay special attention to rules around `useUnit`, mandatory Scope binding, units in render, unsafe `getState`, unsafe `watch`, and persistence pickup.

## Steiger

Use for automated FSD structure and import checks. Treat exceptions as architecture decisions that must be documented.

## Effector Babel/SWC plugin

Use for SIDs, SSR, debugging, HMR, and factories. Configure local model factories; do not rely on luck for stable serialization.
