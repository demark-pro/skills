import { useUnit } from 'effector-react';
import { $$form } from '../model/form.model';

export function ConnectedForm() {
  const {
    name,
    email,
    errors,
    submitDisabled,
    nameChanged,
    emailChanged,
    formSubmitted,
  } = useUnit($$form);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        formSubmitted();
      }}
    >
      <input
        value={name}
        aria-invalid={Boolean(errors.name)}
        onChange={(event) => nameChanged(event.currentTarget.value)}
      />

      <input
        value={email}
        aria-invalid={Boolean(errors.email)}
        onChange={(event) => emailChanged(event.currentTarget.value)}
      />

      <button type="submit" disabled={submitDisabled}>
        Save
      </button>
    </form>
  );
}
