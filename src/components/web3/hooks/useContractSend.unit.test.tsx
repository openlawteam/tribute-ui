import {waitFor} from '@testing-library/react';

import * as useWeb3ModalToMock from './useWeb3Modal';
import {CHAINS as mockChains} from '../../../config';
// @note We rename `CHAINS->mockChains` due to Jest rule in `mockImplementation`.
import {getWeb3Instance, setupHook} from '../../../test/helpers';
import {useContractSend} from '.';
import {Web3TxStatus} from '../types';

describe('useContractSend unit tests', () => {
  test('should return correct data', async () => {
    // // @note We rename `web3->mockWeb3` due to Jest rule in `mockImplementation`.
    // const {web3: mockWeb3, mockWeb3Provider} = getWeb3Instance();

    // jest
    //   .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
    //   .mockImplementationOnce(() => ({
    //     account: '0x0',
    //     connected: true,
    //     providerOptions: {},
    //     onConnectTo: () => {},
    //     onDisconnect: () => {},
    //     networkId: mockChains['GANACHE'],
    //     provider: mockWeb3Provider,
    //     web3Instance: mockWeb3,
    //     web3Modal: null,
    //   }));

    // console.log('useWeb3Modal', useWeb3ModalToMock.useWeb3Modal);

    const result = setupHook({
      hook: useContractSend,
      hookArgs: [null],
      wrapperProps: {
        useInit: true,
        useWallet: true,
      },
    }) as ReturnType<typeof useContractSend>;

    // assert initial state
    expect(result.txError).toBe(undefined);
    expect(result.txEtherscanURL).toBe('');
    expect(result.txIsPromptOpen).toBe(false);
    expect(result.txReceipt).toBe(undefined);
    expect(result.txSend).toBeInstanceOf(Function);
    expect(result.txStatus).toBe(Web3TxStatus.STANDBY);

    // assert result txSend
    // await waitFor(async () => {
    //   const cool = await result.txSend(
    //     'test',
    //     undefined,
    //     undefined,
    //     undefined,
    //     () => {}
    //   );

    //   console.log('vool', cool);

    //   expect(result.txError).toBe(undefined);
    // });
  });

  test('should return correct datass', async () => {
    console.log('useWeb3Modal', useWeb3ModalToMock.useWeb3Modal);
    const result = setupHook({
      hook: useContractSend,
      hookArgs: [null],
      wrapperProps: {
        useInit: true,
        useWallet: true,
      },
    }) as ReturnType<typeof useContractSend>;
    console.log('useWeb3Modal', useWeb3ModalToMock.useWeb3Modal);

    // assert initial state
    expect(result.txError).toBe(undefined);
    expect(result.txEtherscanURL).toBe('');
    expect(result.txIsPromptOpen).toBe(false);
    expect(result.txReceipt).toBe(undefined);
    expect(result.txSend).toBeInstanceOf(Function);
    expect(result.txStatus).toBe(Web3TxStatus.STANDBY);

    // assert result txSend
    // await waitFor(async () => {
    //   const cool = await result.txSend(
    //     'test',
    //     undefined,
    //     undefined,
    //     undefined,
    //     () => {}
    //   );

    //   console.log('vool', cool);

    //   expect(result.txError).toBe(undefined);
    // });
  });
});
