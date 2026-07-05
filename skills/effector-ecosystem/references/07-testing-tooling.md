# Testing and tooling

## Testing Effector models

Use `fork` and `allSettled` for model tests.

Test behavior without rendering React when possible.

Example:

```ts
const scope = fork({
  handlers: [
    [updateProfileMutation.__.executeFx, async () => mockProfile],
  ],
});

await allSettled(formSubmitted, { scope });

expect(scope.getState($status)).toBe('done');
```

Exact Farfetched internals can differ by version; prefer public testing recipes from current Farfetched docs.

## UI tests

Use UI tests for:

- rendering states
- user interaction wiring
- integration between component and model

Do not test all business rules through React if they can be tested at model level.

## ESLint

Use `eslint-plugin-effector` presets:

- `recommended` for base Effector best practices
- `react` for React-specific rules
- `scope` when using Fork API / Scope
- `patronum` when using Patronum

## FSD linting

Use Steiger and `@feature-sliced/steiger-plugin` to automate FSD checks:

- public API rule
- import boundaries
- layer/slice structure
- forbidden cross-imports

Steiger can be strict. Document intentional exceptions.

## TypeScript

Use strict mode.

Avoid `any` for remote data. Unknown backend data must pass through contracts.

## Build plugin

Use `@effector/swc-plugin` or the Effector Babel plugin when the project needs:

- stable SIDs
- SSR serialization/hydration
- factories support
- better unit names/debugging

Configure factories when using model factories.
