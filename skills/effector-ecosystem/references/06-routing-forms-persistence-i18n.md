# Routing, forms, persistence, and i18n

## Routing

Prefer `atomic-router` when routing should be part of Effector graph.

Structure:

```txt
app/routes/router.ts
app/routes/routes.ts
pages/profile/route.ts
pages/profile/model/page.model.ts
```

Page route:

```ts
// pages/profile/route.ts
import { createRoute } from 'atomic-router';

export const profileRoute = createRoute();
```

App routes:

```ts
// app/routes/routes.ts
import { profileRoute } from '@/pages/profile';

export const routes = [
  { path: '/profile', route: profileRoute },
];
```

Route-driven loading:

```ts
sample({
  clock: profileRoute.opened,
  target: profileQuery.start,
});
```

Do not navigate from UI when the navigation is a business consequence. Trigger an event and let the model decide.

## Forms

For simple forms, use plain Effector stores/events.

Structure:

```txt
features/profile-update/model/form.model.ts
features/profile-update/ui/profile-update-form.tsx
```

Use `effector-forms` only when it reduces repeated form boilerplate across the project.

Rules:

- form fields are events/stores/model units
- submit is an event
- validation is in model/lib, not JSX
- server errors are mapped in model
- UI only renders state and sends events

## Persistence

Use `effector-storage` for persistent stores.

Examples:

- theme
- language
- sidebar collapsed state
- user preferences
- local drafts
- safe filters

Avoid persistence for:

- sensitive tokens unless security model explicitly allows it
- large remote data without cache strategy
- derived data that can be recomputed

Persistence belongs near the store it persists or in an infrastructure file if shared:

```txt
features/theme-switch/model/theme.model.ts
shared/lib/storage
```

## i18n

Use `react-i18next` for ordinary UI translations.

Use `@withease/i18next` when:

- language is part of Effector model
- route/domain logic depends on language
- you want Effector-native language switching

Do not put translated strings into domain stores. Store translation keys or domain values; translate in UI.

## Browser APIs

Use `@withease/web-api` or small `shared/lib` adapters for browser signals:

- online/offline
- page visibility
- media queries
- clipboard
- local notifications

Do not attach raw event listeners in many components.
