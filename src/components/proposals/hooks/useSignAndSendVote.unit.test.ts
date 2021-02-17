import {renderHook, act} from '@testing-library/react-hooks';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
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

      // Call signAndSendVote
      act(() => {
        result.current.signAndSendVote({
          partialVoteData: {choice: VoteChoices.Yes},
          adapterName: ContractAdapterNames.onboarding,
          proposalIdInDAO: 'abc123',
          proposalIdInSnapshot: 'abc123',
        });
      });

      // assert awaiting confirmation state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);

      await waitForNextUpdate();
      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const voteDataUpdated = {
        ...result.current.voteData,
        data: {
          ...result.current.voteData?.data,
          timestamp: now,
        },
      };

      // assert pending state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(voteDataUpdated).toStrictEqual({
        data: {
          payload: {
            choice: 1,
            proposalHash: 'abc123',
            metadata: {
              memberAddress: DEFAULT_ETH_ADDRESS,
            },
          },
          space: 'thelao',
          timestamp: now,
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: 'vote',
          version: '0.1.2',
        },
        signature:
          '0x000000000000000000000000000000000000000000000000000000000000007b',
        uniqueId: 'abc123def456',
      });
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.FULFILLED);
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

      // Call signAndSendVote
      act(() => {
        result.current.signAndSendVote({
          partialVoteData: {
            choice: VoteChoices.Yes,
            delegateAddress: '0xF297430B340fEEdfe18da3747e1392B5A04b5c99',
            metadata: {
              someData: 'Some data',
            },
          },
          adapterName: ContractAdapterNames.onboarding,
          proposalIdInDAO: 'abc123',
          proposalIdInSnapshot: 'abc123',
        });
      });

      // assert awaiting confirmation state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.AWAITING_CONFIRM);

      await waitForNextUpdate();
      await waitForNextUpdate();

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const voteDataUpdated = {
        ...result.current.voteData,
        data: {
          ...result.current.voteData?.data,
          timestamp: now,
        },
      };

      // assert pending state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(voteDataUpdated).toStrictEqual({
        data: {
          payload: {
            choice: 1,
            proposalHash: 'abc123',
            metadata: {
              memberAddress: '0xF297430B340fEEdfe18da3747e1392B5A04b5c99',
              someData: 'Some data',
            },
          },
          space: 'thelao',
          timestamp: now,
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: 'vote',
          version: '0.1.2',
        },
        signature:
          '0x000000000000000000000000000000000000000000000000000000000000007b',
        uniqueId: 'abc123def456',
      });
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.FULFILLED);
    });
  });
});
