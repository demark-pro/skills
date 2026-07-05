import { combine, createEvent, createStore, sample } from 'effector';

export const pageOpened = createEvent();
export const valueChanged = createEvent<string>();
export const submitted = createEvent();

export const $value = createStore('')
  .on(valueChanged, (_, value) => value);

export const $submitDisabled = $value.map((value) => value.trim().length === 0);

sample({
  clock: submitted,
  source: $value,
  filter: $submitDisabled.map((disabled) => !disabled),
  // target: mutation.start,
});

export const $vm = combine({
  value: $value,
  submitDisabled: $submitDisabled,
});

export const $$model = {
  value: $value,
  submitDisabled: $submitDisabled,
  valueChanged,
  submitted,
};
