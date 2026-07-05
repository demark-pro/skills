# Effector modeling rules

## Static initialization

Create all units at module level:

```ts
export const submitted = createEvent<FormValues>();
export const $values = createStore<FormValues>(initialValues);
```

Never create units inside:

- React components
- event handlers
- effects
- condition branches
- callbacks
- loops at runtime

## `sample` is the main glue

Use `sample` to connect events, stores, effects, queries, and mutations.

```ts
sample({
  clock: formSubmitted,
  source: $values,
  target: updateProfileMutation.start,
});
```

Use `source` instead of `$store.getState()`.

## Events describe facts

Good event names:

```ts
pageOpened
formSubmitted
emailChanged
profileUpdated
modalClosed
```

Bad event names:

```ts
setData
handleClick
doStuff
run
```

Events should represent something that happened, not a command implementation detail.

## Stores are atomic

Prefer:

```ts
export const $email = createStore('');
export const $password = createStore('');
export const $isDirty = combine($email, $password, ...);
```

Avoid one giant store when pieces change independently:

```ts
export const $pageState = createStore({
  email: '',
  password: '',
  filters: {},
  pagination: {},
  modal: {},
});
```

Use object stores when the object is truly indivisible.

## View models

Collect UI-ready data with `combine`:

```ts
export const $vm = combine({
  values: $values,
  errors: $errors,
  pending: updateProfileMutation.$pending,
  disabled: $isSubmitDisabled,
});
```

Expose `$vm` or separate stores depending on what gives better rendering granularity.

## Effects

Use effects for side effects that are not better represented by Farfetched:

- analytics
- logging
- browser APIs
- file download
- clipboard
- imperative adapter calls

Do not put business orchestration inside effects.

Bad:

```ts
const saveFx = createEffect(async () => {
  const values = $values.getState();
  await api.save(values);
  saved();
  navigateFx('/profile');
});
```

Good:

```ts
sample({
  clock: formSubmitted,
  source: $values,
  target: saveMutation.start,
});

sample({
  clock: saveMutation.finished.success,
  target: profileRoute.open,
});
```

## `watch`

Use `watch` only for debugging, logging during development, or bridging to an external imperative system when there is no better adapter.

Do not use `watch` for business logic.

## `effector-action`

Use when a single synchronous action becomes unreadable with many `sample` calls.

Prefer ordinary `sample` for normal flows.

## File organization

For small slices:

```txt
model/model.ts
```

For medium/large slices, split by behavior:

```txt
model/form.model.ts
model/validation.model.ts
model/routing.model.ts
model/permissions.model.ts
```

Avoid splitting by unit type:

```txt
model/events.ts
model/stores.ts
model/effects.ts
```

That structure makes related behavior harder to read.
