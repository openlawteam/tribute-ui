import {useDispatch} from 'react-redux';

import {
  initContractBankExtension,
  initContractDistribute,
  initContractManaging,
  initContractOnboarding,
  initContractConfiguration,
  initContractFinancing,
  initContractGuildKick,
  initContractRagequit,
  initContractTribute,
  initRegisteredVotingAdapter,
  initContractWithdraw,
} from '../../../store/actions';

import {ReduxDispatch} from '../../../store/types';
import {DaoConstants} from '../enums';

import {useWeb3Modal} from '../../web3/hooks';

type UseInitAdapterExtensionContractsReturn = {
  initAdapterExtensionContract: (adapterExtensionName: string) => void;
};

export function useInitAdapterExtensionContracts(): UseInitAdapterExtensionContractsReturn {
  /**
   * Our hooks
   */
  const {web3Instance} = useWeb3Modal();

  /**
   * Their hooks
   */
  const dispatch = useDispatch<ReduxDispatch>();

  async function initAdapterExtensionContract(adapterExtensionName: string) {
    switch (adapterExtensionName) {
      case DaoConstants.CONFIGURATION:
        await dispatch(initContractConfiguration(web3Instance));
        break;
      case DaoConstants.FINANCING:
        await dispatch(initContractFinancing(web3Instance));
        break;
      case DaoConstants.GUILDKICK:
        await dispatch(initContractGuildKick(web3Instance));
        break;
      case DaoConstants.MANAGING:
        await dispatch(initContractManaging(web3Instance));
        break;
      case DaoConstants.RAGEQUIT:
        await dispatch(initContractRagequit(web3Instance));
        break;
      case DaoConstants.WITHDRAW:
        await dispatch(initContractWithdraw(web3Instance));
        break;
      case DaoConstants.BANK:
        await dispatch(initContractBankExtension(web3Instance));
        break;
      case DaoConstants.ONBOARDING:
        await dispatch(initContractOnboarding(web3Instance));
        break;
      case DaoConstants.TRIBUTE:
        await dispatch(initContractTribute(web3Instance));
        break;
      case DaoConstants.DISTRIBUTE:
        await dispatch(initContractDistribute(web3Instance));
        break;
      case DaoConstants.VOTING:
        await dispatch(initRegisteredVotingAdapter(web3Instance));
        break;
    }
  }

  return {
    initAdapterExtensionContract,
  };
}
