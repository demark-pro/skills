# FSD + Effector review checklist

Use this checklist when reviewing project structure.

## Layers and slices

- Are layers used only when they add value?
- Are imports only downward by layer?
- Are same-layer cross-imports absent, except documented `@x` entity APIs?
- Are `app` and `shared` sliceless?
- Is `processes` absent?
- Are slice names business/product-oriented?
- Are there no technical slices such as `features/set-search`, `features/open-modal`, `entities/api`?

## Public APIs

- Does each slice expose `index.ts`?
- Do external imports go through slice public APIs?
- Are there no layer-level barrels like `entities/index.ts`?
- Are wildcard exports avoided unless intentionally stable and tiny?
- Are server-only and client-safe exports separated in Next.js where needed?
- Are internal model/api/ui files hidden from consumers?

## Shared

- Is `shared` free of business domain types, stores, contracts, queries, and UI?
- Are `shared/api` files generic transport only?
- Does `shared/api` avoid importing `entities`, `features`, `pages`, `widgets`, or `app`?
- Does `shared/ui` avoid domain-specific props and business branches?
- Is `shared/lib` grouped by purpose and documented when it grows?

## Entities

- Are entity slices real business/domain concepts?
- Do entities avoid importing features/pages/widgets/app?
- Are entity contracts/mappers colocated with the entity?
- Are entity visuals free of action/page orchestration?
- Are entity-to-entity relationships handled with `@x` only when justified?

## Features

- Does each feature represent a user action or business capability?
- Are action forms/mutations/validation inside the owning feature?
- Are features not used as dumping grounds for technical UI state?
- Do features import only entities and shared?
- Does submit de-duplication live in the feature/page model, not in UI?

## Pages and widgets

- Does each page own route/screen orchestration?
- Are route params, page filters, sorting, pagination, and page-only queries in page model/API?
- Are widgets used only for large reusable/independent blocks?
- Are one-page blocks kept inside the page instead of over-abstracted into widgets?

## Effector model structure

- Are models split by responsibility, not `stores/events/effects` buckets?
- Are public `$$model` shapes exposed only when useful?
- Are factories defined and instantiated at correct ownership boundaries?
- Is `appStarted` in `app/model` and page startup in page model?
- Are integration effects connected from startup events instead of free-floating helper chains?

## Farfetched

- Are reusable entity reads in `entities/<entity>/api`?
- Are action mutations in `features/<action>/api`?
- Are page-only reads in `pages/<page>/api`?
- Are contracts owned by the domain/action/page they validate?
- Is there no global `shared/contracts` business dump?
- Are session-aware barriers outside `shared`?
- If a barrier is applied to many operations, is that composition in `app`?
- Are route loaders placed in page route/model files?

## Routing and Next.js

- Is Atomic Router config in `app/routes`?
- Are protected route compositions in `app/routes` or page routes?
- Are redirects absent from shared API code?
- Are framework routes thin adapters to FSD pages/models?
- In Next.js, are FSD `app`/`pages` renamed to `_app`/`_pages` or otherwise clearly separated?
- Are server-only public APIs separated with `index.server.ts` when needed?

## Tooling

- Is Steiger configured when the team wants automated FSD enforcement?
- Are exceptions documented near config or architecture decision records?
- Are disabled Steiger rules temporary and justified?
- Is ESLint also enforcing Effector-specific rules via `eslint-plugin-effector`?
