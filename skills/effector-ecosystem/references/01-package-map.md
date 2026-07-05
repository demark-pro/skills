# Package map: what to use and when

Use this file when the user asks which package to use for a problem.

## Core state and business logic

### `effector`

Use for:

- business state
- events and workflows
- derived state
- effects not covered by Farfetched
- application lifecycle
- testing through `fork` and `allSettled`

Do not use React state for business workflows that must be shared, tested, or coordinated with API/routing.

## React binding

### `effector-react`

Use for:

- `useUnit` in React components
- `<Provider value={scope}>` when using Scope

Avoid `useStore`/manual subscriptions in new code unless there is a specific reason.

### `@effector/next`

Use for:

- Next.js applications where Effector Scope, SSR, serialization, and hydration need first-class integration

Do not add it to plain Vite/SPA projects.

## Remote data

### `@farfetched/core`

Use for:

- queries
- mutations
- request status
- cancellation/concurrency
- cache update/refetch
- auth barriers
- request lifecycle

Use `createJsonQuery`/`createJsonMutation` for ordinary JSON HTTP APIs.

Do not write custom `createEffect(fetch)` wrappers for every endpoint when Farfetched already solves the problem.

## Runtime validation and DTO typing

### `@withease/contracts`

Use as the default contract solution for Farfetched responses.

Use for:

- backend DTO contracts
- runtime validation of remote data
- `UnContract` type extraction

Do not trust backend data only because TypeScript type says it is valid.

## Effector utilities

### `patronum`

Use for common operators:

- `debounce`
- `throttle`
- `delay`
- `condition`
- `status`
- `pending`
- `spread`
- `reshape`
- `reset`
- `combineEvents`

Do not reimplement these operators manually in every model.

## Complex synchronous branching

### `effector-action`

Use sparingly when one synchronous business action becomes unreadable as many nested `sample`/`split` calls.

Good use:

- one event has many branches
- all branches are synchronous
- `sample` graph becomes less readable than a local action body

Do not use it as an excuse to write imperative application logic everywhere.

## Reusable model factories

### `@withease/factories`

Use for reusable model factories:

- repeated table models
- modal models
- form sections
- feature factories
- model composition with unique unit identity

Do not create model factories inside React components.

When using factories, configure the Effector SWC/Babel plugin if required by your build setup.

## Routing

### `atomic-router`

Use when routing should participate in Effector graph:

- typed routes
- route opened/closed events
- route guards
- `chainRoute`
- route-driven data loading

Do not put navigation decisions directly in UI when they are business decisions.

If the project already uses React Router, you can keep it, but isolate routing integration in `app/routes` and page models.

## Persistence

### `effector-storage`

Use for syncing stores with:

- localStorage
- sessionStorage
- cookies
- IndexedDB
- async storage
- server-side storage adapters

Use for user preferences, theme, filters, draft state, and tokens only if the security model permits it.

Do not persist large remote data caches unless there is a clear offline/cache strategy.

## Forms

### Plain Effector model

Use for:

- small forms
- custom business validation
- forms tightly connected to a feature model

### `effector-forms`

Use when:

- the project has many complex forms
- declarative field state and validation reduce boilerplate
- the team accepts an additional form abstraction

Do not introduce a form library for one simple form.

## Internationalization

### `i18next` / `react-i18next`

Use for ordinary React translations.

### `@withease/i18next`

Use when i18n state or language switching should be integrated into Effector models.

Do not store translated strings in Effector stores if they can be derived at render time from keys.

## Browser/Web APIs

### `@withease/web-api`

Use for Effector-friendly bindings to browser APIs such as online/offline state, page visibility, and similar environment signals.

Do not scatter raw browser event listeners across components when a reusable Effector binding is more appropriate.

## Tooling

### `eslint-plugin-effector`

Use recommended, react, patronum, and scope presets according to project needs.

### Steiger and `@feature-sliced/steiger-plugin`

Use to check FSD architecture, public API usage, and import boundaries.

Steiger is useful, but if a rule conflicts with a justified project-specific decision, document the exception.

### `@effector/swc-plugin` or Effector Babel plugin

Use when the project needs SIDs, SSR serialization/hydration, factories, or better debugging.
