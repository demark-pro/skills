import { combine, createEvent, createStore, sample } from 'effector';

export type FormValues = {
  name: string;
  email: string;
};

export const nameChanged = createEvent<string>();
export const emailChanged = createEvent<string>();
export const formSubmitted = createEvent();
export const formReset = createEvent();

export const $name = createStore('')
  .on(nameChanged, (_, value) => value)
  .reset(formReset);

export const $email = createStore('')
  .on(emailChanged, (_, value) => value)
  .reset(formReset);

export const $values = combine({
  name: $name,
  email: $email,
});

export const $errors = combine($values, ({ name, email }) => ({
  name: name.trim() ? null : 'Required',
  email: email.includes('@') ? null : 'Invalid email',
}));

export const $isValid = $errors.map((errors) =>
  Object.values(errors).every((error) => error === null),
);

sample({
  clock: formSubmitted,
  source: $values,
  filter: $isValid,
  // target: mutation.start,
});

export const $$form = {
  name: $name,
  email: $email,
  errors: $errors,
  isValid: $isValid,
  nameChanged,
  emailChanged,
  formSubmitted,
  formReset,
};
