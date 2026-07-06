import { createJsonMutation, declareParams, concurrency } from '@farfetched/core';
import { apiUrl } from '@/shared/api/base-url';
import { mapRemoteError } from '@/shared/api/errors';
import { ResourceContract, mapResourceDto } from '../model/resource.contract';

export type UpdateResourceParams = {
  id: string;
  values: {
    name: string;
  };
};

export const updateResourceMutation = createJsonMutation({
  params: declareParams<UpdateResourceParams>(),
  request: {
    method: 'PATCH',
    url: ({ id }) => apiUrl(`/resources/${id}`),
    body: ({ values }) => values,
    // fetch: { credentials: 'include' },
  },
  response: {
    contract: ResourceContract,
    mapData: ({ result }) => mapResourceDto(result),
    mapError: ({ error }) => mapRemoteError(error),
  },
});

// Prevent accidental duplicate submits while one mutation is already running.
concurrency(updateResourceMutation, { strategy: 'TAKE_FIRST' });
