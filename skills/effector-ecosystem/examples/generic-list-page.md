# Example: generic list page

This example is not admin-specific. It can represent posts, products, messages, projects, files, etc.

## Structure

```txt
entities/item/
  index.ts
  model/item.contract.ts
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
