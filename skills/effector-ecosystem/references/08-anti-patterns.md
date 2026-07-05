# Anti-patterns

## Contents

- [FSD anti-patterns](#fsd-anti-patterns)
- [Effector anti-patterns](#effector-anti-patterns)
- [Farfetched anti-patterns](#farfetched-anti-patterns)
- [React anti-patterns](#react-anti-patterns)

## FSD anti-patterns

### Deep imports across slices

```ts
// bad
import { $user } from '@/entities/user/model/user.model';
```

Use public API:

```ts
// good
import { $user } from '@/entities/user';
```

### Business code in shared

```txt
shared/types/user.ts      # bad
shared/api/users.ts       # bad
shared/ui/user-avatar.tsx # bad
```

Move to `entities/user`.

### Too many features

Bad:

```txt
features/open-modal
features/set-search
features/change-page
```

Good:

```txt
features/profile-update
features/comment-create
features/session-login
```

### Widget for everything

Do not create widgets for tiny one-page components.

## Effector anti-patterns

### Units in React render

```tsx
function Component() {
  const clicked = createEvent(); // bad
}
```

### Business logic in `watch`

```ts
formSubmitted.watch(() => {
  saveFx(); // bad
});
```

### Store reads through `getState`

```ts
const submitFx = createEffect(() => {
  const values = $values.getState(); // bad
});
```

Use `sample({ source: $values, clock: submitted })`.

### Imperative effect orchestration

```ts
const flowFx = createEffect(async () => {
  await saveFx();
  await reloadFx();
  route.open();
});
```

Use events and `sample`.

## Farfetched anti-patterns

### Fetch effects for HTTP endpoints

```ts
const loadUserFx = createEffect(() => fetch('/user').then(r => r.json()));
```

Prefer `createJsonQuery` with a contract.

### Type assertion instead of contract

```ts
mapData: ({ result }) => result as User
```

Validate runtime data.

### Blind optimistic update

Do not patch cached lists if backend sorting/filtering/permissions can change visibility.

## React anti-patterns

### API call in component

```tsx
onClick={async () => {
  await api.save(values); // bad
}}
```

Use model event and mutation.

### Domain condition in UI

```tsx
if (user.role === 'admin' && invoice.status === 'draft') {
  // complex workflow logic in JSX
}
```

Move to model or domain lib.
