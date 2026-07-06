# Review checklist

Use this checklist when reviewing Effector ecosystem code. Use `effector-fsd` for project-structure and import-boundary review.

## Effector

- Are units created statically at module level?
- Is business logic outside React components?
- Is `sample` used for data flow?
- Is `sample.fn` pure?
- Is `watch` absent from business logic?
- Is `$store.getState()` absent from production logic?
- Is `attach` used instead of reading stores inside effects when needed?
- Are stores atomic enough?
- Are non-trivial transformations extracted from `combine`, `sample.fn`, and store `.map` into named pure functions?
- Are DTO mapping, domain calculations, and UI-only formatting placed at the right ownership boundary?
- Are derived stores not used as targets?
- Are reducers not accidentally returning `undefined`?
- Is complex branching readable (`sample`/`split`/`effector-action`)?
- Are events named as facts?
- Is large model logic split into responsibility-based submodels?
- Is the top-level model mostly orchestration between submodels through `sample`/declarative connections?
- Is repeated same-shaped model code extracted to factories instead of copy-pasted?
- Are factories invoked only at module top level?
- Is app/page startup represented by explicit events such as `appStarted`/`pageStarted`?
- Is scoped startup executed through `allSettled(event, { scope, params })` instead of hidden helper chains?
- If startup helpers such as `startRouter(scope)` exist, has the reviewer first tried to move them into effects started from `appStarted`?
- If a free-floating startup helper remains, is it a documented last-resort host adapter boundary rather than business workflow?
- Are external callbacks registered with `scopeBind` or scope-aware adapters?

## Farfetched/contracts

- Are remote operations Farfetched queries/mutations?
- Are responses validated with contracts?
- Is DTO mapping isolated in `mapData` or domain lib?
- Are errors normalized before UI consumes them?
- Is query/mutation ownership clear and placed near the correct operation/domain boundary?
- Is concurrency strategy intentional and applied through the operator?
- For submits, is duplicate-click protection an explicit `$pending` gate in the feature/page model, unless `TAKE_FIRST` is justified and tested?
- Is `.refresh`, `keepFresh`, cache, or update strategy correct?
- If `keepFresh` is used, has the query been started at least once with valid params?
- Is `request.fetch.credentials` used for cookie/session APIs in current Farfetched code?
- Are `GET`/`HEAD` requests free of `body`?
- Is `abortAll`/route-close cancellation considered for route/search requests?
- Is blind optimistic update avoided for server-sorted/filtered data?
- Is auth refresh centralized through `createBarrier`/`applyBarrier` or shared API logic?
- Are shared barriers free of UI/router redirects?
- Is `@farfetched/atomic-router` used where a query is truly the route loader, and are route params mapped outside React?

## React

- Does connected UI use `useUnit`?
- Is there one `useUnit` object/array shape per connected component by default?
- Are all returned values destructured and used intentionally?
- Do handler-like values returned from `useUnit` use `on*` aliases, such as `onSubmit`, instead of event fact names such as `submitted`?
- Are raw events/effects not passed to DOM handlers or ordinary callback props?
- Is component splitting used when subscription granularity matters?
- Does UI only render and send events?
- Are units/factories absent from render/hooks?

## Routing/forms/persistence/i18n

- Is route orchestration in model, not component effects?
- Are route params typed?
- Are protected routes handled by `chainRoute`/route models rather than JSX-only wrappers?
- Are Farfetched route loaders using `startChain`/`freshChain` deliberately?
- Are forms owned by feature/page models?
- Are submit flows connected by `sample`?
- Are persisted values safe and validated with contracts?
- Is `pickup` explicit when Scope/SSR is used?
- Are translated strings not stored in domain stores?
- Are browser API listeners centralized through adapters/integrations?

## Packages/tooling

- Is each package justified by purpose?
- Is there duplicated custom logic that Patronum/Farfetched already solves?
- Are Effector ESLint presets enabled?
- Are Scope-specific lint rules enabled when Scope is used?
- Are factory/SID requirements handled by Babel/SWC plugin, including the `factories` field for SSR?
- Is `@effector/next` used for Next.js SSR/hydration instead of custom ad-hoc glue?
- Is a fresh Scope created per Next.js request/page computation?
- Is `serialize(scope)` passed to `EffectorNext` and are SIDs stable?
- Are Client Components marked with `'use client'` when using Effector React hooks?
- Is Next router navigation isolated in an adapter model?

## Red flags

- `src/api/users.ts` with business endpoint soup
- `src/store/index.ts` global model with all domains
- one model owning form, filters, list loading, selection, dialogs, and actions at once
- `watch` triggering effects
- `getState` inside effects
- `fetch` in React components
- contracts missing from backend responses
- multiple `useUnit` calls in one connected component without a render-granularity reason
- raw event/effect calls from React components
- persistence without validation/pickup in scoped apps
- global server Scope in Next.js
- route/page data loading from React `useEffect` instead of route/page model
- `keepFresh` trigger without first query start
- Farfetched top-level `credentials` in new code
- shared API barrier that directly opens login routes
