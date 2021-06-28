/**
 * Tribute
 */

import {graphql} from 'msw';

import {
  daoResponse,
  adaptersAndExtensionsResponse,
  tokenHolderBalancesResponse,
} from './gqlResponses';

/**
 * Tribute DAO
 */

const dao = graphql.query('GetDao', (_, res, ctx) => {
  return res(ctx.data({...daoResponse}));
});

/**
 * Adapters & Extensions
 */

const adaptersAndExtensions = graphql.query(
  'GetAdaptersAndExtensions',
  (_, res, ctx) => {
    return res(ctx.data({...adaptersAndExtensionsResponse}));
  }
);

/**
 * Token Holder Balances
 */

const tokenHolderBalances = graphql.query(
  'GetTokenHolderBalances',
  (_, res, ctx) => {
    return res(ctx.data({...tokenHolderBalancesResponse}));
  }
);

/**
 * Build handlers export array
 */

const handlers = [dao, adaptersAndExtensions, tokenHolderBalances];

export {handlers};
