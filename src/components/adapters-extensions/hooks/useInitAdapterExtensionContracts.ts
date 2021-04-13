import {useDispatch} from 'react-redux';

import {
  initContractBankAdapter,
  initContractConfiguration,
  initContractCouponOnboarding,
  initContractDistribute,
  initContractFinancing,
  initContractGuildKick,
  initContractManaging,
  initContractNFTAdapter,
  initContractNFTExtension,
  initContractOnboarding,
  initContractRagequit,
  initContractTribute,
  initContractTributeNFT,
  initRegisteredVotingAdapter,
} from '../../../store/actions';

import {ReduxDispatch} from '../../../store/types';
import {DaoAdapterConstants, DaoExtensionConstants} from '../enums';

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
      case DaoAdapterConstants.CONFIGURATION:
        await dispatch(initContractConfiguration(web3Instance));
        break;
      case DaoAdapterConstants.FINANCING:
        await dispatch(initContractFinancing(web3Instance));
        break;
      case DaoAdapterConstants.GUILDKICK:
        await dispatch(initContractGuildKick(web3Instance));
        break;
      case DaoAdapterConstants.MANAGING:
        await dispatch(initContractManaging(web3Instance));
        break;
      case DaoAdapterConstants.RAGEQUIT:
        await dispatch(initContractRagequit(web3Instance));
        break;
      case DaoAdapterConstants.BANK:
        await dispatch(initContractBankAdapter(web3Instance));
        break;
      case DaoExtensionConstants.NFT:
        await dispatch(initContractNFTExtension(web3Instance));
        break;
      case DaoAdapterConstants.ONBOARDING:
        await dispatch(initContractOnboarding(web3Instance));
        break;
      case DaoAdapterConstants.TRIBUTE:
        await dispatch(initContractTribute(web3Instance));
        break;
      case DaoAdapterConstants.DISTRIBUTE:
        await dispatch(initContractDistribute(web3Instance));
        break;
      case DaoAdapterConstants.VOTING:
        await dispatch(initRegisteredVotingAdapter(web3Instance));
        break;
      case DaoAdapterConstants.COUPON_ONBOARDING:
        await dispatch(initContractCouponOnboarding(web3Instance));
        break;
      case DaoAdapterConstants.TRIBUTE_NFT:
        await dispatch(initContractTributeNFT(web3Instance));
        break;
      case DaoAdapterConstants.NFT:
        await dispatch(initContractNFTAdapter(web3Instance));
        break;
    }
  }

  return {
    initAdapterExtensionContract,
  };
}
