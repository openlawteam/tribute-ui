import Web3 from 'web3';

import {InjectResultOptions} from '../helpers/FakeHttpProvider';

export type TestWeb3ResponseArgs = {
  result?: any;
  web3Instance: Web3;
};

export type TestWeb3ResponseReturn<T> = [T, InjectResultOptions?];
