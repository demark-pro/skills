# Farfetched and contracts

Use this file for remote data design. It is intentionally strict: most production bugs around Farfetched come from treating it as a thin `fetch` wrapper instead of a remote-operation layer with validation, concurrency, freshness, cache, and barriers.

## Contents

- Default rule
- Query template
- Mutation template
- Request shape
- Contracts
- DTO mapping
- Error mapping
- Concurrency
- Refresh, freshness, and cache
- Cache update after mutation
- Barriers and auth refresh
- Atomic Router integration
- Placement
- Testing
- Anti-patterns

## Default rule

Use Farfetched for backend communication.

- Reads: `createJsonQuery`
- Writes: `createJsonMutation`
- Params: `declareParams<T>()` when params are needed
- Runtime response validation: `response.contract`
- DTO mapping: `response.mapData`
- Error normalization: `response.mapError` or a shared API error mapper
- Concurrency: `concurrency(operation, { strategy })`, not an obsolete factory config field
- Freshness/cache: `keepFresh`, `cache`, `.refresh`, and `update` deliberately, not by habit
- Auth/availability gates: `createBarrier` + `applyBarrier`

Never treat remote data as trusted TypeScript data until a contract validates it.

## Query template

```ts
import { createJsonQuery, declareParams, concurrency } from '@farfetched/core';
import { UserDtoContract, mapUserDto, type User } from '../model/user.contract';
import { mapRemoteError } from '@/shared/api/errors';
import { apiUrl } from '@/shared/api/base-url';

export type UserQueryParams = { id: string };

export const userQuery = createJsonQuery({
  params: declareParams<UserQueryParams>(),
  request: {
    method: 'GET',
    url: ({ id }) => apiUrl(`/users/${id}`),
    // query: ({ id }) => ({ expand: 'roles' }),
    // headers: { accept: 'application/json' },
    // fetch: { credentials: 'include' }, // cookie auth; prefer this over top-level credentials in Farfetched v0.15+
  },
  response: {
    contract: UserDtoContract,
    mapData: ({ result }): User => mapUserDto(result),
    mapError: ({ error }) => mapRemoteError(error),
  },
});

// Use the operator; do not put concurrency into createJsonQuery config.
concurrency(userQuery, { strategy: 'TAKE_LATEST' });
```

For queries without params, omit `params` entirely or use the project-standard no-params convention. Do not invent `{}` params solely to satisfy a template.

## Mutation template

```ts
import { createJsonMutation, declareParams, concurrency } from '@farfetched/core';
import { UserDtoContract, mapUserDto, type User } from '../model/user.contract';
import { mapRemoteError } from '@/shared/api/errors';
import { apiUrl } from '@/shared/api/base-url';

export type UpdateUserParams = {
  id: string;
  values: { name: string };
};

export const updateUserMutation = createJsonMutation({
  params: declareParams<UpdateUserParams>(),
  request: {
    method: 'PATCH',
    url: ({ id }) => apiUrl(`/users/${id}`),
    body: ({ values }) => values,
    // fetch: { credentials: 'include' },
  },
  response: {
    contract: UserDtoContract,
    mapData: ({ result }): User => mapUserDto(result),
    mapError: ({ error }) => mapRemoteError(error),
  },
});

// Typical submit behavior: ignore duplicate submit while the current mutation is pending.
concurrency(updateUserMutation, { strategy: 'TAKE_FIRST' });
```

## Request shape

Keep request construction in the operation, not in UI.

Common request fields:

- `method`
- `url`
- `query`
- `body`
- `headers`
- `fetch`

Rules:

- Do not send `body` with `GET`/`HEAD` requests.
- For cookie/session APIs, use `request.fetch.credentials`, for example `fetch: { credentials: 'include' }`. Do not rely on the old top-level `credentials` option in new Farfetched code.
- Keep domain-independent URL/base/header helpers in `shared/api`; keep endpoint-specific params/mapping in the owning slice.
- If auth headers depend on stores, use a shared request adapter or `attach`-style infrastructure around non-Farfetched effects only when Farfetched cannot express the need directly.

## Contracts

Default to `@withease/contracts`:

```ts
import { obj, str, num, type UnContract } from '@withease/contracts';

export const UserDtoContract = obj({
  id: num,
  full_name: str,
});

export type UserDto = UnContract<typeof UserDtoContract>;
```

Place contracts by data ownership:

```txt
entities/user/model/user.contract.ts
features/profile-update/model/profile-update.contract.ts
shared/api/problem.contract.ts
```

Do not put all business DTOs into `shared/contracts`.

Use another validator only if the project already standardizes on it. The architecture rule is not “use one specific validator at all costs”; the rule is “validate unknown remote data at runtime before using it as domain data”.

## DTO mapping

Use `mapData` after validation to map transport shape to domain shape.

```ts
export const mapUserDto = (dto: UserDto): User => ({
  id: String(dto.id),
  displayName: dto.full_name,
});

response: {
  contract: UserDtoContract,
  mapData: ({ result }) => mapUserDto(result),
}
```

If DTO mapping is more than a trivial field rename, extract it to a named pure function in the API mapping file or owning entity/feature `lib`, then call it from `mapData`.

Do not replace validation with type assertions:

```ts
// bad
mapData: ({ result }) => result as User;
```

## Error mapping

Normalize errors close to the remote operation or in shared API infrastructure.

Examples:

- transport error
- non-2xx HTTP status
- validation error
- unauthorized
- forbidden
- backend domain error
- network timeout/offline

UI should consume a stable project error union, not parse arbitrary backend or Farfetched internals.

```ts
export type RemoteError =
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  | { kind: 'validation'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string };

response: {
  contract: UserDtoContract,
  mapError: ({ error }): RemoteError => mapRemoteError(error),
}
```

## Concurrency

Use the `concurrency` operator, not a factory config field.

Common strategies:

- `TAKE_LATEST` for search, filters, autocomplete, and route params that change quickly
- `TAKE_FIRST` for submit mutations where duplicate clicks must be ignored while pending
- `TAKE_EVERY` for independent requests; this is the default

```ts
concurrency(searchQuery, { strategy: 'TAKE_LATEST' });
concurrency(submitMutation, { strategy: 'TAKE_FIRST' });
```

Use `abortAll` when a lifecycle event must cancel in-flight work, for example route close or logout.

```ts
concurrency(userQuery, {
  strategy: 'TAKE_LATEST',
  abortAll: userRoute.closed,
});
```

## Refresh, freshness, and cache

Use:

- `query.start` when params are known and the query must be requested
- `query.refresh` to refresh the current query with current params
- `keepFresh` to refresh on app start, reconnect, page visible, language change, interval, or other triggers
- `cache` to reuse previous results and define stale/purge policy

Important `keepFresh` nuance: it refreshes queries that have already been started at least once. If the query has never been started, a trigger alone does not create first params by magic. Connect the first `start` to route open, app start, or a model event, then use `keepFresh` for revalidation.

```ts
import { keepFresh } from '@farfetched/core';

sample({
  clock: userRoute.opened,
  fn: ({ params }) => ({ id: params.userId }),
  target: userQuery.start,
});

keepFresh(userQuery, {
  triggers: [pageBecameVisible, networkCameOnline],
});
```

Use `cache` when stale data policy is explicit:

```ts
import { cache } from '@farfetched/core';

cache(userQuery, {
  staleAfter: '5 minutes',
  purge: '1 hour',
});
```

Do not manually call underlying effects when query semantics already exist.

## Cache update after mutation

Use `update` only when local cache modification is safe and predictable.

Safe examples:

- replacing an item by id after update
- prepending a newly created item when backend order is known
- removing an item after delete if permissions/filtering cannot change the list unexpectedly

Prefer invalidation/refresh when backend sorting, filtering, permissions, aggregation, computed fields, or user-specific visibility can change the result.

```ts
import { update } from '@farfetched/core';

update(userQuery, {
  on: updateUserMutation,
  by: {
    success: ({ query, mutation }) => ({
      result: mutation.result,
      refetch: false,
    }),
  },
});
```

If the exact `update` object shape differs in the installed Farfetched version, follow the current Farfetched docs for that version; keep the architectural rule the same: update only when it is semantically safe, otherwise refresh.

## Barriers and auth refresh

Use `createBarrier` + `applyBarrier` for flows where remote operations must pause/retry around a shared condition:

- token refresh
- global auth restoration
- maintenance/unavailable resource
- rate-limit or server-unavailable gate

Typical cookie-based refresh barrier:

```ts
import {
  applyBarrier,
  createBarrier,
  createJsonMutation,
  isHttpErrorCode,
} from '@farfetched/core';
import { SessionContract } from '@/entities/session';
import { apiUrl } from '@/shared/api/base-url';

export const refreshSessionMutation = createJsonMutation({
  request: {
    method: 'POST',
    url: apiUrl('/auth/refresh'),
    fetch: { credentials: 'include' },
  },
  response: {
    contract: SessionContract,
  },
});

export const authBarrier = createBarrier({
  activateOn: {
    failure: isHttpErrorCode(401),
  },
  perform: [refreshSessionMutation],
});
```

Apply the barrier to operations that need the same auth policy:

```ts
applyBarrier([userQuery, updateUserMutation], { barrier: authBarrier });
```

Rules:

- Place shared auth/network barriers in `shared/api` or `app` integration, depending on whether they are pure transport infrastructure or application lifecycle policy.
- Apply barriers in the owning slice API/model, close to the operation, so reviewers can see the remote behavior.
- Keep UI redirects out of the shared barrier. Convert refresh failure into app/session events, then route from page/app routing models.
- Do not make every operation depend on an auth barrier if some endpoints are intentionally public.

## Atomic Router integration

Use `@farfetched/atomic-router` when a Farfetched Query is the route loader. Its docs warn that the Atomic Router integration API can be version-sensitive, so check the installed versions before generating exact helper signatures.

- `startChain(query)` starts the query unconditionally before opening the chained route.
- `freshChain(query)` refreshes the query only when it is stale.
- `barrierChain(barrier)` waits for a Farfetched barrier to deactivate before route opening.

```ts
import { chainRoute, createRoute } from 'atomic-router';
import { freshChain, startChain } from '@farfetched/atomic-router';
import { postQuery } from '@/entities/post';

export const postRoute = createRoute<{ postId: string }>();

export const postLoadedRoute = chainRoute({
  route: postRoute,
  ...startChain(postQuery), // for required first load
});

export const postFreshRoute = chainRoute({
  route: postRoute,
  ...freshChain(postQuery), // for cache-aware re-open
});
```

If query params do not match route open payload, add a small adapter in the page model or create a page-specific query whose params shape is the route payload. Do not hide route-param mapping in React components.

## Placement

```txt
shared/api/http.ts                         # base request helpers, headers, base URL
shared/api/errors.ts                       # project RemoteError mapping
shared/api/auth-barrier.ts                 # shared remote infra
entities/user/model/user.contract.ts       # User DTO/domain validation
entities/user/model/user.mapper.ts         # DTO -> domain mapper if non-trivial
entities/user/api/user.query.ts            # reusable user reads
features/profile-update/api/mutation.ts    # profile update action
pages/users/api/users-page.query.ts        # page-specific list query
pages/users/model/users-page.model.ts      # route/filter/page orchestration
```

## Testing

Test the model behavior around operations, not Farfetched internals.

- Use `fork`/`allSettled` for flows that start queries/mutations.
- Mock project-level API handlers/effects according to the public testing API of the installed Farfetched version.
- Assert domain events, stores, and route decisions.
- Do not depend on undocumented fields under Farfetched internals.

## Anti-patterns

### Raw fetch effect

```ts
const loadFx = createEffect(() => fetch('/api/user').then((r) => r.json()));
```

Prefer `createJsonQuery` with a contract.

### Contract-less response

```ts
response: {
  mapData: ({ result }) => result as User,
}
```

Add a contract.

### Deprecated credentials option

```ts
// bad in new Farfetched code
createJsonQuery({
  request: { method: 'GET', url: '/me' },
  credentials: 'include',
});
```

Use `request.fetch.credentials`:

```ts
createJsonQuery({
  request: {
    method: 'GET',
    url: '/me',
    fetch: { credentials: 'include' },
  },
});
```

### `keepFresh` without first start

```ts
keepFresh(userQuery, { triggers: [appStarted] });
// but userQuery was never started with params
```

Start the query on route/app event first; use `keepFresh` for revalidation.

### Blind optimistic update

Do not patch cached lists if backend sorting/filtering/permissions can change the visible result. Refresh instead.

### Barrier with UI policy inside shared API

Do not redirect to login from `shared/api/auth-barrier.ts`. Emit auth/session facts and let app/page routing decide.

### Query/mutation in component

Do not create or configure Farfetched operations in React components.
