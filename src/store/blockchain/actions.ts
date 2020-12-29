import Web3 from 'web3';
import {Dispatch} from 'redux';

import {Web3State} from '../../util/enums';
import DaoRegistry from '../../truffle-contracts/DaoRegistry.json';
import FinancingContract from '../../truffle-contracts/FinancingContract.json';
import OffchainVotingContract from '../../truffle-contracts/OffchainVotingContract.json';
import OnboardingContract from '../../truffle-contracts/OnboardingContract.json';

export const BLOCKCHAIN_CONTRACTS = 'BLOCKCHAIN_CONTRACTS';
export const BLOCKCHAIN_WALLET_AUTHENTICATED =
  'BLOCKCHAIN_WALLET_AUTHENTICATED';
export const BLOCKCHAIN_WEB3_INSTANCE = 'BLOCKCHAIN_WEB3_INSTANCE';
export const BLOCKCHAIN_WEB3_STATE = 'BLOCKCHAIN_WEB3_STATE';
export const CONNECTED_ADDRESS = 'CONNECTED_ADDRESS';

export function initContractDaoRegistry(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const networkId = await web3Instance.eth.net.getId();
        const daoRegistryContract: Record<string, any> = DaoRegistry;
        const deployedNetwork: any = daoRegistryContract.networks[networkId];
        const contractAddress = deployedNetwork.address;
        const instance = new web3Instance.eth.Contract(
          daoRegistryContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            NFTFactory: {
              abi: daoRegistryContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initContractFinancing(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const networkId = await web3Instance.eth.net.getId();
        const financingContract: Record<string, any> = FinancingContract;
        const deployedNetwork: any = financingContract.networks[networkId];
        const contractAddress = deployedNetwork.address;
        const instance = new web3Instance.eth.Contract(
          financingContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            NFTFactory: {
              abi: financingContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initContractOffchainVoting(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const networkId = await web3Instance.eth.net.getId();
        const offchainVotingContract: Record<
          string,
          any
        > = OffchainVotingContract;
        const deployedNetwork: any = offchainVotingContract.networks[networkId];
        const contractAddress = deployedNetwork.address;
        const instance = new web3Instance.eth.Contract(
          offchainVotingContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            NFTFactory: {
              abi: offchainVotingContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initContractOnboarding(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const networkId = await web3Instance.eth.net.getId();
        const onboardingContract: Record<string, any> = OnboardingContract;
        const deployedNetwork: any = onboardingContract.networks[networkId];
        const contractAddress = deployedNetwork.address;
        const instance = new web3Instance.eth.Contract(
          onboardingContract.abi,
          contractAddress
        );

        dispatch({
          type: BLOCKCHAIN_CONTRACTS,
          contracts: {
            NFTFactory: {
              abi: onboardingContract.abi,
              contractAddress,
              instance,
            },
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export function initWeb3Instance(instance: Web3) {
  return {
    type: BLOCKCHAIN_WEB3_INSTANCE,
    web3Instance: instance,
  };
}

/**
 * setConnectedAddress
 *
 * @param {string} selectedAddress
 *
 */
export function setConnectedAddress(selectedAddress: string | null) {
  return async function (dispatch: any) {
    dispatch({type: CONNECTED_ADDRESS, connectedAddress: selectedAddress});
    dispatch(
      selectedAddress
        ? web3State(Web3State.Connected)
        : web3State(Web3State.Locked)
    );
  };
}

export function walletAuthenticated(isAuthenticated: boolean) {
  return {
    type: BLOCKCHAIN_WALLET_AUTHENTICATED,
    walletAuthenticated: isAuthenticated,
  };
}

export function web3State(web3State: string) {
  return {
    type: BLOCKCHAIN_WEB3_STATE,
    web3State,
  };
}
