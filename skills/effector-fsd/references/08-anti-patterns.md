# FSD + Effector anti-patterns

## Global technical folders

Bad:

```txt
src/api/users.ts
src/components/UserCard.tsx
src/store/index.ts
src/hooks/useProfile.ts
src/utils/formatUser.ts
```

Better:

```txt
entities/user/api/user.query.ts
entities/user/ui/user-card.tsx
entities/user/model/user.model.ts
entities/user/lib/format-user.ts
```

## Shared with business domain knowledge

Bad:

```txt
shared/types/user.ts
shared/api/users.ts
shared/ui/user-avatar.tsx
shared/api/auth-barrier.ts # imports session entity or login route
```

Better:

```txt
entities/user/model/user.types.ts
entities/user/api/user.query.ts
entities/user/ui/user-avatar.tsx
entities/session/api/session-refresh-barrier.ts
app/routes/auth-redirects.ts
```

## Direct imports from slice internals

Bad:

```ts
import { $session } from '@/entities/session/model/session.model';
import { updateProfileMutation } from '@/features/profile-update/api/update-profile.mutation';
```

Good:

```ts
import { $session } from '@/entities/session';
import { updateProfileMutation } from '@/features/profile-update';
```

## Same-layer feature coupling

Bad:

```ts
// features/profile-update/model.ts
import { loginSubmitted } from '@/features/session-login';
```

Better: move orchestration to page/app.

```txt
pages/profile/model/page.model.ts
app/model/auth-workflow.model.ts
```

## Features named after UI mechanics

Bad:

```txt
features/open-modal
features/set-search
features/button-click
features/change-input
```

Good:

```txt
features/session-login
features/profile-update
features/comment-create
features/order-cancel
```

## Entity imports feature/page

Bad:

```ts
// entities/user/model/user.model.ts
import { profileUpdated } from '@/features/profile-update';
```

Better: feature emits facts; page/app/entity public model wiring is done in an allowed higher owner, or the feature writes through its mutation/update policy without entity importing it.

## Page logic hidden in feature

Bad:

```txt
features/user-table-filter/model/pagination.model.ts # only used by users page
```

Better:

```txt
pages/users/model/filters.model.ts
pages/users/model/pagination.model.ts
```

A feature should be a reusable business capability or user action, not a place to avoid putting code in pages.

## Widget for every component

Bad:

```txt
widgets/profile-card
widgets/profile-title
widgets/profile-button
```

Better: keep page-only UI inside the page. Extract widget only when it is large, reusable, or independently meaningful.

## Contracts dumped into shared

Bad:

```txt
shared/contracts/user.contract.ts
shared/contracts/order.contract.ts
shared/contracts/profile.contract.ts
```

Better:

```txt
entities/user/model/user.contract.ts
entities/order/model/order.contract.ts
features/profile-update/model/profile-update.contract.ts
shared/api/problem.contract.ts # generic transport problem only
```

## Auth barrier in shared updates session or navigates

Bad:

```ts
// shared/api/auth-barrier.ts
import { sessionReceived } from '@/entities/session';
import { loginRoute } from '@/pages/login';
```

Better:

```txt
entities/session/api/session-refresh-barrier.ts
app/api/apply-auth-barriers.ts
app/routes/auth-redirects.ts
shared/api/http.ts
```

## Next.js framework route becomes business model

Bad:

```tsx
// app/users/[id]/page.tsx
// huge file: route params, requests, permissions, stores, redirect logic, UI
```

Better:

```txt
app/users/[id]/page.tsx          # thin adapter
src/_pages/user/model/page.model.ts
src/_pages/user/ui/user-page.tsx
src/entities/user/api/user.query.ts
```

## Model split by unit type

Bad:

```txt
model/stores.ts
model/events.ts
model/effects.ts
```

Better:

```txt
model/form.model.ts
model/submit.model.ts
model/permissions.model.ts
model/page.model.ts
```
