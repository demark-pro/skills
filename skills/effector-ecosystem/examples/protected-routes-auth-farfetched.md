# Example: protected routes with auth, Atomic Router, and Farfetched

This example shows the intended library combination:

- `entities/session` owns current session state and contracts.
- Farfetched owns `/auth/me`, login, logout, and refresh operations.
- `createBarrier`/`applyBarrier` handles auth refresh for protected HTTP operations.
- Atomic Router `chainRoute` opens protected routes only after auth is known.
- React components only render and call bound `on*` handlers.

## Structure

```txt
src/
  app/
    model/app.model.ts
    routes/routes.ts
    routes/protected.ts
    routes/router.ts

  pages/
    dashboard/
      index.ts
      route.ts
      model/page.model.ts
      ui/dashboard-page.tsx
    login/
      index.ts
      route.ts
      model/page.model.ts
      ui/login-page.tsx

  entities/
    session/
      index.ts
      model/session.contract.ts
      model/session.model.ts
      api/current-session.query.ts
      api/refresh-session.mutation.ts

  features/
    session-login/
      index.ts
      model/login.model.ts
      api/login.mutation.ts
      ui/login-form.tsx

  shared/
    api/base-url.ts
    api/errors.ts
    api/auth-barrier.ts
```

## Session entity

```ts
// entities/session/model/session.contract.ts
import { obj, str, type UnContract } from '@withease/contracts';

export const SessionContract = obj({
  userId: str,
  email: str,
});

export type Session = UnContract<typeof SessionContract>;
```

```ts
// entities/session/model/session.model.ts
import { createEvent, createStore } from 'effector';
import type { Session } from './session.contract';

export type SessionState = 'unknown' | 'anonymous' | 'authenticated';

export const sessionReceived = createEvent<Session>();
export const sessionDropped = createEvent();

export const $session = createStore<Session | null>(null)
  .on(sessionReceived, (_, session) => session)
  .reset(sessionDropped);

export const $sessionState = createStore<SessionState>('unknown')
  .on(sessionReceived, () => 'authenticated')
  .on(sessionDropped, () => 'anonymous');

export const $isAuthenticated = $sessionState.map((state) => state === 'authenticated');
```

```ts
// entities/session/api/current-session.query.ts
import { createJsonQuery } from '@farfetched/core';
import { sample } from 'effector';
import { apiUrl } from '@/shared/api/base-url';
import { mapRemoteError } from '@/shared/api/errors';
import { SessionContract } from '../model/session.contract';
import { sessionDropped, sessionReceived } from '../model/session.model';

export const currentSessionQuery = createJsonQuery({
  request: {
    method: 'GET',
    url: apiUrl('/auth/me'),
    fetch: { credentials: 'include' },
  },
  response: {
    contract: SessionContract,
    mapError: ({ error }) => mapRemoteError(error),
  },
});

sample({
  clock: currentSessionQuery.finished.success,
  fn: ({ result }) => result,
  target: sessionReceived,
});

sample({
  clock: currentSessionQuery.finished.failure,
  target: sessionDropped,
});
```

## Auth barrier

```ts
// shared/api/auth-barrier.ts
import {
  applyBarrier,
  createBarrier,
  createJsonMutation,
  isHttpErrorCode,
} from '@farfetched/core';
import { sample } from 'effector';
import { apiUrl } from '@/shared/api/base-url';
import { mapRemoteError } from '@/shared/api/errors';
import { SessionContract } from '@/entities/session';
import { sessionDropped, sessionReceived } from '@/entities/session';

export const refreshSessionMutation = createJsonMutation({
  request: {
    method: 'POST',
    url: apiUrl('/auth/refresh'),
    fetch: { credentials: 'include' },
  },
  response: {
    contract: SessionContract,
    mapError: ({ error }) => mapRemoteError(error),
  },
});

sample({
  clock: refreshSessionMutation.finished.success,
  fn: ({ result }) => result,
  target: sessionReceived,
});

sample({
  clock: refreshSessionMutation.finished.failure,
  target: sessionDropped,
});

export const authBarrier = createBarrier({
  activateOn: {
    failure: isHttpErrorCode(401),
  },
  perform: [refreshSessionMutation],
});

// Apply the barrier close to concrete protected operations.
// applyBarrier([dashboardQuery, updateProfileMutation], { barrier: authBarrier });
```

Do not open `/login` from `shared/api/auth-barrier.ts`. The barrier is transport/session infrastructure. App routing handles redirects.

## App startup

```ts
// app/model/app.model.ts
import { createEvent, sample } from 'effector';
import { currentSessionQuery } from '@/entities/session';

export const appStarted = createEvent();

sample({
  clock: appStarted,
  target: currentSessionQuery.start,
});
```

Runtime and tests should start with one event:

```ts
const scope = fork();
await allSettled(appStarted, { scope });
```

Avoid splitting the business startup graph into:

```ts
await startAppClock(scope);
await allSettled(appStarted, { scope });
await startRouter(scope);
```

Do not use external startup helpers for ordinary app workflow. Model router/session/storage startup as effects started from `appStarted`; keep external helpers only for documented last-resort host adapter installation.

## Protected route helper

```ts
// app/routes/protected.ts
import {
  chainRoute,
  type RouteInstance,
  type RouteParams,
  type RouteParamsAndQuery,
} from 'atomic-router';
import { createEvent, createStore, merge, sample } from 'effector';
import { currentSessionQuery, $sessionState } from '@/entities/session';

export function chainAuthenticated<Params extends RouteParams>(route: RouteInstance<Params>) {
  const sessionCheckStarted = createEvent<RouteParamsAndQuery<Params>>();

  const $pendingAttempt = createStore<RouteParamsAndQuery<Params> | null>(null)
    .on(sessionCheckStarted, (_, attempt) => attempt);

  const alreadyAuthenticated = sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'authenticated'),
  });

  sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'unknown'),
    fn: () => undefined,
    target: currentSessionQuery.start,
  });

  const authenticatedAfterRestore = sample({
    clock: currentSessionQuery.finished.success,
    source: $pendingAttempt,
    filter: (attempt) => attempt !== null,
    fn: (attempt) => attempt!,
  });

  const knownAnonymous = sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'anonymous'),
  });

  const restoreFailed = sample({
    clock: currentSessionQuery.finished.failure,
    source: $pendingAttempt,
    filter: (attempt) => attempt !== null,
    fn: (attempt) => attempt!,
  });

  const rejected = merge([knownAnonymous, restoreFailed]);

  $pendingAttempt.reset([alreadyAuthenticated, authenticatedAfterRestore, rejected, route.closed]);

  return {
    route: chainRoute({
      route,
      beforeOpen: sessionCheckStarted,
      openOn: [alreadyAuthenticated, authenticatedAfterRestore],
      cancelOn: rejected,
    }),
    rejected,
  };
}
```

## Routes composition

```ts
// pages/dashboard/route.ts
import { createRoute } from 'atomic-router';
import { chainAuthenticated } from '@/app/routes/protected';

export const dashboardRoute = createRoute();
export const {
  route: dashboardAuthenticatedRoute,
  rejected: dashboardAuthRejected,
} = chainAuthenticated(dashboardRoute);
```

```ts
// app/routes/routes.ts
import { sample } from 'effector';
import { dashboardAuthRejected } from '@/pages/dashboard/route';
import { loginRoute } from '@/pages/login/route';

sample({
  clock: dashboardAuthRejected,
  fn: () => ({ params: {}, query: { reason: 'auth' } }),
  target: loginRoute.navigate,
});
```

## Protected data loading

```ts
// pages/dashboard/model/page.model.ts
import { sample } from 'effector';
import { dashboardAuthenticatedRoute } from '../route';
import { dashboardQuery } from '../api/dashboard.query';

sample({
  clock: dashboardAuthenticatedRoute.opened,
  target: dashboardQuery.start,
});
```

For a Farfetched query that is the loader, use `@farfetched/atomic-router`:

```ts
import { chainRoute } from 'atomic-router';
import { freshChain, startChain } from '@farfetched/atomic-router';

export const dashboardLoadedRoute = chainRoute({
  route: dashboardAuthenticatedRoute,
  ...startChain(dashboardQuery),
});

export const dashboardFreshRoute = chainRoute({
  route: dashboardAuthenticatedRoute,
  ...freshChain(dashboardQuery),
});
```

Use one or the other. Do not both `sample(route.opened -> query.start)` and `startChain(query)` for the same route unless you intentionally want two starts.

## Login feature

```ts
// features/session-login/model/login.model.ts
sample({
  clock: formSubmitted,
  source: $credentials,
  filter: $canSubmit,
  target: loginMutation.start,
});

sample({
  clock: loginMutation.finished.success,
  fn: ({ result }) => result,
  target: sessionReceived,
});

export const $$login = {
  email: $email,
  password: $password,
  submitDisabled: $submitDisabled,
  pending: loginMutation.$pending,
  onEmailChange: emailChanged,
  onPasswordChange: passwordChanged,
  onSubmit: formSubmitted,
};
```

```tsx
// features/session-login/ui/login-form.tsx
'use client';

const {
  email,
  password,
  submitDisabled,
  pending,
  onEmailChange,
  onPasswordChange,
  onSubmit,
} = useUnit($$login);
```

The component does not call `loginMutation.start` directly because the feature model owns validation and submit flow.
