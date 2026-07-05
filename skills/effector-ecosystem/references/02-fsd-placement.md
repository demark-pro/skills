# FSD placement rules for Effector projects

Use this file to decide where code belongs.

## Contents

- Layer dependency rule
- Public API rule
- Layer responsibilities
- Remote operation placement
- Next.js and framework routes
- Segment rule
- Import examples

## Layer dependency rule

Allowed direction:

```txt
app -> pages -> widgets -> features -> entities -> shared
```

A layer can import only from layers below it.

Same-layer cross-imports between slices are a code smell and must be deliberate. In practice, only entity-to-entity relationships may use `@x` public APIs when the team agrees on it.

## Public API rule

Every slice must expose what external code may use through `index.ts`.

```txt
features/profile-update/
  index.ts
  ui/
  model/
  api/
```

External code:

```ts
// good
import { ProfileUpdateForm, $$profileUpdate } from '@/features/profile-update';

// bad
import { $$profileUpdate } from '@/features/profile-update/model/profile-update.model';
```

Inside the same slice, use relative imports.

## Layer responsibilities

### `app`

Use for:

- app entrypoints
- providers
- Effector scope setup
- router setup
- global styles
- app-wide initialization events
- app-level persistence pickup
- global error boundaries

Do not put business domain workflows into `app`.

### `pages`

Use for:

- complete route screens
- route-specific orchestration
- page-local filters/sorting/pagination
- page-specific queries that are not reusable domain API
- route open/close flows

Page UI can compose widgets, features, and entity UI.

A page model may connect route params, queries, filters, and feature completion events.

### `widgets`

Use for large reusable blocks assembled from lower layers:

- header/sidebar
- dashboard card grid
- profile panel
- product list block

Do not create a widget for every small component. A widget should be reusable or architecturally meaningful.

### `features`

Use for user actions/business capabilities:

- session-login
- profile-update
- comment-create
- cart-add-product
- theme-switch

A feature may own:

- form model
- mutation
- feature-specific query
- UI connected to its model
- validation and domain decision for this action

Avoid technical feature names:

```txt
features/open-modal      # bad
features/set-search      # bad
features/button-click    # bad
```

### `entities`

Use for domain nouns:

- user
- product
- order
- invoice

An entity may own:

- domain types
- DTO contracts
- basic reusable queries
- entity stores
- entity visual components
- entity-specific lib functions

Entities should not know about features/pages/widgets.

### `shared`

Use for domain-independent code:

- API client/base URL
- route path helpers without business orchestration
- UI primitives
- config
- generic lib utilities
- storage adapters
- i18n initialization
- assets

Do not put domain types or endpoint soup into `shared`:

```txt
shared/types/user.ts       # bad
shared/api/users.ts        # bad when user is a domain entity
shared/ui/UserAvatar.tsx   # bad when it knows user domain
```

## Remote operation placement

Place Farfetched operations by ownership:

```txt
entities/user/api/user.query.ts          # reusable user read
features/profile-update/api/mutation.ts  # update action
pages/users/api/users-page.query.ts       # page-specific table/list query
shared/api/http.ts                        # generic request infra only
```

Contracts belong near the owner of the remote data.

## Next.js and framework routes

Framework route files may live where the framework requires them (`app/`, `pages/`, `routes/`). Treat them as entry adapters.

They should import FSD pages/widgets/features through public APIs and should not become a place for business logic.

## Segment rule

Do not create all segments automatically. Add `ui`, `model`, `api`, `lib`, `config` only when real content exists.

## Import examples

Good:

```ts
// pages/profile/model/profile-page.model.ts
import { profileRoute } from '@/shared/routes';
import { userQuery } from '@/entities/user';
import { profileUpdated } from '@/features/profile-update';
```

Bad:

```ts
// entities/user/model/user.model.ts
import { ProfileUpdateForm } from '@/features/profile-update'; // upward import
```
