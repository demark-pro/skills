# Routing, forms, persistence, i18n, and browser APIs

Use this file for integration topics around Effector models.

## Contents

- Routing with Atomic Router
- Forms
- Persistence with `effector-storage`
- i18n
- Browser APIs with `@withease/web-api`
- Application startup

## Routing with Atomic Router

Use `atomic-router` when routes are part of Effector data flow.

Common placement:

```txt
shared/routes/index.ts          # route declarations/paths shared by app
pages/profile/route.ts          # page route ownership/re-export if needed
pages/profile/model/page.model.ts
```

Route model pattern:

```ts
import { createRoute, chainRoute } from 'atomic-router';
import { sample } from 'effector';
import { profileQuery } from '@/entities/user';

export const profileRoute = createRoute<{ userId: string }>();

sample({
  clock: profileRoute.opened,
  fn: ({ params }) => ({ id: params.userId }),
  target: profileQuery.start,
});
```

Use `chainRoute` when opening a route must wait for data or permissions before a child/loaded route becomes active.

Use Farfetched Atomic Router integration when a Farfetched Query is the route loader.

Do not put route open/close orchestration into React components.

## Forms

### Plain Effector form

Default form structure:

```ts
export const nameChanged = createEvent<string>();
export const formSubmitted = createEvent();

export const $name = createStore('').on(nameChanged, (_, value) => value);
export const $errors = combine($name, (name) => ({ name: name ? null : 'Required' }));
export const $isValid = $errors.map((errors) => !errors.name);

sample({
  clock: formSubmitted,
  source: $name,
  filter: $isValid,
  fn: (name) => ({ name }),
  target: updateProfileMutation.start,
});
```

Use for most forms unless a dedicated form library clearly reduces boilerplate.

### `effector-forms`

Use `effector-forms` when you need a form abstraction with field-level state, validation, touched/dirty metadata, and repeated patterns.

Keep form ownership in the feature/page model. UI may use `useForm` or expose a model shape for `useUnit`.

## Persistence with `effector-storage`

Persist only safe external state:

- theme
- locale
- UI preferences
- safe filters
- local drafts

Do not persist secrets or large remote data without a deliberate security/cache strategy.

Use contracts because external storage is untrusted.

```ts
import { createEvent, createStore } from 'effector';
import { persist } from 'effector-storage/local';
import { or, val } from '@withease/contracts';

export const appStarted = createEvent();
export const themeChanged = createEvent<'light' | 'dark'>();

export const $theme = createStore<'light' | 'dark'>('light')
  .on(themeChanged, (_, theme) => theme);

persist({
  store: $theme,
  key: 'theme',
  contract: or(val('light'), val('dark')),
  pickup: appStarted,
});
```

For Scope/SSR, prefer explicit `pickup` to load the value in the right Scope.

Use `clock` when storage writes should happen only on a specific event.

## i18n

Use `i18next`/`react-i18next` for ordinary UI translations.

Use `@withease/i18next` when language must participate in Effector data flow.

Typical placement:

```txt
shared/i18n/
  i18n.ts
  i18n.model.ts
app/providers/i18n-provider.tsx
features/language-switch/model/
```

Rules:

- store language/code/domain values, not already translated strings
- translate in UI or at a presentation boundary
- use language store as source for language-dependent queries
- refresh language-dependent queries on language change when needed

Example flow:

```ts
sample({
  clock: languageChanged,
  target: changeLanguageFx,
});
```

With Farfetched, combine `$language` with query params or use `keepFresh` on language changes.

## Browser APIs with `@withease/web-api`

Use Web API integrations for browser signals instead of scattering listeners in components.

Useful signals:

- online/offline
- page visibility
- media queries
- orientation
- languages
- geolocation

Pattern:

```ts
export const appStarted = createEvent();
export const appDestroyed = createEvent();

// integration created in shared/lib or app integration
// setup: appStarted, teardown: appDestroyed
```

Use page visibility or network status as Farfetched `keepFresh` triggers when refetching on focus/reconnect is desired.

## Application startup

Prefer one explicit app-start event:

```ts
export const appStarted = createEvent();
```

Use it to:

- initialize browser integrations
- pick up persisted state
- start initial queries
- initialize i18n

Do not hide initialization in random component effects.
