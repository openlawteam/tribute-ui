import {ThunkDispatch} from 'redux-thunk';
import {Action} from 'redux';

import {SmartContracts, Web3State} from '../components/web3/types';

/**
 * FOR HIGH REUSE TYPES
 *
 * For any other more specific types, co-locate them in either:
 *
 * 1) The actual code file.
 * 2) In a type file in the location of the code files which mainly use the types.
 *
 * @see https://kentcdodds.com/blog/colocation
 */

export type EnvironmentName = 'localhost' | 'development' | 'production';

export interface BlockchainState {
  connectedAddress?: string;
  contracts?: SmartContracts;
  web3State?: Web3State;
}

export type StoreState = {
  blockchain: BlockchainState;
};

// HELPERS

/**
 * Used when using useDispatch hook.
 *
 * e.g. useDispatch<ReduxDispatch>();
 *
 * @see https://www.reddit.com/r/typescript/comments/c04mjt/how_to_type_reduxthunks_with_the_new_usedispatch/
 */
export type ReduxDispatch = ThunkDispatch<StoreState, any, Action>;

export interface MetaMaskRPCError extends Error {
  code: number;
}
