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

### Oversized all-in-one model

Do not keep several workflows in one large model just because they belong to one page or feature.

Bad signs:

- form state, filters, list loading, selection, dialogs, and bulk actions in one file
- long chains of unrelated `sample` blocks that require reading the whole file
- stores/events/effects split into technical buckets instead of responsibility-based models

Split by concern:

```txt
model/form.model.ts
model/filters.model.ts
model/list.model.ts
model/selection.model.ts
model/dialog.model.ts
model/page.model.ts
```

The top-level model should orchestrate submodels with `sample` and expose a clear public shape. Each submodel should own its local state and rules.

### Long inline transformations in reactive operators

Do not hide complex mapping, sorting, grouping, normalization, or formatting inside `combine`, `sample.fn`, or store `.map`.

```ts
// bad
export const $rows = combine($users, $permissions, (users, permissions) =>
  users
    .filter((user) => permissions[user.id]?.canView)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((user) => ({
      id: user.id,
      title: `${user.name} (${user.role})`,
      canEdit: permissions[user.id]?.canEdit ?? false,
    })),
);
```

Use a named pure function and let the model stay declarative:

```ts
export const $rows = combine($users, $permissions, toUserRows);
```

Put DTO mapping near `mapData`/API/entity `lib`, domain calculations in the owning slice `lib`, and UI-only formatting at the presentation boundary.

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
const onChange = useUnit(changedEvent);
const onSubmit = useUnit(submittedEvent);
```

Prefer one shape:

```tsx
const { value, error, onChange, onSubmit } = useUnit($$form);
```

### Raw event/effect call from component

```tsx
// bad in Scope-aware apps
<button onClick={() => submittedEvent()}>Save</button>
```

Bind with `useUnit`:

```tsx
const { onSubmit } = useUnit({ onSubmit: submittedEvent });
<button onClick={() => onSubmit()}>Save</button>
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

## Routing and startup anti-patterns

### Free-floating scoped bootstrap sequence

```ts
await startAppClock(scope);
await allSettled(appStarted, { scope });
await startRouter(scope);
```

This is a red flag unless `startAppClock` and `startRouter` are documented external adapter installation boundaries. Prefer one explicit `appStarted` event and declarative connections:

```ts
await allSettled(appStarted, { scope, params: startParams });

sample({ clock: appStarted, target: appClockStartedFx });
sample({ clock: appStarted, target: routerStartedFx });
sample({ clock: routerStartedFx.doneData, target: initialRouteResolved });
```

### Route data loading in React effect

```tsx
useEffect(() => {
  userQuery.start({ id: params.id });
}, [params.id]);
```

Start from route events, `chainRoute`, Farfetched route integration, or `pageStarted`.

### Protected route as JSX wrapper only

```tsx
return isAuthenticated ? children : <Navigate to="/login" />;
```

This may be acceptable as a tiny presentation fallback, but it must not be the only business guard. Put auth restoration, loaded route opening, cancellation, and redirects into the routing model.

## Farfetched-specific anti-patterns

### Top-level `credentials`

```ts
createJsonQuery({
  request: { method: 'GET', url: '/me' },
  credentials: 'include',
});
```

Use `request.fetch.credentials` in new Farfetched code:

```ts
request: {
  method: 'GET',
  url: '/me',
  fetch: { credentials: 'include' },
}
```

### Body in GET/HEAD request

```ts
request: {
  method: 'GET',
  url: '/search',
  body: ({ query }) => ({ query }),
}
```

Use `query` for URL search params.

### `keepFresh` before first start

```ts
keepFresh(userQuery, { triggers: [appStarted] });
```

This is incomplete if the query has never received params. Trigger the first `start` from route/app/page model, then use `keepFresh` for revalidation.

### Shared auth barrier performs navigation

```ts
// shared/api/auth-barrier.ts
refreshSessionMutation.finished.failure.watch(() => loginRoute.open());
```

Shared API infrastructure should emit session/auth facts. App/page routing decides navigation.

## Next.js anti-patterns

### Global server Scope

```ts
// bad
export const serverScope = fork();
```

Create a fresh Scope per request/page computation.

### Missing plugin/SIDs with SSR

Do not rely on SSR serialization without stable SIDs from the Effector Babel/SWC plugin.

### Raw event in Client Component

```tsx
'use client';

<button onClick={() => submitted()}>Save</button>
```

Use `useUnit`:

```tsx
const { onSubmit } = useUnit({ onSubmit: submitted });
<button onClick={() => onSubmit()}>Save</button>
```

### Effector hook in Server Component

```tsx
// missing 'use client'
const user = useUnit($user);
```

Hooks belong to Client Components. Server Components can create Scope, run `allSettled`, serialize values, and render Client Components.

### App Router layout depends on page-loaded store

A parent layout should not assume it can read stores filled by a deeper page Server Component during the same server render. Load layout-critical data at the layout boundary or move the decision to the page.

### `serialize: 'ignore'` as a lazy fix

Do not silence serialization problems by ignoring stores that must hydrate. Use explicit store design or custom serialization for non-serializable values.
