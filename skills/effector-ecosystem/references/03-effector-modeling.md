# Effector modeling rules

Use this file when designing or reviewing Effector models.

## Contents

- Static initialization
- Unit choice
- Data flow with `sample`
- Store rules
- Store update operators
- Transformation functions
- Effects
- `attach`
- Explicit app/page startup
- `scopeBind`
- Branching and `perform`
- Patronum
- Submodel composition
- Factories
- File organization inside a model module
- Testing model behavior

## Static initialization

Create units at module top level only.

```ts
export const submitted = createEvent();
export const $value = createStore('');
```

Do not create events, stores, effects, queries, mutations, routes, or factories in React render or hooks.

## Unit choice

Use:

- event for a fact that happened: `formSubmitted`, `pageOpened`, `searchChanged`
- store for state: `$query`, `$isValid`, `$selectedUserId`
- effect for side effects that are not Farfetched remote operations: analytics, non-HTTP adapters, imperative SDK calls
- query/mutation for backend communication
- derived store for computed state

Use names that describe the domain fact, not the setter implementation.

```ts
// good
export const emailChanged = createEvent<string>();
export const formSubmitted = createEvent();

// bad
export const setEmail = createEvent<string>();
export const click = createEvent();
```

When exposing events to React through a `useUnit` shape, keep these fact names in the model and alias them as handlers for UI:

```ts
export const $$form = {
  email: $email,
  onEmailChange: emailChanged,
  onSubmit: formSubmitted,
};
```

## Data flow with `sample`

Use `sample` as the default way to connect units.

```ts
sample({
  clock: formSubmitted,
  source: $values,
  filter: $isValid,
  target: submitMutation.start,
});
```

Rules:

- `clock` answers “when”
- `source` answers “with which current data”
- `filter` answers “should it continue”
- `fn` maps data and must be pure; extract non-trivial mapping to a named function
- `target` is the next fact/operation

Prefer `sample` over `$store.getState()`, `watch`, and imperative event calls.

Avoid legacy `forward`/`guard` in new code; `sample` covers the same architectural role with a clearer shape.

## Store rules

Prefer atomic stores when fields change independently:

```ts
export const $name = createStore('');
export const $email = createStore('');
```

Use `combine` for view models:

```ts
export const $vm = combine({
  name: $name,
  email: $email,
  canSubmit: $canSubmit,
});
```

Derived stores are read-only in architecture. Do not use derived stores as `target` or attach `.on`/`.reset` to them after derivation.

Effector treats `undefined` specially in stores. Do not return `undefined` from reducers unless `skipVoid: false` is intentional and documented.

## Store update operators

Pick the smallest operator that expresses the update:

| Update | Operator |
| --- | --- |
| Store holds the last payload of an event | `restore(event, initial)` |
| Next state depends only on the store itself and the payload | `$store.on(event, (state, payload) => next)` |
| Next state depends on other stores, or the update needs a `filter` | `sample({ clock, source, filter, fn, target: $store })` |
| One clock updates several units unconditionally | `sample({ clock, target: [$a, $b, fx] })` |
| Several stores reset by the same clocks | `reset({ clock, target: [$a, $b] })` from Patronum |
| Branching with early returns that selects among several targets | `perform` (see [Branching and `perform`](#branching-and-perform)) |

```ts
// good: restore instead of a pass-through reducer
export const $locale = restore(localeChanged, defaultLocale);

// good: reducer that reads only the store and the payload
export const $items = createStore<Item[]>([])
  .on(itemRemoved, (items, id) => items.filter((item) => item.id !== id));

// good: sample when another store takes part
sample({
  clock: itemAdded,
  source: { items: $items, limit: $limit },
  filter: ({ items, limit }) => items.length < limit,
  fn: ({ items }, item) => [...items, item],
  target: $items,
});
```

Do not rewrite `.on` into `sample` mechanically. `sample({ clock: e, source: $s, fn, target: $s })` names the store twice and adds nothing when the reducer reads only the store and the payload.

`restore` has no typed config, so `sid`, `name`, and `serialize` cannot be passed to it. Keep `createStore(initial, { serialize: 'ignore' }).on(...)` for non-serializable values such as history objects, DOM nodes, or SDK instances. With the Effector Babel/SWC plugin, `restore` stores get SIDs automatically.

A store used as `clock` already fires only when its value changes, so `$store.updates` is redundant there: use `sample({ clock: $store, target })`.

## Transformation functions

Keep reactive operators declarative. Use `combine`, `sample.fn`, and store `.map` to connect data and call pure functions, not to hold long algorithms inline.

Inline is fine for tiny transformations:

```ts
export const $canSubmit = combine($name, $email, (name, email) => Boolean(name && email));
```

Extract when transformation has real logic:

```ts
// model/profile.vm.ts
export const toProfileVm = (user: User, permissions: Permissions) => ({
  name: user.name,
  canEdit: permissions.includes('profile:update'),
});

// model/profile.model.ts
export const $profileVm = combine($user, $permissions, toProfileVm);
```

Placement defaults:

- DTO-to-domain mapping: use Farfetched `mapData`, API mapping files, or entity `lib`
- domain calculations: put pure functions in the owning entity/feature `lib`
- view models derived from stores: keep `$vm` in the model, but put non-trivial mapper functions next to it or in `lib`
- UI-only formatting such as localized strings, dates, and currency labels: keep at the UI/presentation boundary

Do not move business/domain transformation into React just to keep the model short. The model should orchestrate the transformation; the algorithm should be a named pure function.

## Effects

Use `createEffect` for non-HTTP side effects:

```ts
export const analyticsTrackedFx = createEffect<AnalyticsPayload, void>(async (payload) => {
  analytics.track(payload);
});
```

For HTTP, prefer Farfetched.

Do not orchestrate a workflow by calling events/effects inside an effect body:

```ts
// bad
const saveAndReloadFx = createEffect(async (values) => {
  await saveFx(values);
  reloadRequested();
});
```

Use `sample` connections instead.

## `attach`

Use `attach` when an effect needs values from stores or parameter preprocessing.

```ts
const requestWithTokenFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (params: RequestParams, token) => ({ ...params, token }),
});
```

This avoids `getState()` and keeps dependencies explicit.


## Explicit app/page startup

Effector apps should have explicit lifecycle facts. Do not rely on module side effects or random React `useEffect` calls for startup.

Default app startup:

```ts
export type AppStartParams = {
  initialUrl?: string;
  locale?: string;
};

export const appStarted = createEvent<AppStartParams>();
export const appDestroyed = createEvent();

sample({ clock: appStarted, target: storagePickupStarted });
sample({ clock: appStarted, target: i18nStarted });
sample({ clock: appStarted, target: browserIntegrationsStartedFx });
```

Default page/server startup:

```ts
export const pageStarted = createEvent<{ userId: string }>();

sample({
  clock: pageStarted,
  fn: ({ userId }) => ({ id: userId }),
  target: userQuery.start,
});
```

Scoped execution:

```ts
const scope = fork();
await allSettled(appStarted, { scope, params: startParams });
await allSettled(pageStarted, { scope, params: { userId } });
```

Avoid this pattern by default:

```ts
await startAppClock(scope);
await allSettled(appStarted, { scope });
await startRouter(scope);
```

Why it is dangerous:

- the real order is outside the model graph;
- tests must duplicate hidden imperative startup;
- SSR/Scope bugs become likely because external callbacks may fire outside the intended Scope;
- route, storage, and initial query behavior is harder to review.

Preferred rewrite:

```ts
export const appStarted = createEvent<AppStartParams>();

sample({ clock: appStarted, target: appClockStartedFx });
sample({ clock: appStarted, target: routerStartedFx });
sample({ clock: routerStartedFx.doneData, target: initialRouteResolved });
sample({ clock: initialRouteResolved, target: routeOpened });
```

Default: move adapter installation into effects started from `appStarted`. External adapters such as history listeners, SDK callbacks, timers, WebSocket subscriptions, or browser integration setup should be represented as scoped effects whenever possible.

Last-resort exception: an adapter may require imperative host wiring before the first Effector event can be triggered. Make that boundary explicit in the file name/comment/test setup, keep it infrastructure-only, and use `scopeBind` for callbacks that fire later:

```ts
export const installHistoryFx = createEffect((history: History) => {
  const routeChanged = scopeBind(routeChangedFromHistory);
  return history.listen((location) => routeChanged(location));
});

sample({ clock: appStarted, fn: ({ history }) => history, target: installHistoryFx });
```

Use `allSettled(scope)` only when work was already launched by external scope-bound callbacks and you need to wait until the Scope becomes idle. For ordinary app start, prefer `allSettled(appStarted, { scope, params })` because it both triggers the event in the Scope and waits for effects caused by that event.

## `scopeBind`

Use `scopeBind` for callbacks that leave Effector's synchronous call stack and still need to target the current Scope:

- DOM/event emitter callbacks registered outside React
- WebSocket callbacks
- SDK callbacks
- timers created inside scoped initialization

Do not use `scopeBind` as a replacement for `useUnit` in React components.

Scope loss is common in callbacks registered with external libraries: Next router events, browser history, WebSocket messages, timers, SDK subscriptions, and custom event emitters. Bind once at adapter installation time and keep the rest of the workflow inside Effector units.

## Branching and `perform`

For simple branching, use `sample` with `filter` or `split`.

For one synchronous decision with early returns that selects among several targets, use `perform` (Effector 23.5.0+). It is the core version of `createAction` from `effector-action`; on older Effector versions use `effector-action`.

```ts
import { perform } from 'effector';

perform({
  clock: previewMessageReceived,
  source: { $data, $docId },
  target: { mergeFx, $error },
  action: (target, { data, docId }, message) => {
    if (data === null) return;
    if (message.collection !== collection) return;
    if (message.id !== docId) {
      target.$error('foreign document');
      return;
    }
    target.mergeFx(message);
  },
});
```

Shape:

- With `clock`, `perform` returns nothing. Without `clock`, it returns a callable event; annotate the payload on the last `action` parameter: `(target, source, payload: string) => {}`.
- `action(target, source, payload)` with `source`, `action(target, payload)` without it.
- A leading `$` is stripped from **source** object keys (`{ $name }` → `source.name`) but not from **target** keys (`target.$name(value)`). With a single unit, `target` is the callback itself.
- `target.$store.reinit()` restores a store's default state.
- A store that is both read and written must be listed in `source` and in `target`.

Semantics:

- Only called targets fire. Calls are collected and propagated after `action` returns; `source` values are a snapshot and do not change during the action.
- Call each target at most once per action. A repeated call logs a warning and only the last payload is used.
- Target callbacks return nothing, including effects: there is no promise or result.
- If `action` throws, none of the collected calls are applied.
- `action` must be synchronous. A callback called after `action` returns, for example from `await` or a timer, throws. Start async work through an effect in `target` and react to `fx.doneData`/`fx.failData` with another `sample` or `perform`.

Do not use `perform` when `sample`, `attach`, or `restore` express the flow:

```ts
// bad: one target and one condition
perform({
  clock: formSubmitted,
  source: $items,
  target: orderMutation.start,
  action: (start, items, values) => {
    if (items.length) start(toOrder(items, values));
  },
});

// good
sample({
  clock: formSubmitted,
  source: $items,
  filter: (items) => items.length > 0,
  fn: toOrder,
  target: orderMutation.start,
});

// bad: unconditional fan-out
perform({ clock: orderPlaced, target: { cartCleared, formReset }, action: (t) => { t.cartCleared(); t.formReset(); } });

// good
sample({ clock: orderPlaced, target: [cartCleared, formReset] });
```

Migrating from `effector-action`: `createAction(clock, { source, target, fn })` becomes `perform({ clock, source, target, action })`, and the clockless form becomes `perform({ source, target, action })`. There is no `update` field, reducer setter, callback return value, or `createAsyncAction` equivalent. After migrating, drop `effector-action` from direct dependencies if nothing imports it.

Do not put business branching in JSX.

## Patronum

Use Patronum for common patterns instead of custom `watch` or timer logic:

- debounce/throttle search
- `reset` many stores by clock
- `once` for a clock that must fire only the first time, such as a gate opened twice by React StrictMode
- `status`/`pending` helpers
- `condition`
- `spread`/`reshape`
- `combineEvents`

## Submodel composition

Prefer concern-based submodels when one model starts owning several workflows. Split by responsibility, not by unit type.

Good submodel boundaries:

- form values, validation, and submit intent
- filters, sorting, and pagination
- list data loading and refresh
- selection and bulk actions
- dialog/modal lifecycle

Keep submodels focused on their own state, events, derived values, and local rules. Keep the top-level model thin: create or import submodels, expose the public `$$model` shape, and orchestrate cross-submodel interactions with `sample`, `combine`, `reset`, `spread`, or Patronum helpers.

Do not create `stores.ts`, `events.ts`, and `effects.ts` buckets just to split files. That keeps one large mental model and hides responsibility boundaries.

## Factories

Prefer factories over copy-pasted Effector model code for repeated same-shaped behavior. Use them only when the resulting model instances are independent.

Rules:

- define factory in `model/create-*.model.ts`
- invoke at module top level
- export the instance through the owning module public boundary
- use `@withease/factories` in SSR/Scope/SID-sensitive apps and configure the Effector Babel/SWC plugin `factories` field
- do not invoke factories in React components

## File organization inside a model module

Small model module:

```txt
model.ts
index.ts
```

Medium model module:

```txt
model/
  form.model.ts
  query.model.ts
  contract.ts
api/
  update-profile.mutation.ts
ui/
  profile-update-form.tsx
index.ts
```

Large model module: split by workflow/domain concern, not by “stores/events/effects” folders. Use a top-level `*.model.ts` only as an orchestration layer over focused submodels.

Avoid:

```txt
model/stores.ts
model/events.ts
model/effects.ts
```

Prefer:

```txt
model/form.model.ts
model/permissions.model.ts
model/lifecycle.model.ts
model/profile-page.model.ts  # orchestrates submodels with sample/combine
```

## Testing model behavior

Use `fork` and `allSettled`.

Do not render React just to test data flow that can be tested at model level.
