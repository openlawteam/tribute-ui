import {waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, setupHook} from '../../../test/helpers';
import {ContractAdapterNames} from '../types';
import {getAdapterAddressFromContracts} from '.';

describe('getAdapterAddressFromContracts unit tests', () => {
  test('should return correct addresses', async () => {
    /**
     * @note Not using our `setupHook` this to extract hook data, we will use `renderHook` for this hook test.
     *   But we still need access to a contract ABI to test `contractSend` properly.
     *   Hence, the access of the Redux `contract` state.
     */
    const {store} = setupHook({
      wrapperProps: {
        useInit: true,
        useWallet: true,
      },
    });

    // Wait for contracts to load
    await waitFor(() => {
      Object.keys(store.getState().contracts).forEach((c) => {
        expect(store.getState().contracts[c]).not.toBeUndefined();
        expect(store.getState().contracts[c]).not.toBeNull();
      });
    });

    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.onboarding,
        store.getState().contracts
      )
    ).toBe(DEFAULT_ETH_ADDRESS);

    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.tribute,
        store.getState().contracts
      )
    ).toBe(DEFAULT_ETH_ADDRESS);

    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.distribute,
        store.getState().contracts
      )
    ).toBe(DEFAULT_ETH_ADDRESS);

    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.managing,
        store.getState().contracts
      )
    ).toBe(DEFAULT_ETH_ADDRESS);

    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.voting,
        store.getState().contracts
      )
    ).toBe(DEFAULT_ETH_ADDRESS);

    // @todo Need to implement Adapter
    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.configuration,
        store.getState().contracts
      )
    ).toBe('');

    // @todo Need to implement Adapter
    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.financing,
        store.getState().contracts
      )
    ).toBe('');

    // @todo Need to implement Adapter
    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.guildkick,
        store.getState().contracts
      )
    ).toBe('');

    // @todo Need to implement Adapter
    expect(
      getAdapterAddressFromContracts(
        ContractAdapterNames.ragequit,
        store.getState().contracts
      )
    ).toBe('');
  });
});
