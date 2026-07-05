import { createRoute } from 'atomic-router';
import { sample } from 'effector';

export const pageRoute = createRoute();

export const pageOpened = pageRoute.opened;
export const pageClosed = pageRoute.closed;

sample({
  clock: pageRoute.opened,
  // target: pageQuery.start,
});
