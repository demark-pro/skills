# Review checklist

Use this checklist when reviewing code.

## FSD

- Does each slice have public API?
- Are external imports made through public API?
- Do imports go only downward by layer?
- Is `shared` free of business domain code?
- Are features real user actions, not technical events?
- Are page-specific filters/sorting/pagination kept in page model?
- Are reusable large blocks placed in widgets only when justified?

## Effector

- Are units created statically at module level?
- Is business logic outside React components?
- Is `sample` used for data flow?
- Is `watch` absent from business logic?
- Is `$store.getState()` absent from production logic?
- Are stores atomic enough?
- Is complex branching readable?
- Are events named as facts?

## Farfetched/contracts

- Are remote operations Farfetched queries/mutations?
- Are responses validated with contracts?
- Is DTO mapping isolated?
- Is query/mutation placed at the correct FSD layer?
- Is concurrency strategy intentional?
- Is cache update/refetch strategy correct?
- Is auth refresh centralized through barrier or shared API logic?

## React

- Does UI use `useUnit`?
- Does UI only render and send events?
- Are shared UI components domain-independent?
- Are entity visuals free of feature/page orchestration?

## Packages

- Is each package justified by purpose?
- Is there duplicated custom logic that Patronum/Farfetched already solves?
- Are lint plugins enabled?
- Are factory/SID requirements handled by build plugin?

## Red flags

- `src/api/users.ts` with business endpoint soup
- `src/store/index.ts` global model with all domains
- `shared/types/*.ts` full of domain types
- `features/*` named after UI events
- `watch` triggering effects
- `getState` inside effects
- `fetch` in React components
- contracts missing from backend responses
- direct imports from `model/`, `api/`, or `ui/` of another slice
