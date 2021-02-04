import {renderHook, act} from '@testing-library/react-hooks';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {usePrepareAndSignVoteData} from '.';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import Wrapper from '../../../test/Wrapper';
import {DEFAULT_DAO_REGISTRY_ADDRESS} from '../../../test/helpers';

describe('usePrepareAndSignVoteData unit tests', () => {
  test('should return correct data when calling prepareAndSignVoteData', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => usePrepareAndSignVoteData(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
            mockMetaMaskRequest: true,
          },
          wrapper: Wrapper,
        }
      );

      await new Promise((r) => {
        setTimeout(r, 1000);
      });

      // assert initial state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSignature).toBe('');

      // Call prepareAndSignVoteData
      act(() => {
        result.current.prepareAndSignVoteData(
          {choice: VoteChoices.Yes},
          ContractAdapterNames.onboarding,
          'abc123'
        );
      });

      // assert awaiting confirmation state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );
      expect(result.current.proposalSignature).toBe('');

      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const proposalDataUpdated = {
        ...result.current.proposalData,
        timestamp: now,
      };

      // assert pending state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(proposalDataUpdated).toStrictEqual({
        payload: {
          choice: 1,
          metadata: {
            memberAddress: '0x0000000000000000000000000000000000000000',
          },
          proposalHash: 'abc123',
        },
        space: 'thelao',
        timestamp: now,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'vote',
        version: '0.1.2',
      });
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.proposalSignature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );
    });
  });

  test('should return correct data when calling prepareAndSignVoteData with delegate address', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => usePrepareAndSignVoteData(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
            mockMetaMaskRequest: true,
          },
          wrapper: Wrapper,
        }
      );

      await new Promise((r) => {
        setTimeout(r, 1000);
      });

      // assert initial state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSignature).toBe('');

      // Call prepareAndSignVoteData
      act(() => {
        result.current.prepareAndSignVoteData(
          {
            choice: VoteChoices.Yes,
            delegateAddress: '0xF297430B340fEEdfe18da3747e1392B5A04b5c99',
            metadata: {
              type: 'Governance',
            },
          },
          ContractAdapterNames.onboarding,
          'abc123'
        );
      });

      // assert awaiting confirmation state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );
      expect(result.current.proposalSignature).toBe('');

      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const proposalDataUpdated = {
        ...result.current.proposalData,
        timestamp: now,
      };

      // assert pending state
      expect(result.current.prepareAndSignVoteData).toBeInstanceOf(Function);
      expect(proposalDataUpdated).toStrictEqual({
        payload: {
          choice: 1,
          metadata: {
            memberAddress: '0xF297430B340fEEdfe18da3747e1392B5A04b5c99',
            type: 'Governance',
          },
          proposalHash: 'abc123',
        },
        space: 'thelao',
        timestamp: now,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'vote',
        version: '0.1.2',
      });
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.proposalSignature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );
    });
  });
});
