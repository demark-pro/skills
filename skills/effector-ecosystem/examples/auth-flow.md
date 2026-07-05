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
  problem.contract.ts

pages/login/
  index.ts
  route.ts
  ui/login-page.tsx
  model/page.model.ts

app/routes/
  router.ts
  routes.ts
app/providers/
  effector-provider.tsx
```

## Rules

- `entities/session` owns current session domain state and session contract.
- `features/session-login` performs the login user action.
- `features/session-logout` performs the logout user action.
- `shared/api/auth-barrier.ts` handles token refresh infrastructure only; it does not know page UI.
- Pages decide redirects after login/logout if redirect is page-specific.
- App-level auth guard can live in `app/routes` if it affects global route access.
- React components bind model units through one `useUnit` object shape.

## Feature model sketch

```ts
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
  emailChanged,
  passwordChanged,
  formSubmitted,
};
```

## Connected component sketch

```tsx
const {
  email,
  password,
  submitDisabled,
  pending,
  emailChanged,
  passwordChanged,
  formSubmitted,
} = useUnit($$login);
```

Do not call `loginMutation.start` directly from JSX if the feature has a form event that owns validation and submit flow.
