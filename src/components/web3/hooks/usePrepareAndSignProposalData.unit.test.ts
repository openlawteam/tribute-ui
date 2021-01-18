import {renderHook, act} from '@testing-library/react-hooks';

import {ContractAdapterNames, Web3TxStatus} from '../types';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {usePrepareAndSignProposalData} from '.';
import Wrapper from '../../../test/Wrapper';

describe('usePrepareAndSignProposalData unit tests', () => {
  test('should return correct data when calling prepareAndSignProposalData (Draft)', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => usePrepareAndSignProposalData(),
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
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSignature).toBe('');

      // Call prepareAndSignProposalData
      act(() => {
        result.current.prepareAndSignProposalData(
          {name: 'Test Name', body: 'Test Body', metadata: {}},
          ContractAdapterNames.onboarding,
          SnapshotType.draft
        );
      });

      // assert awaiting confirmation state
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
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
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
      expect(proposalDataUpdated).toStrictEqual({
        payload: {
          body: 'Test Body',
          choices: ['Yes', 'No'],
          metadata: {},
          name: 'Test Name',
        },
        actionId: '0x0000000000000000000000000000000000000000',
        chainId: 1337,
        space: 'thelao',
        timestamp: now,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'draft',
        verifyingContract: '0xBC58f21e92f39d958CAF792706bb1ECadfABE4AB',
        version: '0.1.2',
      });
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.proposalSignature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );
    });
  });

  test('should return correct data when calling prepareAndSignProposalData (Proposal)', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => usePrepareAndSignProposalData(),
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
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSignature).toBe('');

      // Call prepareAndSignProposalData
      act(() => {
        result.current.prepareAndSignProposalData(
          {
            name: 'Test Name',
            body: 'Test Body',
            metadata: {},
            timestamp: '1610981167',
          },
          ContractAdapterNames.onboarding,
          SnapshotType.proposal
        );
      });

      // assert awaiting confirmation state
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalDataError).toBe(undefined);
      expect(result.current.proposalDataStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );
      expect(result.current.proposalSignature).toBe('');

      await waitForNextUpdate();

      // assert pending state
      expect(result.current.prepareAndSignProposalData).toBeInstanceOf(
        Function
      );
      expect(result.current.proposalData).toStrictEqual({
        payload: {
          body: 'Test Body',
          choices: ['Yes', 'No'],
          metadata: {},
          name: 'Test Name',
          end: 1610981290,
          start: 1610981167,
          snapshot: 123,
        },
        actionId: '0x0000000000000000000000000000000000000000',
        chainId: 1337,
        space: 'thelao',
        timestamp: '1610981167',
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'proposal',
        verifyingContract: '0xBC58f21e92f39d958CAF792706bb1ECadfABE4AB',
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
