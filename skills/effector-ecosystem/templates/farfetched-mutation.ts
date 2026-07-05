import { createJsonMutation, declareParams } from '@farfetched/core';
import { apiUrl } from '@/shared/api/base-url';
import { ResourceContract } from '../model/resource.contract';

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
  },
  response: {
    contract: ResourceContract,
  },
});
