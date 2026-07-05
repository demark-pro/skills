# Entity slice template

Path:

```txt
entities/<entity>/
  index.ts
  model/
    <entity>.contract.ts
    <entity>.types.ts
    <entity>.mapper.ts
  api/
    <entity>.query.ts
    <entity>s.query.ts
  ui/
    <entity>-name.tsx
```

## index.ts

```ts
export type { Entity } from './model/entity.types';
export { EntityContract } from './model/entity.contract';
export { entityQuery } from './api/entity.query';
export { EntityName } from './ui/entity-name';
```

## Placement rule

Use an entity slice for domain objects, contracts, entity-level API, mappers, and small visual components that represent the entity.
