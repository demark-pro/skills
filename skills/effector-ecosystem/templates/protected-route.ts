import {
  chainRoute,
  type RouteInstance,
  type RouteParams,
  type RouteParamsAndQuery,
} from 'atomic-router';
import { createEvent, createStore, merge, sample } from 'effector';
import { currentSessionQuery, $sessionState } from '@/entities/session';

export function chainAuthenticated<Params extends RouteParams>(route: RouteInstance<Params>) {
  const sessionCheckStarted = createEvent<RouteParamsAndQuery<Params>>();

  const $pendingAttempt = createStore<RouteParamsAndQuery<Params> | null>(null)
    .on(sessionCheckStarted, (_, attempt) => attempt);

  const alreadyAuthenticated = sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'authenticated'),
  });

  sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'unknown'),
    fn: () => undefined,
    target: currentSessionQuery.start,
  });

  const authenticatedAfterRestore = sample({
    clock: currentSessionQuery.finished.success,
    source: $pendingAttempt,
    filter: (attempt) => attempt !== null,
    fn: (attempt) => attempt!,
  });

  const knownAnonymous = sample({
    clock: sessionCheckStarted,
    filter: $sessionState.map((state) => state === 'anonymous'),
  });

  const restoreFailed = sample({
    clock: currentSessionQuery.finished.failure,
    source: $pendingAttempt,
    filter: (attempt) => attempt !== null,
    fn: (attempt) => attempt!,
  });

  const rejected = merge([knownAnonymous, restoreFailed]);

  $pendingAttempt.reset([alreadyAuthenticated, authenticatedAfterRestore, rejected, route.closed]);

  return {
    route: chainRoute({
      route,
      beforeOpen: sessionCheckStarted,
      openOn: [alreadyAuthenticated, authenticatedAfterRestore],
      cancelOn: rejected,
    }),
    rejected,
  };
}
