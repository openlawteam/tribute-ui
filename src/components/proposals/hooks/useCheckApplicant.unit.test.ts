import {act, renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_DELEGATED_ADDRESS,
  FakeHttpProvider,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {GUILD_ADDRESS} from '../../../config';
import {useCheckApplicant} from './useCheckApplicant';
import Wrapper from '../../../test/Wrapper';

describe('useCheckApplicant unit tests', () => {
  test('should return correct data when applicant address is undefined', async () => {
    await act(async () => {
      const address = undefined;

      const {result} = await renderHook(() => useCheckApplicant(address), {
        initialProps: {
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        // assert initial state
        expect(result.current.checkApplicantError).toBe(undefined);
        expect(result.current.checkApplicantInvalidMsg).toBe(undefined);
        expect(result.current.checkApplicantStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.isApplicantValid).toBe(undefined);
      });
    });
  });

  test('should return correct data when applicant address is valid', async () => {
    await act(async () => {
      let mockWeb3Provider: FakeHttpProvider;
      let web3Instance: Web3;

      const address = DEFAULT_ETH_ADDRESS;

      const {result} = await renderHook(() => useCheckApplicant(address), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `isNotReservedAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `isNotZeroAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_ETH_ADDRESS
                ),
              ],
            ]
          )
        );
      });

      await waitFor(() => {
        // assert FULFILLED state
        expect(result.current.checkApplicantError).toBe(undefined);
        expect(result.current.checkApplicantInvalidMsg).toBe(undefined);
        expect(result.current.checkApplicantStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.isApplicantValid).toBe(true);
      });
    });
  });

  test('should return correct data when applicant address is reserved', async () => {
    await act(async () => {
      let mockWeb3Provider: FakeHttpProvider;
      let web3Instance: Web3;

      const address = GUILD_ADDRESS;

      const {result} = await renderHook(() => useCheckApplicant(address), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `isNotReservedAddress` call
                web3Instance.eth.abi.encodeParameter('bool', false),
                // For `isNotZeroAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter('address', GUILD_ADDRESS),
              ],
            ]
          )
        );
      });

      await waitFor(() => {
        // assert FULFILLED state
        expect(result.current.checkApplicantError).toBe(undefined);
        expect(result.current.checkApplicantInvalidMsg).toMatch(
          /The applicant address 0x00000...ead is invalid because it is a DAO reserved address\./i
        );
        expect(result.current.checkApplicantStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.isApplicantValid).toBe(false);
      });
    });
  });

  test('should return correct data when applicant address is address(0x0)', async () => {
    await act(async () => {
      let mockWeb3Provider: FakeHttpProvider;
      let web3Instance: Web3;

      const address = BURN_ADDRESS;

      const {result} = await renderHook(() => useCheckApplicant(address), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `isNotReservedAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `isNotZeroAddress` call
                web3Instance.eth.abi.encodeParameter('bool', false),
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter('address', BURN_ADDRESS),
              ],
            ]
          )
        );
      });

      await waitFor(() => {
        // assert FULFILLED state
        expect(result.current.checkApplicantError).toBe(undefined);
        expect(result.current.checkApplicantInvalidMsg).toMatch(
          /The applicant address 0x00000...000 is invalid\./i
        );
        expect(result.current.checkApplicantStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.isApplicantValid).toBe(false);
      });
    });
  });

  test('should return correct data when applicant address is already used as delegate key', async () => {
    await act(async () => {
      let mockWeb3Provider: FakeHttpProvider;
      let web3Instance: Web3;

      const address = DEFAULT_ETH_ADDRESS;

      const {result} = await renderHook(() => useCheckApplicant(address), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `isNotReservedAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `isNotZeroAddress` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_DELEGATED_ADDRESS
                ),
              ],
            ]
          )
        );
      });

      await waitFor(() => {
        // assert FULFILLED state
        expect(result.current.checkApplicantError).toBe(undefined);
        expect(result.current.checkApplicantInvalidMsg).toMatch(
          /The applicant address 0x04028...11D is already in use as a delegate key. The address must be removed as a delegate before it can become a member\./i
        );
        expect(result.current.checkApplicantStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.isApplicantValid).toBe(false);
      });
    });
  });
});
