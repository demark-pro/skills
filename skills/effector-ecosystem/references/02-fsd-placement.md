# FSD placement rules

## Layers

```txt
app
pages
widgets
features
entities
shared
```

Allowed import direction:

```txt
app      -> pages, widgets, features, entities, shared
pages    -> widgets, features, entities, shared
widgets  -> features, entities, shared
features -> entities, shared
entities -> shared
shared   -> external packages only
```

`app` and `shared` do not have business slices. Other layers are divided into slices.

## `app`

Put here:

- application entrypoint
- providers
- global router config
- scope creation
- app lifecycle events
- global styles
- app-level error boundary
- app-level feature flags/config wiring

Do not put domain logic here unless it is truly app-wide orchestration.

## `pages`

Put here:

- complete route screens
- page-specific orchestration
- route-driven data loading
- page-specific table/list state
- page-specific filter/sort/pagination state
- page-specific query if not reusable

A page can import widgets, features, entities, and shared.

## `widgets`

Put here:

- large reusable UI blocks composed from lower layers
- layout blocks
- complex page sections reused across pages

Examples:

```txt
widgets/main-layout
widgets/profile-card
widgets/feed-list
widgets/search-panel
```

Do not create a widget for every component. If it is only used on one page and has no independent meaning, keep it in the page.

## `features`

Put here user actions and business capabilities:

```txt
features/session-login
features/session-logout
features/profile-update
features/comment-create
features/post-like
features/theme-switch
features/file-upload
```

A feature may contain:

```txt
ui/
model/
api/
lib/
```

A feature can import entities and shared, but cannot import pages or widgets.

Do not create features for technical actions:

```txt
features/open-modal       # bad
features/set-input        # bad
features/fetch-data       # bad
features/change-page      # bad
```

## `entities`

Put here domain objects:

```txt
entities/user
entities/session
entities/post
entities/comment
entities/product
entities/order
```

An entity may contain:

```txt
model/   # types, contracts, mappers, entity state
api/     # resource-level reusable operations
ui/      # entity visual atoms
lib/     # entity-local helpers
@x/      # explicit cross-import API for other entities
```

Entity UI examples:

```txt
UserAvatar
UserName
UserStatusBadge
ProductPrice
OrderStatus
```

Entity API examples:

```txt
userQuery
usersQuery
productQuery
commentsQuery
```

## `shared`

Put here domain-independent code:

```txt
shared/ui
shared/api
shared/config
shared/lib
shared/routes
shared/i18n
shared/assets
```

`shared` must not know about `User`, `Product`, `Order`, or business workflows.

Bad:

```txt
shared/types/user.ts
shared/ui/user-card.tsx
shared/api/users.ts
```

Good:

```txt
entities/user/model/user.contract.ts
entities/user/ui/user-card.tsx
entities/user/api/users.query.ts
```

## Public API

Every slice must export public API through `index.ts`.

Good:

```ts
import { UserAvatar, userQuery } from '@/entities/user';
import { ProfileUpdateForm } from '@/features/profile-update';
```

Bad:

```ts
import { UserAvatar } from '@/entities/user/ui/user-avatar';
import { $form } from '@/features/profile-update/model/form.model';
```

Inside a slice, use relative imports.

Between slices, use absolute imports.

## Cross-imports between entities

Avoid same-layer imports by default.

When entity A must expose something specifically for entity B, use `@x`:

```txt
entities/user/@x/order.ts
entities/order/model/order.contract.ts
```

```ts
import { UserContract } from '@/entities/user/@x/order';
```

Use `@x` rarely and intentionally.
