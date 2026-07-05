# Farfetched and contracts

## Query placement

Place a query at the lowest layer where it remains reusable and meaningful.

### Entity query

Use when query represents a domain resource and can be reused:

```txt
entities/user/api/user.query.ts
entities/product/api/products.query.ts
```

### Feature query/mutation

Use when operation belongs to a user action:

```txt
features/profile-update/api/update-profile.mutation.ts
features/file-upload/api/upload-file.mutation.ts
```

### Page query

Use when operation is page-specific:

```txt
pages/search/api/search-page.query.ts
pages/dashboard/api/dashboard.query.ts
```

## Contracts

Every remote response must be validated.

Good:

```ts
response: {
  contract: UserContract,
}
```

Bad:

```ts
response: {
  mapData: ({ result }) => result as User,
}
```

Use `@withease/contracts` by default unless the project has an existing runtime validation standard.

## DTO and domain mapping

If backend DTO differs from frontend domain model, use mapper:

```txt
entities/user/model/user.contract.ts
entities/user/model/user.types.ts
entities/user/model/user.mapper.ts
```

```ts
response: {
  contract: UserDtoContract,
  mapData: ({ result }) => mapUserDtoToUser(result),
}
```

Do not leak unstable backend shapes across the app.

## `createJsonQuery`

Template:

```ts
export const resourceQuery = createJsonQuery({
  params: declareParams<ResourceParams>(),
  request: {
    method: 'GET',
    url: ({ id }) => apiUrl(`/resources/${id}`),
    query: ({ filter }) => ({ filter }),
  },
  response: {
    contract: ResourceContract,
  },
});
```

## `createJsonMutation`

Template:

```ts
export const updateResourceMutation = createJsonMutation({
  params: declareParams<UpdateResourceParams>(),
  request: {
    method: 'PATCH',
    url: ({ id }) => apiUrl(`/resources/${id}`),
    body: ({ values }) => values,
  },
  response: {
    contract: ResourceContract,
  },
});
```

## Concurrency

Use `TAKE_LATEST` for:

- search
- filters
- autocomplete
- route-driven query where only latest route matters

Be careful with mutation concurrency. Cancelling writes can be unsafe unless backend semantics are idempotent and well understood.

## Cache update vs refetch

Use `update` when:

- mutation result is enough to update cached query
- ordering/filtering is not ambiguous
- backend does not add hidden computed fields that matter

Use refetch when:

- list order is backend-controlled
- filters/sorting/permissions affect visibility
- mutation affects aggregate counters
- backend computes derived fields
- correctness is more important than avoiding a network call

## Auth refresh

Use Farfetched Barrier for token refresh flows.

Do not copy refresh-token logic into every query or mutation.

Place auth barrier in:

```txt
shared/api/auth-barrier.ts
```

Domain-specific session state can live in:

```txt
entities/session
features/session-login
features/session-logout
```
