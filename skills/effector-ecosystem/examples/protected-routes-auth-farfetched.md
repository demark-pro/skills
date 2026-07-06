This example uses FSD-like paths only to make imports readable. For normative placement and import-boundary rules, use `effector-fsd`.

# Example: protected routes + auth + Farfetched

This example focuses on placement, not exact Farfetched API details.

## Tree

```txt
src/
  app/
    model/app.model.ts
    routes/protected.ts
    routes/auth-redirects.ts
    api/apply-auth-barriers.ts

  pages/
    dashboard/
      index.ts
      route.ts
      ui/dashboard-page.tsx
      model/page.model.ts
      api/dashboard.query.ts
    login/
      index.ts
      route.ts
      ui/login-page.tsx

  features/
    session-login/
      index.ts
      ui/login-form.tsx
      model/login.model.ts
      api/login.mutation.ts
    session-logout/
      index.ts
      model/logout.model.ts

  entities/
    session/
      index.ts
      model/session.model.ts
      model/session.contract.ts
      api/current-session.query.ts
      api/session-refresh-barrier.ts

  shared/
    api/base-url.ts
    api/errors.ts
    api/http.ts
    routes/index.ts
```

## Ownership

- `entities/session` owns session state, session contract, current-session query, refresh barrier.
- `features/session-login` owns login form and login mutation.
- `app/routes/protected.ts` owns reusable protected-route composition.
- `pages/dashboard/route.ts` owns dashboard route and page-specific route chain.
- `app/routes/auth-redirects.ts` owns redirect policy.
- `shared/api` stays transport-only and imports no entities/routes.

## Session entity

```ts
// entities/session/index.ts
export { $sessionState, $isAuthenticated, sessionReceived, sessionDropped } from './model/session.model';
export { SessionContract } from './model/session.contract';
export { currentSessionQuery } from './api/current-session.query';
export { sessionRefreshBarrier } from './api/session-refresh-barrier';
```

## Protected route composition

```ts
// app/routes/protected.ts
import { chainRoute, type RouteInstance, type RouteParams, type RouteParamsAndQuery } from 'atomic-router';
import { createEvent, sample } from 'effector';
import { $isAuthenticated, currentSessionQuery } from '@/entities/session';

export function chainAuthenticated<Params extends RouteParams>(route: RouteInstance<Params>) {
  const sessionCheckStarted = createEvent<RouteParamsAndQuery<Params>>();

  const alreadyAuthenticated = sample({
    clock: sessionCheckStarted,
    filter: $isAuthenticated,
  });

  sample({
    clock: sessionCheckStarted,
    filter: $isAuthenticated.map((is) => !is),
    target: currentSessionQuery.start,
  });

  const authenticatedAfterRefresh = sample({
    clock: currentSessionQuery.finished.success,
    source: $isAuthenticated,
    filter: Boolean,
    fn: (_, { params }) => params as RouteParamsAndQuery<Params>,
  });

  return chainRoute({
    route,
    beforeOpen: sessionCheckStarted,
    openOn: [alreadyAuthenticated, authenticatedAfterRefresh],
    cancelOn: currentSessionQuery.finished.failure,
  });
}
```

## Page route

```ts
// pages/dashboard/route.ts
import { createRoute } from 'atomic-router';
import { chainAuthenticated } from '@/app/routes/protected';

export const dashboardRoute = createRoute();
export const dashboardAuthenticatedRoute = chainAuthenticated(dashboardRoute);
```

## Redirects

```ts
// app/routes/auth-redirects.ts
import { redirect } from 'atomic-router';
import { dashboardRoute } from '@/pages/dashboard/route';
import { loginRoute } from '@/pages/login/route';
import { currentSessionQuery } from '@/entities/session';

redirect({
  clock: currentSessionQuery.finished.failure,
  route: loginRoute,
});
```

## Barrier placement

```ts
// entities/session/api/session-refresh-barrier.ts
import { createBarrier } from '@farfetched/core';
import { refreshSessionMutation } from './refresh-session.mutation';

export const sessionRefreshBarrier = createBarrier({
  active: refreshSessionMutation.$pending,
  perform: [refreshSessionMutation.start, refreshSessionMutation.finished.failure],
});
```

Applying to many operations:

```ts
// app/api/apply-auth-barriers.ts
import { applyBarrier } from '@farfetched/core';
import { sessionRefreshBarrier } from '@/entities/session';
import { dashboardQuery } from '@/pages/dashboard/api/dashboard.query';

applyBarrier(dashboardQuery, { barrier: sessionRefreshBarrier });
```

Do not put this session-aware barrier in `shared/api`, because it owns session-domain behavior.
