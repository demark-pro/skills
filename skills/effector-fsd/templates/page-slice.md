# Page slice template

Use for a complete route/screen.

```txt
pages/<page>/
  index.ts
  route.ts
  ui/
    <page>-page.tsx
  model/
    page.model.ts
    filters.model.ts          # optional page-only filters
    selection.model.ts        # optional page-only selection
  api/
    <page>.query.ts           # only page-specific remote operations
  lib/
    map-route-params.ts
```

Public API example:

```ts
export { <Page>Page } from './ui/<page>-page';
```

Route/server exports may be separate:

```ts
// index.server.ts
export { pageStarted } from './model/page.model';
export { <page>Route } from './route';
```

Rules:

- Page owns route params, filters, sorting, pagination, page-only loading, redirects.
- Keep one-page UI blocks inside the page.
- Move queries to entities only when they become reusable domain reads.
