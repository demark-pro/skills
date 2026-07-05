# Testing and tooling

## Contents

- Testing Effector models
- UI tests
- Scope/SSR checks
- ESLint
- FSD linting
- TypeScript
- Build plugin
- Next.js
- CI review gates

## Testing Effector models

Use `fork` and `allSettled` for model tests.

Test behavior without rendering React when possible.

```ts
import { allSettled, fork } from 'effector';

const scope = fork({
  values: [[$token, 'token']],
  handlers: [[analyticsTrackedFx, async () => undefined]],
});

await allSettled(formSubmitted, { scope });

expect(scope.getState($isSubmitted)).toBe(true);
```

For Farfetched, use current public testing recipes from Farfetched docs. Internals under `__` can change; avoid depending on them unless the docs for the installed version recommend it.

## UI tests

Use UI tests for:

- rendering states
- user interaction wiring
- integration between component and model

Use `<Provider value={scope}>` in tests that need Scope.

Do not test all business rules through React if they can be tested at model level.

## Scope/SSR checks

When Scope is used:

- events/effects passed to React handlers must be bound through `useUnit`
- persistence should use explicit `pickup`
- stores that are serialized must have stable SIDs
- app bootstrap should use `fork`, `serialize`, and hydration consistently

## ESLint

Use `eslint-plugin-effector` presets:

- `recommended` for base Effector best practices
- `react` for React-specific rules
- `scope` when using Fork API / Scope
- `patronum` when using Patronum
- `future` only when the team intentionally wants stricter future-oriented rules

React-specific checks to value highly:

- prefer `useUnit`
- exhaustive `useUnit` destructuring
- mandatory scope binding
- no units/factories in render
- no deprecated hooks in new code

Scope checks to value highly:

- no unsafe `getState`
- no unsafe `watch`
- persist requires `pickup` when scopes are used
- strict effect handler discipline in tests

## FSD linting

Use Steiger and `@feature-sliced/steiger-plugin` to automate FSD checks:

- public API rule
- import boundaries
- layer/slice structure
- forbidden cross-imports

Steiger is strict and evolves. Document intentional exceptions.

## TypeScript

Use strict mode.

Avoid `any` for remote data. Unknown backend data must pass through contracts.

Use `UnContract<typeof Contract>` or project-standard validator inference for DTO/domain types.

## Build plugin

Use `@effector/swc-plugin` or the Effector Babel plugin when the project needs:

- stable SIDs
- SSR serialization/hydration
- factories support
- better unit names/debugging
- HMR support

Configure local factories when using model factories. Community packages such as Patronum, Farfetched, Atomic Router, `effector-action`, and `@withease/factories` are commonly handled by plugin defaults, but local project factories still need explicit configuration.

## Next.js

Use `@effector/next` for Next.js integration when Scope/SSR/hydration is required.

Rules:

- enable Effector Babel/SWC plugin for SIDs
- avoid raw event/effect calls in components
- bind through `useUnit`
- serialize/hydrate only intended stores
- keep server/client boundaries explicit

## CI review gates

At minimum, CI should run:

- TypeScript typecheck
- unit tests for Effector models
- UI tests where relevant
- ESLint with Effector presets
- FSD linting where Steiger is adopted
- build with the same plugin configuration used in production
