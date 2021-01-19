import {rest} from 'msw';
import {setupServer} from 'msw/node';

import {handlers as handlersREST} from './serverHandlersREST';

const server = setupServer(...[...handlersREST]);

export {server, rest};
