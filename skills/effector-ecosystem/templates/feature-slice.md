# Feature slice template

Path:

```txt
features/<action-name>/
  index.ts
  ui/
    <action-name>.tsx
  model/
    <action-name>.model.ts
  api/
    <action-name>.mutation.ts
  lib/
```

Feature name must describe a user action or business capability:

```txt
profile-update
comment-create
session-login
theme-switch
file-upload
```

Not:

```txt
open-modal
set-form
fetch-user
```

## index.ts

```ts
export { FeatureComponent } from './ui/feature-component';
export { featureCompleted } from './model/feature.model';
```

Export only what other slices need.

## Connected UI rule

Connected feature UI should bind model units with one object/array `useUnit` shape:

```tsx
const { value, pending, onValueChange, onSubmit } = useUnit($$feature);
```

The model should expose a stable UI shape:

```ts
export const $$feature = {
  value: $value,
  pending: mutation.$pending,
  onValueChange: valueChanged,
  onSubmit: submitted,
};
```
