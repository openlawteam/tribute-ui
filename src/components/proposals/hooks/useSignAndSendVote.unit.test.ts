import {renderHook, act} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {signTypedDataV4} from '../../../test/web3Responses';
import {useSignAndSendVote} from '.';
import Wrapper from '../../../test/Wrapper';

describe('useSignAndSendVote unit tests', () => {
  test('should return correct data when calling signAndSendVote', async () => {
    await act(async () => {
      let mockWeb3Provider: any;
      let web3Instance: any;

      const {result, waitForValueToChange} = renderHook(
        () => useSignAndSendVote(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
          wrapper: Wrapper,
        }
      );

      await waitFor(() => {
        // assert initial state
        expect(result.current.signAndSendVote).toBeInstanceOf(Function);
        expect(result.current.voteData).toBe(undefined);
        expect(result.current.voteDataError).toBe(undefined);
        expect(result.current.voteDataStatus).toBe(Web3TxStatus.STANDBY);
      });

      await waitFor(() => {
        // Mock signature
        mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
      });

      // Call signAndSendVote
      result.current.signAndSendVote({
        partialVoteData: {choice: VoteChoices.Yes},
        adapterName: ContractAdapterNames.onboarding,
        proposalIdInDAO: 'abc123',
        proposalIdInSnapshot: 'abc123',
      });

      await waitFor(() => {
        // assert awaiting confirmation state
        expect(result.current.signAndSendVote).toBeInstanceOf(Function);
        expect(result.current.voteData).toBe(undefined);
        expect(result.current.voteDataError).toBe(undefined);
        expect(result.current.voteDataStatus).toBe(
          Web3TxStatus.AWAITING_CONFIRM
        );
      });

      await waitForValueToChange(() => result.current.voteDataStatus);

      // Assert pending state
      expect(result.current.signAndSendVote).toBeInstanceOf(Function);
      expect(result.current.voteData).toBe(undefined);
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.PENDING);

      await waitForValueToChange(() => result.current.voteData);

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
            proposalId: 'abc123',
            metadata: {
              memberAddress: DEFAULT_ETH_ADDRESS,
            },
          },
          space: 'tribute',
          timestamp: now,
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: 'vote',
          version: '0.1.2',
        },
        signature:
          '0x6772656174207369676e61747572650000000000000000000000000000000000',
        uniqueId:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
      });
      expect(result.current.voteDataError).toBe(undefined);
      expect(result.current.voteDataStatus).toBe(Web3TxStatus.FULFILLED);
    });
  });
});
