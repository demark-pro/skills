# React UI binding with Effector

Use this file when writing or reviewing React components.

## Contents

- Connected vs dumb components
- Main rule: one `useUnit` shape per connected component
- What to avoid
- Scope and SSR
- Deprecated/legacy bindings
- Lists and item subscriptions
- Gates
- Forms
- Effector units in render
- Event handlers

## Connected vs dumb components

Dumb component:

- receives ordinary props
- renders markup
- knows nothing about Effector units

Connected component:

- imports a model/query/mutation/route from a public API
- calls `useUnit`
- passes plain values/callbacks to dumb UI

Prefer small connected components at slice boundaries.

## Main rule: one `useUnit` shape per connected component

For units from the same model, prefer one `useUnit` call with an object or array shape and destructure the result.

### Object shape: preferred for readability

```tsx
import { useUnit } from 'effector-react';
import { $$profileUpdate } from '../model/profile-update.model';

export function ProfileUpdateForm() {
  const {
    name,
    email,
    errors,
    submitDisabled,
    nameChanged,
    emailChanged,
    submitted,
  } = useUnit($$profileUpdate);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      submitted();
    }}>
      <input value={name} onChange={(event) => nameChanged(event.currentTarget.value)} />
      <input value={email} onChange={(event) => emailChanged(event.currentTarget.value)} />
      <button disabled={submitDisabled}>Save</button>
    </form>
  );
}
```

Model shape:

```ts
export const $$profileUpdate = {
  name: $name,
  email: $email,
  errors: $errors,
  submitDisabled: $submitDisabled,
  nameChanged,
  emailChanged,
  submitted,
};
```

### Array shape: useful for local small bindings

```tsx
const [value, submitDisabled, valueChanged, submitted] = useUnit([
  $value,
  $submitDisabled,
  valueChanged,
  submitted,
]);
```

Use arrays only when order is obvious and stable. Prefer object shape for public model APIs.

## What to avoid

Avoid many separate `useUnit` calls in one component:

```tsx
// bad by default
const value = useUnit($value);
const submitDisabled = useUnit($submitDisabled);
const valueChanged = useUnit(valueChangedEvent);
const submitted = useUnit(submittedEvent);
```

This is harder to review, easier to partially refactor incorrectly, and increases the chance of unused subscriptions. Split the component when different parts need independent subscriptions.

Avoid passing raw events/effects to DOM handlers:

```tsx
// bad in Scope/SSR-aware apps
<button onClick={() => submittedEvent()}>Save</button>
```

Use the bound function returned by `useUnit`:

```tsx
const { submitted } = useUnit({ submitted: submittedEvent });
<button onClick={() => submitted()}>Save</button>
```

## Scope and SSR

When an app uses Scope, tests, SSR, or hydration, events/effects must be bound to the current Scope before passing to DOM/event handlers.

Use:

```tsx
<Provider value={scope}>
  <App />
</Provider>
```

and bind units with `useUnit` in React.

Do not call raw units directly from components.

## Deprecated/legacy bindings

Avoid in new code:

- `useStore`
- `useEvent`
- `connect`
- HOCs from older Effector React patterns

Use `useUnit` instead.

## Lists and item subscriptions

For large lists, avoid subscribing a whole list item component to the entire list if it only needs one item.

Use:

- `useList` for rendering store-backed lists
- `useStoreMap` for selecting one item by id
- component splitting when only a small subtree needs a store

Keep list transformation in models when it is business/domain behavior. UI-only presentation mapping can stay in UI.

## Gates

Use Gates only for lifecycle facts that genuinely belong to a component boundary:

- component mounted/unmounted
- route widget appeared
- visible props entered a model

Do not use Gate as a hidden API call trigger when route/page events are clearer.

## Forms

UI should:

- bind form values/errors/actions through a single `useUnit` shape
- translate labels/messages
- call bound events in handlers

UI should not:

- decide if a business transition is allowed
- call mutations directly if a form event should own the flow
- parse backend errors

## Effector units in render

Never create units in render or hooks:

```tsx
function Component() {
  const clicked = createEvent(); // bad
}
```

Create models statically and import them.

## Event handlers

Good:

```tsx
const { searchChanged } = useUnit({ searchChanged });
<input onChange={(event) => searchChanged(event.currentTarget.value)} />
```

Good for submit:

```tsx
const { submitted } = useUnit({ submitted });
<form onSubmit={(event) => {
  event.preventDefault();
  submitted();
}} />
```

Avoid putting business logic in handlers.
