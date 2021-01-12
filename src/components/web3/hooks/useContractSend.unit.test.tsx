import {waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../../../test/web3Responses';
import {DEFAULT_ETH_ADDRESS, setupHook} from '../../../test/helpers';
import {useContractSend} from '.';
import {Web3TxStatus} from '../types';

describe('useContractSend unit tests', () => {
  test('should return correct data when calling txSend', async () => {
    /**
     * @note Not using our `setupHook` this to extract hook data, we will use `renderHook` for this hook test.
     *   But we still need access to a contract ABI to test `contractSend` properly.
     *   Hence, the access of the Redux `contract` state.
     */
    const {store, mockWeb3Provider, web3Instance} = setupHook({
      wrapperProps: {
        useInit: true,
        useWallet: true,
      },
    });

    await waitFor(() => {
      expect(store.getState().contracts.OnboardingContract).not.toBe(null);
    });

    const {result, waitForNextUpdate} = renderHook(() => useContractSend());

    const spyOnProcess = jest.fn();

    // assert initial state
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(false);
    expect(result.current.txReceipt).toBe(undefined);
    expect(result.current.txSend).toBeInstanceOf(Function);
    expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);

    // Call txSend
    act(() => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

      result.current.txSend(
        'onboard',
        store.getState().contracts.OnboardingContract?.instance.methods,
        [
          DEFAULT_ETH_ADDRESS,
          Web3.utils.sha3('Test Proposal ID'),
          DEFAULT_ETH_ADDRESS,
          DEFAULT_ETH_ADDRESS,
          Web3.utils.toWei('1', 'ether'),
        ],
        {
          from: DEFAULT_ETH_ADDRESS,
          value: Web3.utils.toWei('1', 'ether'),
        },
        spyOnProcess
      );
    });

    // assert awaiting confirmation state
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(true);
    expect(result.current.txReceipt).toBe(undefined);
    expect(result.current.txSend).toBeInstanceOf(Function);
    expect(result.current.txStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);

    await waitForNextUpdate();

    // assert pending state
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(false);
    expect(result.current.txReceipt).toBe(undefined);
    expect(result.current.txSend).toBeInstanceOf(Function);
    expect(result.current.txStatus).toBe(Web3TxStatus.PENDING);

    await waitForNextUpdate();

    // assert OK state
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(false);
    expect(result.current.txReceipt).toStrictEqual({
      blockHash:
        '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
      blockNumber: 11,
      contractAddress: null,
      cumulativeGasUsed: 13244,
      events: {},
      gasUsed: 1244,
      logsBloom: DEFAULT_ETH_ADDRESS,
      status: true,
      transactionHash:
        '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
      transactionIndex: 1,
    });
    expect(result.current.txSend).toBeInstanceOf(Function);
    expect(result.current.txStatus).toBe(Web3TxStatus.FULFILLED);

    // assert onProcess callback was called with txHash
    expect(spyOnProcess.mock.calls[0][0]).toBe(
      '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331'
    );
  });
});
