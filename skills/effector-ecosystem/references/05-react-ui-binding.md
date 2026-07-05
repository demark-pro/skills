# React UI binding

## Default hook

Use `useUnit` from `effector-react`.

```tsx
const { value, changed, submitted, pending } = useUnit({
  value: $value,
  changed,
  submitted,
  pending: mutation.$pending,
});
```

## Component responsibilities

UI may:

- render values
- call events
- call query/mutation starters exposed by the model
- pass callbacks to UI primitives

UI must not:

- create units
- call `sample`
- call API directly
- call `$store.getState()`
- contain domain workflow orchestration
- decide cross-feature side effects

## Component categories

### Shared UI primitive

Path:

```txt
shared/ui/button/button.tsx
shared/ui/input/input.tsx
shared/ui/dialog/dialog.tsx
```

Properties:

- domain-independent
- no Effector unless it is purely generic and justified
- no app-specific imports

### Entity visual

Path:

```txt
entities/user/ui/user-avatar.tsx
entities/product/ui/product-price.tsx
```

Properties:

- represents a domain entity
- accepts domain data or minimal props
- no feature/page logic

### Feature UI

Path:

```txt
features/profile-update/ui/profile-update-form.tsx
```

Properties:

- connected to feature model
- represents a user action
- may import entity visuals and shared UI

### Page UI

Path:

```txt
pages/profile/ui/profile-page.tsx
```

Properties:

- assembles widgets/features/entities
- connects page model if needed
- delegates behavior to model

## Example

```tsx
import { useUnit } from 'effector-react';
import { Button } from '@/shared/ui/button';
import { $$profileUpdate } from '../model/profile-update.model';

export function ProfileUpdateForm() {
  const vm = useUnit($$profileUpdate);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      vm.formSubmitted();
    }}>
      <input
        value={vm.name}
        onChange={(event) => vm.nameChanged(event.target.value)}
      />

      <Button disabled={vm.submitDisabled || vm.pending}>
        Save
      </Button>
    </form>
  );
}
```

The component adapts DOM events to model events. It does not decide business flow.
