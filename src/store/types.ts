import {Action} from 'redux';
import {ThunkDispatch} from 'redux-thunk';
import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

import {
  DaoAdapterConstants,
  DaoExtensionConstants,
  VotingAdapterName,
} from '../components/adapters-extensions/enums';

export type ContractsState = {
  BankExtensionContract: ContractsStateEntry | null;
  ConfigurationContract: ContractsStateEntry | null;
  DaoFactoryContract: ContractsStateEntry | null;
  DaoRegistryContract: ContractsStateEntry | null;
  DistributeContract: ContractsStateEntry | null;
  FinancingContract: ContractsStateEntry | null;
  GuildBankContract: ContractsStateEntry | null;
  ManagingContract: ContractsStateEntry | null;
  OnboardingContract: ContractsStateEntry | null;
  RagequitContract: ContractsStateEntry | null;
  TributeContract: ContractsStateEntry | null;
  VotingContract: ContractsStateEntry | null;
  WithdrawContract: ContractsStateEntry | null;
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

export type ContractsStateEntry = {
  /**
   * Web3 `Contract` instance
   */
  instance: Web3Contract;
  /**
   * Contract JSON ABI
   */
  abi: AbiItem[];
  /**
   * (Optional) Adapter/extension name, used for the Adapter/Extension Management
   */
  adapterOrExtensionName?:
    | DaoAdapterConstants
    | DaoExtensionConstants
    | VotingAdapterName;
  /**
   * Address of the instantiated contract
   */
  contractAddress: string;
};

/**
 * Used when using useDispatch hook.
 *
 * e.g. useDispatch<ReduxDispatch>();
 *
 * @see https://www.reddit.com/r/typescript/comments/c04mjt/how_to_type_reduxthunks_with_the_new_usedispatch/
 */
export type ReduxDispatch = ThunkDispatch<StoreState, any, Action>;
