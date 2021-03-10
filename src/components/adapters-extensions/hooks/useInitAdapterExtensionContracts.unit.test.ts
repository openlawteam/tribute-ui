import {renderHook, act} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';

import {useInitAdapterExtensionContracts} from './useInitAdapterExtensionContracts';

import {
  CONTRACT_BANK_EXTENSION,
  CONTRACT_CONFIGURATION,
  CONTRACT_DISTRIBUTE,
  CONTRACT_FINANCING,
  CONTRACT_GUILDKICK,
  CONTRACT_MANAGING,
  CONTRACT_ONBOARDING,
  CONTRACT_RAGEQUIT,
  CONTRACT_TRIBUTE,
  CONTRACT_VOTING,
  CONTRACT_WITHDRAW,
} from '../../../store/actions';

import Wrapper from '../../../test/Wrapper';

describe('useInitAdapterExtensionContracts unit tests', () => {
  test('should use initAdapterExtensionContract', async () => {
    const {result} = await renderHook(
      () => useInitAdapterExtensionContracts(),
      {
        initialProps: {
          useInit: true,
        },
        wrapper: Wrapper,
      }
    );

    expect(result.current.initAdapterExtensionContract).toBeInstanceOf(
      Function
    );
  });

  test('should return correct data when no adapters/extension', async () => {
    await act(async () => {
      let reduxStore: any;

      const {result} = await renderHook(
        () => useInitAdapterExtensionContracts(),
        {
          initialProps: {
            getProps: ({store}) => {
              reduxStore = store;
            },
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      // Assert initial state
      expect(result.current.initAdapterExtensionContract).toBeInstanceOf(
        Function
      );

      await waitFor(() => {
        expect(reduxStore.getState().contracts).not.toBeNull();
        expect(
          reduxStore.getState().contracts.BankExtensionContract
        ).toBeNull();
        expect(
          reduxStore.getState().contracts.ConfigurationContract
        ).toBeNull();
        expect(reduxStore.getState().contracts.DistributeContract).toBeNull();
        expect(reduxStore.getState().contracts.FinancingContract).toBeNull();
        expect(reduxStore.getState().contracts.GuildBankContract).toBeNull();
        expect(reduxStore.getState().contracts.ManagingContract).toBeNull();
        expect(reduxStore.getState().contracts.OnboardingContract).toBeNull();
        expect(reduxStore.getState().contracts.RagequitContract).toBeNull();
        expect(reduxStore.getState().contracts.TributeContract).toBeNull();
        expect(reduxStore.getState().contracts.VotingContract).toBeNull();
        expect(reduxStore.getState().contracts.WithdrawContract).toBeNull();
      });

      reduxStore.dispatch({
        type: CONTRACT_BANK_EXTENSION,
      });
      reduxStore.dispatch({
        type: CONTRACT_CONFIGURATION,
      });
      reduxStore.dispatch({
        type: CONTRACT_DISTRIBUTE,
      });
      reduxStore.dispatch({
        type: CONTRACT_FINANCING,
      });
      reduxStore.dispatch({
        type: CONTRACT_GUILDKICK,
      });
      reduxStore.dispatch({
        type: CONTRACT_MANAGING,
      });
      reduxStore.dispatch({
        type: CONTRACT_ONBOARDING,
      });
      reduxStore.dispatch({
        type: CONTRACT_RAGEQUIT,
      });
      reduxStore.dispatch({
        type: CONTRACT_VOTING,
      });
      reduxStore.dispatch({
        type: CONTRACT_TRIBUTE,
      });
      reduxStore.dispatch({
        type: CONTRACT_WITHDRAW,
      });

      expect(
        reduxStore.getState().contracts.BankExtensionContract
      ).not.toBeNull();
      expect(
        reduxStore.getState().contracts.ConfigurationContract
      ).not.toBeNull();
      expect(reduxStore.getState().contracts.DistributeContract).not.toBeNull();
      expect(reduxStore.getState().contracts.FinancingContract).not.toBeNull();
      expect(reduxStore.getState().contracts.GuildBankContract).not.toBeNull();
      expect(reduxStore.getState().contracts.ManagingContract).not.toBeNull();
      expect(reduxStore.getState().contracts.OnboardingContract).not.toBeNull();
      expect(reduxStore.getState().contracts.RagequitContract).not.toBeNull();
      expect(reduxStore.getState().contracts.TributeContract).not.toBeNull();
      expect(reduxStore.getState().contracts.VotingContract).not.toBeNull();
      expect(reduxStore.getState().contracts.WithdrawContract).not.toBeNull();
    });
  });
});
