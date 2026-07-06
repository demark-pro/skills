# Example: generic list page placement

## Tree

```txt
entities/item/
  index.ts
  model/item.contract.ts
  model/item.mapper.ts
  api/item.query.ts
  ui/item-card.tsx

features/item-create/
  index.ts
  ui/item-create-form.tsx
  model/form.model.ts
  api/item-create.mutation.ts

pages/items/
  index.ts
  route.ts
  ui/items-page.tsx
  model/page.model.ts
  model/filters.model.ts
  model/pagination.model.ts
  api/items-page.query.ts
```

## Placement decisions

- `entities/item/api/item.query.ts`: reusable single-item or domain read.
- `pages/items/api/items-page.query.ts`: page-specific list query because params are page filters/pagination.
- `features/item-create`: user action and mutation.
- `pages/items/model`: route params, filters, pagination, refresh after creation.

## Page model orchestration

```ts
// pages/items/model/page.model.ts
import { createEvent, sample } from 'effector';
import { itemCreateMutation } from '@/features/item-create';
import { itemsPageQuery } from '../api/items-page.query';
import { $filters } from './filters.model';

export const pageStarted = createEvent();
export const refreshClicked = createEvent();

sample({
  clock: [pageStarted, refreshClicked, itemCreateMutation.finished.success],
  source: $filters,
  target: itemsPageQuery.start,
});
```

This belongs to the page because it coordinates page filters and page list refresh.
