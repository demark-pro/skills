# Source policy

Prefer official documentation and package repositories. For version-specific APIs, check current docs before answering.

## Primary sources

- Effector LLM source: https://effector.dev/en/llms-full.txt
- Effector docs: https://effector.dev
- Effector ecosystem: https://effector.dev/en/introduction/ecosystem/
- Effector best practices: https://effector.dev/en/guides/best-practices/
- Effector React `useUnit`: https://effector.dev/en/api/effector-react/useUnit/
- Effector Store API: https://effector.dev/en/api/effector/Store/
- Effector `sample`: https://effector.dev/en/api/effector/sample/
- Effector Scope/Fork API: https://effector.dev/en/api/effector/fork/
- Effector `scopeBind`: https://effector.dev/en/api/effector/scopeBind/
- Effector Babel/SWC plugins: https://effector.dev/en/api/effector/swc-plugin/
- `@effector/next`: https://github.com/effector/next

## Ecosystem sources

- Farfetched docs: https://ff.effector.dev
- Farfetched createJsonQuery: https://ff.effector.dev/api/factories/create_json_query
- Farfetched createJsonMutation: https://ff.effector.dev/api/factories/create_json_mutation
- Farfetched contracts: https://ff.effector.dev/tutorial/contracts
- Farfetched concurrency ADR/operator: https://ff.effector.dev/adr/concurrency
- Farfetched cache/refresh/update/barriers: https://ff.effector.dev/api/operators/cache, https://ff.effector.dev/api/operators/keep_fresh, https://ff.effector.dev/api/operators/update, https://ff.effector.dev/api/operators/apply_barrier
- With Ease contracts: https://withease.effector.dev/contracts/
- With Ease factories: https://withease.effector.dev/factories/
- With Ease i18next: https://withease.effector.dev/i18next/
- With Ease Web API: https://withease.effector.dev/web-api/
- Patronum docs: https://patronum.effector.dev
- Atomic Router docs: https://atomic-router.github.io
- Atomic Router + Farfetched integration: https://ff.effector.dev/api/routers/atomic-router
- effector-storage: https://github.com/yumauri/effector-storage
- effector-action: https://github.com/siberiacancode/effector-action
- effector-forms: https://github.com/42-px/effector-forms
- `@effector/reflect`: https://reflect.effector.dev
- `@withease/redux`: https://withease.effector.dev/redux/

## Architecture and tooling

- Feature-Sliced Design docs: https://feature-sliced.design
- FSD layers: https://feature-sliced.design/docs/reference/layers
- FSD public API: https://feature-sliced.design/docs/reference/public-api
- FSD cross-imports: https://feature-sliced.design/docs/guides/issues/cross-imports
- eslint-plugin-effector: https://eslint.effector.dev
- eslint-plugin-effector rules: https://eslint.effector.dev/rules/
- Steiger: https://github.com/feature-sliced/steiger

## Trust rules

- Use official docs over blog posts.
- Treat README examples as package-specific, not universal architecture advice.
- If docs conflict, prefer current package docs for API shape and Effector/FSD docs for architecture.
- Do not invent package APIs. If an API is not confirmed, describe the architectural approach and tell the user to check current package docs.
