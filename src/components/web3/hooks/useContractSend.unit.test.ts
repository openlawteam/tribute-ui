import {waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {
  ethBlockNumber,
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../../../test/web3Responses';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {useContractSend} from '.';
import {Web3TxStatus} from '../types';
import Wrapper from '../../../test/Wrapper';
import {Store} from 'redux';

describe('useContractSend unit tests', () => {
  test('should return correct data when calling txSend', async () => {
    let store: Store;
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForNextUpdate} = await renderHook(
      () => useContractSend(),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            store = p.store;
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
      }
    );

    await act(async () => {
      // Wait for the contract used to in our test to be initialised
      await waitFor(() => {
        expect(store.getState().contracts.OnboardingContract).not.toBe(null);
      });

      const spyOnProcess = jest.fn();

      // Assert initial state
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);
      expect(result.current.txReceipt).toBe(undefined);
      expect(result.current.txSend).toBeInstanceOf(Function);
      expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);

      // Mock RPC responses
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

      // Call txSend
      result.current.txSend(
        'submitProposal',
        store.getState().contracts.OnboardingContract?.instance.methods,
        [
          DEFAULT_ETH_ADDRESS,
          Web3.utils.sha3('Test Proposal ID'),
          DEFAULT_ETH_ADDRESS,
          DEFAULT_ETH_ADDRESS,
          Web3.utils.toWei('1', 'ether'),
          [],
        ],
        {
          from: DEFAULT_ETH_ADDRESS,
        },
        spyOnProcess
      );

      // Assert awaiting confirmation state
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(true);
      expect(result.current.txReceipt).toBe(undefined);
      expect(result.current.txSend).toBeInstanceOf(Function);
      expect(result.current.txStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);

      await waitForNextUpdate();

      // Assert pending state
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);
      expect(result.current.txReceipt).toBe(undefined);
      expect(result.current.txSend).toBeInstanceOf(Function);
      expect(result.current.txStatus).toBe(Web3TxStatus.PENDING);

      await waitForNextUpdate();

      // Assert OK state
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

      // Assert onProcess callback was called with txHash
      expect(spyOnProcess.mock.calls[0][0]).toBe(
        '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331'
      );
    });
  });
});
