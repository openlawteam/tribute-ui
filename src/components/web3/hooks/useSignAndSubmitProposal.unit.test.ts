import {renderHook, act} from '@testing-library/react-hooks';

import {
  SnapshotSubmitBaseReturn,
  SnapshotSubmitProposalReturn,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {AsyncStatus} from '../../../util/types';
import {ContractAdapterNames, Web3TxStatus} from '../types';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {snapshotAPISubmitMessage} from '../../../test/restResponses';
import {useSignAndSubmitProposal} from '.';
import Wrapper from '../../../test/Wrapper';

describe('useSignAndSubmitProposal unit tests', () => {
  test('hook states should be correct when signing & sending (Draft)', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useSignAndSubmitProposal(),
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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

      // Call submitProposal
      act(() => {
        result.current.submitProposal<SnapshotSubmitBaseReturn>();
      });

      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.proposalHashData).toBe(undefined);

      await waitForNextUpdate();

      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalHashData).toStrictEqual(
        snapshotAPISubmitMessage
      );
    });
  });

  test('hook states should be correct when signing & sending (Proposal)', async () => {
    // Provide a mocked response for a Proposal type
    server.use(
      rest.post(`${SNAPSHOT_HUB_API_URL}/api/message`, async (_, res, ctx) =>
        res(
          ctx.json({
            uniqueId: '1234567jkl',
            uniqueIdDraft: snapshotAPISubmitMessage.uniqueId,
          })
        )
      )
    );

    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useSignAndSubmitProposal(),
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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

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
      expect(result.current.proposalSignError).toBe(undefined);
      expect(result.current.proposalSubmitError).toBe(undefined);
      expect(result.current.proposalSignStatus).toBe(Web3TxStatus.FULFILLED);
      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.STANDBY);

      // Call submitProposal
      act(() => {
        result.current.submitProposal<SnapshotSubmitProposalReturn>();
      });

      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.proposalHashData).toBe(undefined);

      await waitForNextUpdate();

      expect(result.current.proposalSubmitStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalHashData).toStrictEqual({
        uniqueId: '1234567jkl',
        uniqueIdDraft: snapshotAPISubmitMessage.uniqueId,
      });
    });
  });

  test('should return correct data when calling actions (Draft)', async () => {
    await act(async () => {
      const {result} = renderHook(() => useSignAndSubmitProposal(), {
        initialProps: {
          useInit: true,
          useWallet: true,
          mockMetaMaskRequest: true,
        },
        wrapper: Wrapper,
      });

      await new Promise((r) => {
        setTimeout(r, 1000);
      });

      // Call prepareAndSignProposalData
      const {data, signature} = await result.current.prepareAndSignProposalData(
        {name: 'Test Name', body: 'Test Body', metadata: {}},
        ContractAdapterNames.onboarding,
        SnapshotType.draft
      );

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const proposalDataUpdated = {
        ...data,
        timestamp: now,
      };

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
      expect(signature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );

      // Call submitProposal
      const {
        uniqueId,
      } = await result.current.submitProposal<SnapshotSubmitBaseReturn>();

      expect(uniqueId).toBe('abc123def456');
    });
  });

  test('should return correct data when calling actions (Proposal)', async () => {
    // Provide a mocked response for a Proposal type
    server.use(
      rest.post(`${SNAPSHOT_HUB_API_URL}/api/message`, async (_, res, ctx) =>
        res(
          ctx.json({
            uniqueId: '1234567jkl',
            uniqueIdDraft: snapshotAPISubmitMessage.uniqueId,
          })
        )
      )
    );

    await act(async () => {
      const {result} = renderHook(() => useSignAndSubmitProposal(), {
        initialProps: {
          useInit: true,
          useWallet: true,
          mockMetaMaskRequest: true,
        },
        wrapper: Wrapper,
      });

      await new Promise((r) => {
        setTimeout(r, 1000);
      });

      // Call prepareAndSignProposalData
      const {data, signature} = await result.current.prepareAndSignProposalData(
        {
          name: 'Test Name',
          body: 'Test Body',
          metadata: {},
          timestamp: '1610981167',
        },
        ContractAdapterNames.onboarding,
        SnapshotType.proposal
      );

      expect(data).toStrictEqual({
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
      expect(signature).toBe(
        '0x000000000000000000000000000000000000000000000000000000000000007b'
      );

      // Call submitProposal
      const {
        uniqueId,
        uniqueIdDraft,
      } = await result.current.submitProposal<SnapshotSubmitProposalReturn>();

      expect(uniqueId).toBe('1234567jkl');
      expect(uniqueIdDraft).toBe('abc123def456');
    });
  });
});
