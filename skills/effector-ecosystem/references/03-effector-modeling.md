# Effector modeling rules

Use this file when designing or reviewing Effector models.

## Contents

- Static initialization
- Unit choice
- Data flow with `sample`
- Store rules
- Effects
- `attach`
- `scopeBind`
- Branching
- Patronum
- Factories
- File organization inside a slice
- Testing model behavior

## Static initialization

Create units at module top level only.

```ts
export const submitted = createEvent();
export const $value = createStore('');
```

Do not create events, stores, effects, queries, mutations, routes, or factories in React render or hooks.

## Unit choice

Use:

- event for a fact that happened: `formSubmitted`, `pageOpened`, `searchChanged`
- store for state: `$query`, `$isValid`, `$selectedUserId`
- effect for side effects that are not Farfetched remote operations: analytics, non-HTTP adapters, imperative SDK calls
- query/mutation for backend communication
- derived store for computed state

Use names that describe the domain fact, not the setter implementation.

```ts
// good
export const emailChanged = createEvent<string>();
export const formSubmitted = createEvent();

// bad
export const setEmail = createEvent<string>();
export const click = createEvent();
```

When exposing events to React through a `useUnit` shape, keep these fact names in the model and alias them as handlers for UI:

```ts
export const $$form = {
  email: $email,
  onEmailChange: emailChanged,
  onSubmit: formSubmitted,
};
```

## Data flow with `sample`

Use `sample` as the default way to connect units.

```ts
sample({
  clock: formSubmitted,
  source: $values,
  filter: $isValid,
  target: submitMutation.start,
});
```

Rules:

- `clock` answers “when”
- `source` answers “with which current data”
- `filter` answers “should it continue”
- `fn` maps data and must be pure
- `target` is the next fact/operation

Prefer `sample` over `$store.getState()`, `watch`, and imperative event calls.

Avoid legacy `forward`/`guard` in new code; `sample` covers the same architectural role with a clearer shape.

## Store rules

Prefer atomic stores when fields change independently:

```ts
export const $name = createStore('');
export const $email = createStore('');
```

Use `combine` for view models:

```ts
export const $vm = combine({
  name: $name,
  email: $email,
  canSubmit: $canSubmit,
});
```

Derived stores are read-only in architecture. Do not use derived stores as `target` or attach `.on`/`.reset` to them after derivation.

Effector treats `undefined` specially in stores. Do not return `undefined` from reducers unless `skipVoid: false` is intentional and documented.

## Effects

Use `createEffect` for non-HTTP side effects:

```ts
export const analyticsTrackedFx = createEffect<AnalyticsPayload, void>(async (payload) => {
  analytics.track(payload);
});
```

For HTTP, prefer Farfetched.

Do not orchestrate a workflow by calling events/effects inside an effect body:

```ts
// bad
const saveAndReloadFx = createEffect(async (values) => {
  await saveFx(values);
  reloadRequested();
});
```

Use `sample` connections instead.

## `attach`

Use `attach` when an effect needs values from stores or parameter preprocessing.

```ts
const requestWithTokenFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (params: RequestParams, token) => ({ ...params, token }),
});
```

This avoids `getState()` and keeps dependencies explicit.

## `scopeBind`

Use `scopeBind` for callbacks that leave Effector's synchronous call stack and still need to target the current Scope:

- DOM/event emitter callbacks registered outside React
- WebSocket callbacks
- SDK callbacks
- timers created inside scoped initialization

Do not use `scopeBind` as a replacement for `useUnit` in React components.

## Branching

For simple branching, use `sample` with `filter` or `split`.

For complex multi-branch flows, use `effector-action` when it improves readability and still keeps targets explicit.

Do not put business branching in JSX.

## Patronum

Use Patronum for common patterns instead of custom `watch` or timer logic:

- debounce/throttle search
- `reset` many stores by clock
- `status`/`pending` helpers
- `condition`
- `spread`/`reshape`
- `combineEvents`

## Factories

Prefer factories over copy-pasted Effector model code for repeated same-shaped behavior. Use them only when the resulting model instances are independent.

Rules:

- define factory in `model/create-*.model.ts`
- invoke at module top level
- export the instance through slice public API
- use `@withease/factories` in SSR/Scope/SID-sensitive apps and configure the Effector Babel/SWC plugin `factories` field
- do not invoke factories in React components

## File organization inside a slice

Small slice:

```txt
model.ts
index.ts
```

Medium slice:

```txt
model/
  form.model.ts
  query.model.ts
  contract.ts
api/
  update-profile.mutation.ts
ui/
  profile-update-form.tsx
index.ts
```

Large slice: split by feature/domain concern, not by “stores/events/effects” folders.

Avoid:

```txt
model/stores.ts
model/events.ts
model/effects.ts
```

Prefer:

```txt
model/form.model.ts
model/permissions.model.ts
model/lifecycle.model.ts
```

## Testing model behavior

Use `fork` and `allSettled`.

Do not render React just to test data flow that can be tested at model level.
