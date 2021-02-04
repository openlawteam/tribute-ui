import {renderHook, act} from '@testing-library/react-hooks';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {useSignAndSendVote} from '.';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import Wrapper from '../../../test/Wrapper';

describe('useSignAndSendVote unit tests', () => {
  test('should return correct data when calling signAndSendVote', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useSignAndSendVote(),
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
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.voteSignature).toBe('');

      // Call signAndSendVote
      act(() => {
        result.current.signAndSendVote(
          {choice: VoteChoices.Yes},
          ContractAdapterNames.onboarding,
          'abc123'
        );
      });

      // assert awaiting confirmation state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);
      expect(result.current.voteSignature).toBe('');

      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const voteDataUpdated = {
        ...result.current.voteData,
        timestamp: now,
      };

      // assert pending state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(voteDataUpdated).toStrictEqual({
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
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.voteSignature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );
    });
  });

  test('should return correct data when calling signAndSendVote with delegate address', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useSignAndSendVote(),
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
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.voteSignature).toBe('');

      // Call signAndSendVote
      act(() => {
        result.current.signAndSendVote(
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
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);
      expect(result.current.voteSignature).toBe('');

      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const voteDataUpdated = {
        ...result.current.voteData,
        timestamp: now,
      };

      // assert pending state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(voteDataUpdated).toStrictEqual({
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
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.voteSignature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );
    });
  });
});
