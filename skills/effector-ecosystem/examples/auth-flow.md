# Example: auth flow

## Structure

```txt
entities/session/
  index.ts
  model/session.contract.ts
  model/session.model.ts
  api/current-session.query.ts

features/session-login/
  index.ts
  ui/login-form.tsx
  model/login.model.ts
  api/login.mutation.ts

features/session-logout/
  index.ts
  model/logout.model.ts
  api/logout.mutation.ts

shared/api/
  auth-barrier.ts
  base-url.ts

pages/login/
  index.ts
  route.ts
  ui/login-page.tsx
  model/page.model.ts

app/routes/
  router.ts
  routes.ts
```

## Rules

- `entities/session` stores current session domain state.
- `features/session-login` performs login user action.
- `features/session-logout` performs logout user action.
- `shared/api/auth-barrier.ts` handles token refresh infrastructure.
- Pages decide redirects after login/logout if redirect is page-specific.
- App-level auth guard can live in `app/routes` if it affects global route access.
