# Example: generic list page

This example is not admin-specific. It can represent posts, products, messages, projects, files, etc.

## Structure

```txt
entities/item/
  index.ts
  model/item.contract.ts
  model/item.types.ts
  api/items.query.ts
  ui/item-title.tsx

features/item-create/
  index.ts
  ui/item-create-button.tsx
  model/item-create.model.ts
  api/item-create.mutation.ts

pages/items/
  index.ts
  route.ts
  ui/items-page.tsx
  model/page.model.ts
  model/filters.model.ts
  api/items-page.query.ts  # only if list params/shape are page-specific
```

## Page orchestration

```ts
sample({
  clock: [itemsRoute.opened, searchDebounced, pageChanged],
  source: $queryParams,
  target: itemsQuery.start,
});

sample({
  clock: createItemMutation.finished.success,
  source: $queryParams,
  target: itemsQuery.start,
});
```

The create feature does not know which page should refetch. The page owns that decision.

## Search/filter concurrency

```ts
concurrency(itemsQuery, { strategy: 'TAKE_LATEST' });
```

Use `TAKE_LATEST` for fast-changing search/filter requests. Use `cache` or `keepFresh` only when freshness behavior is intentional.

## Page model UI shape

```ts
export const $$itemsPage = {
  items: itemsQuery.$data,
  pending: itemsQuery.$pending,
  search: $search,
  page: $page,
  searchChanged,
  pageChanged,
  retryClicked: itemsQuery.refresh,
};
```

## Page component binding

```tsx
const {
  items,
  pending,
  search,
  page,
  searchChanged,
  pageChanged,
  retryClicked,
} = useUnit($$itemsPage);
```

Keep table/list rendering in UI. Keep filtering, pagination params, refetch rules, and feature-completion reactions in the page model.
