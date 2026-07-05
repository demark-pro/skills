# Anti-patterns

## Contents

- FSD anti-patterns
- Effector anti-patterns
- Farfetched anti-patterns
- React anti-patterns
- Persistence anti-patterns

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

### Business code in `shared`

```txt
shared/types/user.ts      # bad
shared/api/users.ts       # bad
shared/ui/user-avatar.tsx # bad
```

Move to `entities/user`.

### Too many technical features

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

Use `sample({ source: $values, clock: submitted })` or `attach`.

### Imperative effect orchestration

```ts
const flowFx = createEffect(async () => {
  await saveFx();
  await reloadFx();
  route.open();
});
```

Use events and `sample`.

### Derived store as target

```ts
const $fullName = combine($firstName, $lastName, (first, last) => `${first} ${last}`);

sample({
  clock: resetClicked,
  fn: () => '',
  target: $fullName, // bad
});
```

Target writable stores/events/effects, not derived stores.

### Returning `undefined` accidentally

```ts
$value.on(changed, (_, value) => {
  if (!value) return undefined; // bad unless skipVoid:false is deliberate
  return value;
});
```

Return previous state or model absence explicitly as `null`/union.

## Farfetched anti-patterns

### Fetch effects for HTTP endpoints

```ts
const loadUserFx = createEffect(() => fetch('/user').then((r) => r.json()));
```

Prefer `createJsonQuery` with a contract.

### Type assertion instead of contract

```ts
mapData: ({ result }) => result as User;
```

Validate runtime data.

### Concurrency in obsolete config shape

```ts
// bad for current Farfetched style
createJsonQuery({
  // ...
  concurrency: { strategy: 'TAKE_LATEST' },
});
```

Use the operator:

```ts
concurrency(query, { strategy: 'TAKE_LATEST' });
```

### Blind optimistic update

Do not patch cached lists if backend sorting/filtering/permissions can change visibility.

### Query/mutation created in component

Create remote operations statically in slice API/model files.

## React anti-patterns

### Many `useUnit` calls from the same model

```tsx
// bad by default
const value = useUnit($value);
const error = useUnit($error);
const changed = useUnit(changedEvent);
const submitted = useUnit(submittedEvent);
```

Prefer one shape:

```tsx
const { value, error, changed, submitted } = useUnit($$form);
```

### Raw event/effect call from component

```tsx
// bad in Scope-aware apps
<button onClick={() => submittedEvent()}>Save</button>
```

Bind with `useUnit`:

```tsx
const { submitted } = useUnit({ submitted: submittedEvent });
<button onClick={() => submitted()}>Save</button>
```

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

### Translated strings in domain stores

```ts
export const $statusText = createStore('User is blocked'); // bad for domain model
```

Store domain state and translate in UI/presentation.

## Persistence anti-patterns

### Persisting unvalidated external values

```ts
persist({ store: $theme, key: 'theme' }); // incomplete in Scope/external-data-sensitive apps
```

Use `contract` and explicit `pickup` when scopes are used.

### Persisting secrets by default

Do not store tokens in localStorage/sessionStorage unless the security model explicitly accepts the risk.
