/**
 * molochv3
 */

import {graphql} from 'msw';

import {daoResponse} from './gqlResponses';

const dao = graphql.query('molochv3', (req, res, ctx) => {
  const {id} = req.variables;

  return res(ctx.data({...daoResponse, id}));
});

/**
 * Build handlers export array
 */

const handlers = [dao];

export {handlers};
