import Web3 from 'web3/types';
import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {ThunkDispatch} from 'redux-thunk';
import {Action} from 'redux';

import {Web3State} from './enums';

export type EnvironmentName = 'localhost' | 'development' | 'production';

export type SmartContractItem = {
  instance: Web3Contract;
  abi: AbiItem[];
  contractAddress: string;
};

export type SmartContracts = {
  NFTFactory: SmartContractItem;
  NFT: SmartContractItem;
};

export interface BlockchainState {
  connectedAddress?: string | null;
  contracts?: SmartContracts;
  defaultChain: number;
  walletAuthenticated: boolean;
  web3Instance?: Web3;
  web3Signature?: string;
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
