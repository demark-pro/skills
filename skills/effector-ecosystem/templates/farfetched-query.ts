import { createJsonQuery, declareParams, concurrency } from '@farfetched/core';
import { apiUrl } from '@/shared/api/base-url';
import { ResourceContract } from '../model/resource.contract';

export type ResourceQueryParams = {
  id: string;
};

export const resourceQuery = createJsonQuery({
  params: declareParams<ResourceQueryParams>(),
  request: {
    method: 'GET',
    url: ({ id }) => apiUrl(`/resources/${id}`),
  },
  response: {
    contract: ResourceContract,
  },
});

concurrency(resourceQuery, { strategy: 'TAKE_LATEST' });
