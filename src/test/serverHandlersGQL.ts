/**
 * tribute
 */

import {graphql} from 'msw';

import {daoResponse} from './gqlResponses';

const dao = graphql.query('tribute', (req, res, ctx) => {
  const {id} = req.variables;

  return res(ctx.data({...daoResponse, id}));
});

/**
 * Build handlers export array
 */

const handlers = [dao];

export {handlers};
