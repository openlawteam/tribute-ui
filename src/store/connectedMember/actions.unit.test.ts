import {waitFor} from '@testing-library/react';

import {
  DEFAULT_ETH_ADDRESS,
  getNewStore,
  getWeb3Instance,
} from '../../test/helpers';
import {
  balanceOfMember,
  getCurrentDelegateKey,
  getMemberAddress,
  memberAddressesByDelegatedKey,
} from '../../test/web3Responses';
import {BURN_ADDRESS} from '../../util/constants';
import {clearConnectedMember, getConnectedMember} from './actions';
import {initContractBankExtension, initContractDaoRegistry} from '../actions';

describe('connectedMember actions unit tests', () => {
  test('"getConnectedMember" can set correct "connectedMember" state when shares > 0', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));
    store.dispatch(initContractBankExtension(web3, BURN_ADDRESS));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
      expect(store.getState().contracts.BankExtensionContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      ...memberAddressesByDelegatedKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(...balanceOfMember({web3Instance: web3}));
    mockWeb3Provider.injectResult(
      ...getCurrentDelegateKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(...getMemberAddress({web3Instance: web3}));

    // Dispatch `getConnectedMember`
    store.dispatch(getConnectedMember(DEFAULT_ETH_ADDRESS));

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
        isDAOCreator: true,
      });
    });
  });

  test('"getConnectedMember" can set correct "connectedMember" state when shares === 0', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));
    store.dispatch(initContractBankExtension(web3, BURN_ADDRESS));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
      expect(store.getState().contracts.BankExtensionContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      ...memberAddressesByDelegatedKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(
      ...balanceOfMember({
        result: web3.eth.abi.encodeParameter('uint160', 0),
        web3Instance: web3,
      })
    );
    mockWeb3Provider.injectResult(
      ...getCurrentDelegateKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(...getMemberAddress({web3Instance: web3}));

    // Dispatch `getConnectedMember`
    store.dispatch(getConnectedMember(DEFAULT_ETH_ADDRESS));

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isActiveMember: false,
        memberAddress: DEFAULT_ETH_ADDRESS,
        isDAOCreator: true,
      });
    });
  });

  test('"getConnectedMember" can set "connectedMember" to "null" on error', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));
    store.dispatch(initContractBankExtension(web3, BURN_ADDRESS));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
      expect(store.getState().contracts.BankExtensionContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      ...memberAddressesByDelegatedKey({web3Instance: web3})
    );

    mockWeb3Provider.injectResult(
      ...balanceOfMember({
        result: web3.eth.abi.encodeParameter('uint160', 0),
        web3Instance: web3,
      })
    );

    // Inject error response
    mockWeb3Provider.injectError({
      code: 1234,
      message: 'Some error',
    });

    let thrownError: Error;

    try {
      // Dispatch `getConnectedMember`
      await store.dispatch(getConnectedMember(DEFAULT_ETH_ADDRESS));
    } catch (error) {
      thrownError = error;
    }

    await waitFor(() => {
      expect(thrownError).toMatchObject({code: 1234, message: 'Some error'});
      expect(store.getState().connectedMember).toBe(null);
    });
  });

  test('"clearConnectedMember" can set "connectedMember" to "null"', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));
    store.dispatch(initContractBankExtension(web3, BURN_ADDRESS));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
      expect(store.getState().contracts.BankExtensionContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      ...memberAddressesByDelegatedKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(
      ...balanceOfMember({
        web3Instance: web3,
      })
    );
    mockWeb3Provider.injectResult(
      ...getCurrentDelegateKey({web3Instance: web3})
    );
    mockWeb3Provider.injectResult(...getMemberAddress({web3Instance: web3}));

    await waitFor(() => {
      expect(store.getState().connectedMember).toBe(null);
    });

    // Dispatch `getConnectedMember`
    store.dispatch(getConnectedMember(DEFAULT_ETH_ADDRESS));

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
        isDAOCreator: true,
      });
    });

    // Dispatch `clearConnectedMember`
    store.dispatch(clearConnectedMember());

    await waitFor(() => {
      expect(store.getState().connectedMember).toBe(null);
    });
  });
});
