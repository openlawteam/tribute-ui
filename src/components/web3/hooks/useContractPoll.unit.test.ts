import {AbiItem} from 'web3-utils/types';
import {renderHook, act} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';

import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {useContractPoll} from './useContractPoll';
import DAORegistryABI from '../../../abis/DaoRegistry.json';

describe('useContractPoll unit tests', () => {
  test('should poll contract', async () => {
    await act(async () => {
      const {result} = await renderHook(() =>
        useContractPoll({pollInterval: 200})
      );

      const {web3, mockWeb3Provider} = getWeb3Instance();
      const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
      const instance = new web3.eth.Contract(
        DAORegistryABI as AbiItem[],
        contractAddress
      );

      const injectResults: [string, string, string] = [
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 1}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 3}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 7}
        ),
      ];

      // Proposal exists
      mockWeb3Provider.injectResult(injectResults[0]);
      // Proposal sponsored
      mockWeb3Provider.injectResult(injectResults[1]);
      // Proposal processed
      mockWeb3Provider.injectResult(injectResults[2]);

      result.current.pollContract({
        methodArguments: [
          '0x5a9d036a3844896bb2285162165828356b17584d6d5f51f4cbfa91dd4187ae34',
        ],
        methodName: 'proposals',
        contractInstanceMethods: instance.methods,
      });

      await new Promise((r) => setTimeout(r, 0));

      // Assert initial result before first poll to be `injectResults[0]`
      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '1',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '1',
      });

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '7',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '7',
      });
    });
  });

  test('should stop polling contract when called', async () => {
    await act(async () => {
      const {result} = await renderHook(() =>
        useContractPoll({pollInterval: 200})
      );

      const {web3, mockWeb3Provider} = getWeb3Instance();
      const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
      const instance = new web3.eth.Contract(
        DAORegistryABI as AbiItem[],
        contractAddress
      );

      const injectResults: [string, string, string] = [
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 1}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 3}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 7}
        ),
      ];

      // Proposal exists
      mockWeb3Provider.injectResult(injectResults[0]);
      // Proposal sponsored
      mockWeb3Provider.injectResult(injectResults[1]);
      // Proposal processed
      mockWeb3Provider.injectResult(injectResults[2]);

      result.current.pollContract({
        methodArguments: [
          '0x5a9d036a3844896bb2285162165828356b17584d6d5f51f4cbfa91dd4187ae34',
        ],
        methodName: 'proposals',
        contractInstanceMethods: instance.methods,
      });

      await waitFor(() => {
        expect(result.current.pollContractData).toEqual({
          '0': DEFAULT_ETH_ADDRESS,
          '1': '1',
          adapterAddress: DEFAULT_ETH_ADDRESS,
          flags: '1',
        });
      });

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      // Stop polling
      result.current.stopPollingContract();

      await new Promise((r) => setTimeout(r, 250));

      // Assert result is same as last poll result, not `injectResults[2]`
      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });
    });
  });

  test('should not immediately call contract', async () => {
    await act(async () => {
      const {result} = await renderHook(() =>
        useContractPoll({pollInterval: 200, initialCallBeforeWait: false})
      );

      const {web3, mockWeb3Provider} = getWeb3Instance();
      const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
      const instance = new web3.eth.Contract(
        DAORegistryABI as AbiItem[],
        contractAddress
      );

      const injectResults: [string, string, string] = [
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 1}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 3}
        ),
        web3.eth.abi.encodeParameter(
          {
            Proposal: {
              adapterAddress: 'address',
              flags: 'uint256',
            },
          },
          {adapterAddress: DEFAULT_ETH_ADDRESS, flags: 7}
        ),
      ];

      // Proposal exists
      mockWeb3Provider.injectResult(injectResults[0]);
      // Proposal sponsored
      mockWeb3Provider.injectResult(injectResults[1]);
      // Proposal processed
      mockWeb3Provider.injectResult(injectResults[2]);

      result.current.pollContract({
        methodArguments: [
          '0x5a9d036a3844896bb2285162165828356b17584d6d5f51f4cbfa91dd4187ae34',
        ],
        methodName: 'proposals',
        contractInstanceMethods: instance.methods,
      });

      await new Promise((r) => setTimeout(r, 0));

      // Assert initial result before first poll to be `undefined`
      expect(result.current.pollContractData).toBe(undefined);

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '1',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '1',
      });

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.pollContractData).toEqual({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '7',
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '7',
      });
    });
  });
});
