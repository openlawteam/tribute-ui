import {Action} from 'redux';
import {ThunkDispatch} from 'redux-thunk';
import {SmartContractItem} from '../components/web3/types';

export type ContractsState = {
  BankExtensionContract: SmartContractItem | null;
  DaoRegistryContract: SmartContractItem | null;
  OnboardingContract: SmartContractItem | null;
  OffchainVotingContract: SmartContractItem | null;
};

export type ConnectedMemberState = {
  delegateKey: string;
  isActiveMember: boolean;
  memberAddress: string;
} | null;

export type StoreState = {
  connectedMember: ConnectedMemberState;
  contracts: ContractsState;
};

/**
 * Used when using useDispatch hook.
 *
 * e.g. useDispatch<ReduxDispatch>();
 *
 * @see https://www.reddit.com/r/typescript/comments/c04mjt/how_to_type_reduxthunks_with_the_new_usedispatch/
 */
export type ReduxDispatch = ThunkDispatch<StoreState, any, Action>;
