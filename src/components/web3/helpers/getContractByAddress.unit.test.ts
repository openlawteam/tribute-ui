import {waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, setupHook} from '../../../test/helpers';
import {getContractByAddress} from '.';
import {GUILD_ADDRESS} from '../../../config';

describe('getContractByAddress unit tests', () => {
  test('should return contract data', async () => {
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
        const contract = store.getState().contracts[c];

        expect(contract).not.toBeUndefined();
        expect(contract).not.toBeNull();
      });
    });

    const {contractAddress, abi, instance} = getContractByAddress(
      DEFAULT_ETH_ADDRESS,
      store.getState().contracts
    );

    expect(contractAddress).toBe(DEFAULT_ETH_ADDRESS);
    expect(Object.keys(abi).length).toBeGreaterThan(0);
    expect(Object.keys(instance).length).toBeGreaterThan(0);
  });

  test('should throw if contract not found', async () => {
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
        expect(c).not.toBeUndefined();
        expect(c).not.toBeNull();
      });
    });

    // Should throw if not found
    expect(() =>
      getContractByAddress(GUILD_ADDRESS, store.getState().contracts)
    ).toThrow();
  });
});
