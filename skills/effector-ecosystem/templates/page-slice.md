# Page slice template

Path:

```txt
pages/<page>/
  index.ts
  route.ts
  ui/
    <page>.tsx
  model/
    page.model.ts
  api/       # only if remote operation is page-specific
  lib/
```

Use page model for orchestration:

- route opened/closed
- page query start
- refetch after feature mutation
- page-specific filters/sorting/pagination
- page-specific redirects

## index.ts

```ts
export { Page } from './ui/page';
export { pageRoute } from './route';
```

## Page model shape

Expose a shape for `useUnit`:

```ts
export const $$page = {
  data: pageQuery.$data,
  pending: pageQuery.$pending,
  opened: pageRoute.opened,
  retryClicked: pageQuery.refresh,
};
```

## Page UI rule

```tsx
const { data, pending, retryClicked } = useUnit($$page);
```

Do not start queries in `useEffect` when route/app events already express the lifecycle.
