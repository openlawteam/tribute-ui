import {waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';

import {StoreState} from '../../../store/types';
import {useInitContracts} from './useInitContracts';
import Wrapper from '../../../test/Wrapper';
import {VotingAdapterName} from '../../adpaters/enums';

describe('useInitContracts unit tests', () => {
  test('should load contracts into Redux when called', async () => {
    await act(async () => {
      let reduxStore: {getState: () => StoreState} = {
        getState: () => ({} as any),
      };

      const {result} = await renderHook(() => useInitContracts(), {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          mockMetaMaskRequest: true,
          getProps: ({store, mockWeb3Provider, web3Instance}) => {
            reduxStore = store;
          },
        },
      });

      await result.current.initContracts();

      // DaoRegistry
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.DaoRegistryContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.DaoRegistryContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.DaoRegistryContract?.instance
        ).toBeTruthy();
      });

      // Managing
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.ManagingContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.ManagingContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.ManagingContract?.instance
        ).toBeTruthy();
      });

      // Voting
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.VotingContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.VotingContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.VotingContract?.adapterName
        ).toBe(VotingAdapterName.OffchainVotingContract);

        expect(
          reduxStore.getState().contracts.VotingContract?.instance
        ).toBeTruthy();
      });

      // Bank Extension
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.BankExtensionContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.BankExtensionContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.BankExtensionContract?.instance
        ).toBeTruthy();
      });

      // Onboarding
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.OnboardingContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.OnboardingContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.OnboardingContract?.instance
        ).toBeTruthy();
      });

      // Tribute
      await waitFor(() => {
        expect(
          reduxStore.getState().contracts.TributeContract?.abi
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.TributeContract?.contractAddress
        ).toBeTruthy();

        expect(
          reduxStore.getState().contracts.TributeContract?.instance
        ).toBeTruthy();
      });
    });
  });
});
