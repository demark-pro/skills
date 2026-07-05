# Farfetched and contracts

Use this file for remote data design.

## Contents

- Default rule
- Query template
- Mutation template
- Contracts
- DTO mapping
- Error mapping
- Concurrency
- Refresh and freshness
- Cache update after mutation
- Barriers
- Placement
- Anti-patterns

## Default rule

Use Farfetched for backend communication.

- Reads: `createJsonQuery`
- Writes: `createJsonMutation`
- Params: `declareParams<T>()`
- Runtime response validation: `response.contract`
- DTO mapping: `response.mapData`
- Error normalization: `response.mapError` or shared error mapping layer

Never treat remote data as trusted TypeScript data until a contract validates it.

## Query template

```ts
import { createJsonQuery, declareParams, concurrency } from '@farfetched/core';
import { UserContract, type User } from '../model/user.contract';
import { apiUrl } from '@/shared/api/base-url';

export type UserQueryParams = { id: string };

export const userQuery = createJsonQuery({
  params: declareParams<UserQueryParams>(),
  request: {
    method: 'GET',
    url: ({ id }) => apiUrl(`/users/${id}`),
  },
  response: {
    contract: UserContract,
    mapData: ({ result }): User => result,
    mapError: ({ error }) => error,
  },
});

concurrency(userQuery, { strategy: 'TAKE_LATEST' });
```

## Mutation template

```ts
import { createJsonMutation, declareParams } from '@farfetched/core';
import { UserContract } from '../model/user.contract';
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
  },
  response: {
    contract: UserContract,
  },
});
```

## Contracts

Default to `@withease/contracts`:

```ts
import { obj, str, num, type UnContract } from '@withease/contracts';

export const UserContract = obj({
  id: num,
  name: str,
});

export type User = UnContract<typeof UserContract>;
```

Place contracts by data ownership:

```txt
entities/user/model/user.contract.ts
features/profile-update/model/profile-update.contract.ts
shared/api/problem.contract.ts
```

Do not put all business DTOs into `shared/contracts`.

## DTO mapping

Use `mapData` after validation to map transport shape to domain shape.

```ts
response: {
  contract: UserDtoContract,
  mapData: ({ result }) => ({
    id: String(result.id),
    displayName: result.full_name,
  }),
}
```

Do not replace validation with type assertions:

```ts
// bad
mapData: ({ result }) => result as User
```

## Error mapping

Normalize errors close to the remote operation or in shared API infrastructure.

Examples:

- transport error
- validation error
- unauthorized
- forbidden
- domain error returned by backend

UI should not parse arbitrary backend error shapes.

## Concurrency

Use the `concurrency` operator, not a factory config field.

Common strategies:

- `TAKE_LATEST` for search, filters, autocomplete, route params that change quickly
- `TAKE_FIRST` for preventing duplicate submit while one request is already running
- `TAKE_EVERY` for independent requests; this is the default

```ts
concurrency(searchQuery, { strategy: 'TAKE_LATEST' });
concurrency(submitMutation, { strategy: 'TAKE_FIRST' });
```

## Refresh and freshness

Use:

- `query.start` when params are known and the query must be requested
- `query.refresh` to refresh the current query with current params
- `keepFresh` to refresh on triggers such as app start, reconnect, page visible, language change, or interval
- `cache` to reuse previous results and define stale/purge policy

Do not manually call the underlying effect when query semantics already exist.

## Cache update after mutation

Use `update` only when local cache modification is safe and predictable.

Safe examples:

- replacing an item by id after update
- prepending a newly created item when backend order is known
- removing an item after delete if permissions/filtering cannot change the list unexpectedly

Prefer invalidation/refresh when backend sorting, filtering, permissions, or computed fields can change the result.

## Barriers

Use `createBarrier` + `applyBarrier` for flows where remote operations must pause/retry around a shared condition:

- token refresh
- maintenance/unavailable resource
- global auth restoration

Place shared auth/network barriers in `shared/api` or `app` integration. Apply them to queries/mutations owned by slices.

## Placement

```txt
shared/api/http.ts                         # base request helpers, headers, base URL
shared/api/auth-barrier.ts                 # shared remote infra
entities/user/model/user.contract.ts       # User DTO/domain validation
entities/user/api/user.query.ts            # reusable user reads
features/profile-update/api/mutation.ts    # profile update action
pages/users/api/users-page.query.ts        # page-specific list query
```

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

### Blind optimistic update

Do not patch cached lists if backend sorting/filtering/permissions can change the visible result. Refresh instead.

### Query/mutation in component

Do not create or configure Farfetched operations in React components.
