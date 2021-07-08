import {waitFor} from '@testing-library/react';

import {
  DEFAULT_ETH_ADDRESS,
  getNewStore,
  getWeb3Instance,
} from '../../test/helpers';
import {BURN_ADDRESS} from '../../util/constants';
import {clearConnectedMember, getConnectedMember} from './actions';
import {initContractDaoRegistry} from '../actions';

describe('connectedMember actions unit tests', () => {
  test('"getConnectedMember" can set correct "connectedMember" when active member', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '1'),
            // For `isActiveMember` call
            web3.eth.abi.encodeParameter('bool', true),
            // For `getCurrentDelegateKey` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
          ],
        ]
      )
    );

    // Dispatch `getConnectedMember`
    store.dispatch(
      getConnectedMember({
        account: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
        daoRegistryContract: store.getState().contracts.DaoRegistryContract,
      })
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isAddressDelegated: false,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
      });
    });
  });

  test('"getConnectedMember" can set correct "connectedMember" when active member and delegated', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    const delegateAddress: string =
      '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';

    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '1'),
            // For `isActiveMember` call
            web3.eth.abi.encodeParameter('bool', true),
            // For `getCurrentDelegateKey` call
            web3.eth.abi.encodeParameter('address', delegateAddress),
          ],
        ]
      )
    );

    // Dispatch `getConnectedMember`
    store.dispatch(
      getConnectedMember({
        account: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
        daoRegistryContract: store.getState().contracts.DaoRegistryContract,
      })
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: delegateAddress,
        isAddressDelegated: true,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
      });
    });
  });

  test('"getConnectedMember" can set correct "connectedMember" when non-active member', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '1'),
            // For `isActiveMember` call
            web3.eth.abi.encodeParameter('bool', false),
            // For `getCurrentDelegateKey` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
          ],
        ]
      )
    );

    // Dispatch `getConnectedMember`
    store.dispatch(
      getConnectedMember({
        account: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
        daoRegistryContract: store.getState().contracts.DaoRegistryContract,
      })
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isAddressDelegated: false,
        isActiveMember: false,
        memberAddress: DEFAULT_ETH_ADDRESS,
      });
    });
  });

  test('"getConnectedMember" can set correct "connectedMember" when not a member', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '0'),
            // For `isActiveMember` call
            web3.eth.abi.encodeParameter('bool', false),
            // For `getCurrentDelegateKey` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
          ],
        ]
      )
    );

    // Dispatch `getConnectedMember`
    store.dispatch(
      getConnectedMember({
        account: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
        daoRegistryContract: store.getState().contracts.DaoRegistryContract,
      })
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: BURN_ADDRESS,
        isAddressDelegated: false,
        isActiveMember: false,
        memberAddress: BURN_ADDRESS,
      });
    });
  });

  test('"getConnectedMember" can set "connectedMember" to "null" on error', async () => {
    const store = getNewStore();
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '1'),
          ],
        ]
      )
    );

    // Inject error response
    mockWeb3Provider.injectError({
      code: 1234,
      message: 'Some error',
    });

    let thrownError: Error;

    try {
      // Dispatch `getConnectedMember`
      await store.dispatch(
        getConnectedMember({
          account: DEFAULT_ETH_ADDRESS,
          web3Instance: web3,
          daoRegistryContract: store.getState().contracts.DaoRegistryContract,
        })
      );
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

    await waitFor(() => {
      expect(store.getState().contracts.DaoRegistryContract).not.toBe(null);
    });

    // Setup for `getConnectedMember`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getAddressIfDelegated` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
            // For `members` call
            web3.eth.abi.encodeParameter('uint8', '1'),
            // For `isActiveMember` call
            web3.eth.abi.encodeParameter('bool', true),
            // For `getCurrentDelegateKey` call
            web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
          ],
        ]
      )
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toBe(null);
    });

    // Dispatch `getConnectedMember`
    store.dispatch(
      getConnectedMember({
        account: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
        daoRegistryContract: store.getState().contracts.DaoRegistryContract,
      })
    );

    await waitFor(() => {
      expect(store.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isAddressDelegated: false,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
      });
    });

    // Dispatch `clearConnectedMember`
    store.dispatch(clearConnectedMember());

    await waitFor(() => {
      expect(store.getState().connectedMember).toBe(null);
    });
  });
});
