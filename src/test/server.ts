import {graphql, rest} from 'msw';
import {setupServer} from 'msw/node';

import {handlers as handlersGQL} from './serverHandlersGQL';
import {handlers as handlersREST} from './serverHandlersREST';

const server = setupServer(...[...handlersREST, ...handlersGQL]);

export {server, graphql, rest};
