import {render, waitFor} from '@testing-library/react';

import {StoreState} from '../../../store/types';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import Wrapper from '../../../test/Wrapper';

describe('useInitContracts unit tests', () => {
  test('should load contracts into Redux when called', async () => {
    let reduxStore: {getState: () => StoreState} = {
      getState: () => ({} as any),
    };

    /**
     * @note We don't use `renderHook` to test `useInitContracts` as <Wrapper /> will call it via <Init />.
     *  Otherwise, it gets called at least 4 times, which we don't want.
     */
    render(
      <Wrapper
        useInit
        useWallet
        getProps={({store}) => {
          reduxStore = store;
        }}
      />
    );

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
      expect(reduxStore.getState().contracts.VotingContract?.abi).toBeTruthy();

      expect(
        reduxStore.getState().contracts.VotingContract?.contractAddress
      ).toBeTruthy();

      expect(
        reduxStore.getState().contracts.VotingContract?.adapterOrExtensionName
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
      expect(reduxStore.getState().contracts.TributeContract?.abi).toBeTruthy();

      expect(
        reduxStore.getState().contracts.TributeContract?.contractAddress
      ).toBeTruthy();

      expect(
        reduxStore.getState().contracts.TributeContract?.instance
      ).toBeTruthy();
    });

    // Distribute
    await waitFor(() => {
      expect(
        reduxStore.getState().contracts.DistributeContract?.abi
      ).toBeTruthy();

      expect(
        reduxStore.getState().contracts.DistributeContract?.contractAddress
      ).toBeTruthy();

      expect(
        reduxStore.getState().contracts.DistributeContract?.instance
      ).toBeTruthy();
    });
  });
});
