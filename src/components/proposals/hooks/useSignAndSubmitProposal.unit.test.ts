import {renderHook, act} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {ethBlockNumber, signTypedDataV4} from '../../../test/web3Responses';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {snapshotAPISubmitMessage} from '../../../test/restResponses';
import {useSignAndSubmitProposal} from '.';
import Wrapper from '../../../test/Wrapper';

describe('useSignAndSubmitProposal unit tests', () => {
  test('hook states should be correct when signing & sending (Draft)', async () => {
    await act(async () => {
      let mockWeb3Provider: any;
      let web3Instance: any;

      const {result, waitForValueToChange} = renderHook(
        () => useSignAndSubmitProposal(),
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
        expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalSignAndSendError).toBe(undefined);
        expect(result.current.proposalSignAndSendStatus).toBe(
          Web3TxStatus.STANDBY
        );
      });

      await waitFor(() => {
        mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
      });

      // Call signAndSendProposal
      result.current.signAndSendProposal({
        partialProposalData: {
          name: 'Test Name',
          body: 'Test Body',
          metadata: {},
        },
        adapterName: ContractAdapterNames.onboarding,
        type: SnapshotType.draft,
      });

      // assert awaiting confirmation state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );

      await waitForValueToChange(
        () => result.current.proposalSignAndSendStatus
      );

      // assert pending submission state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.PENDING
      );

      await waitForValueToChange(
        () => result.current.proposalSignAndSendStatus
      );

      // @note Set the timestamp by hand as dates will always be different
      const now = (Date.now() / 1000).toFixed();
      const proposalDataUpdated = {
        ...result.current.proposalData,
        data: {...result.current.proposalData?.data, timestamp: now},
      };

      // assert pending state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(proposalDataUpdated).toStrictEqual({
        data: {
          payload: {
            body: 'Test Body',
            choices: ['Yes', 'No'],
            metadata: {},
            name: 'Test Name',
          },
          space: 'tribute',
          timestamp: now,
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: 'draft',
          version: '0.1.2',
        },
        signature:
          '0x6772656174207369676e61747572650000000000000000000000000000000000',
        /**
         * @note This actually matches a proposal ID (set in our mock server)
         *   This was done to make the mocked HTTP calls easier.
         */
        uniqueId:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
        uniqueIdDraft: '',
      });
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.FULFILLED
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

    let mockWeb3Provider: any;
    let web3Instance: any;

    await act(async () => {
      const {result, waitForValueToChange} = renderHook(
        () => useSignAndSubmitProposal(),
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
        expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalSignAndSendError).toBe(undefined);
        expect(result.current.proposalSignAndSendStatus).toBe(
          Web3TxStatus.STANDBY
        );
      });

      await waitFor(() => {
        // Mock the RPC calls from `buildProposalMessageHelper`
        mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameter('uint256', 123)
        );
        // Mock signature
        mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
      });

      // Call signAndSendProposal
      result.current.signAndSendProposal({
        partialProposalData: {
          name: 'Test Name',
          body: 'Test Body',
          metadata: {},
          timestamp: '1610981167',
        },
        adapterName: ContractAdapterNames.onboarding,
        type: SnapshotType.proposal,
      });

      // assert awaiting confirmation state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.AWAITING_CONFIRM
      );

      await waitForValueToChange(
        () => result.current.proposalSignAndSendStatus
      );

      // assert pending submission state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(result.current.proposalData).toBe(undefined);
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.PENDING
      );

      await waitForValueToChange(
        () => result.current.proposalSignAndSendStatus
      );

      // @note Set the timestamp by hand as dates will always be different
      const now = Math.floor(Date.now() / 1000);
      const proposalDataUpdated = {
        ...result.current.proposalData,
        data: {
          ...result.current.proposalData?.data,
          timestamp: now.toString(),
          payload: {
            ...result.current.proposalData?.data.payload,
            start: now + 60,
            end: now + 180,
          },
        },
      };

      // assert pending state
      expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
      expect(proposalDataUpdated).toStrictEqual({
        data: {
          payload: {
            body: 'Test Body',
            choices: ['Yes', 'No'],
            metadata: {},
            name: 'Test Name',
            end: now + 180,
            start: now + 60,
            snapshot: 100,
          },
          space: 'tribute',
          timestamp: now.toString(),
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: 'proposal',
          version: '0.1.2',
        },
        uniqueId: '1234567jkl',
        uniqueIdDraft: snapshotAPISubmitMessage.uniqueId,
        signature:
          '0x6772656174207369676e61747572650000000000000000000000000000000000',
      });
      expect(result.current.proposalSignAndSendError).toBe(undefined);
      expect(result.current.proposalSignAndSendStatus).toBe(
        Web3TxStatus.FULFILLED
      );
    });
  });

  test('should return correct data when calling actions (Draft)', async () => {
    await act(async () => {
      let provider: any;
      let web3: any;

      const {result} = renderHook(() => useSignAndSubmitProposal(), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: ({mockWeb3Provider, web3Instance}) => {
            provider = mockWeb3Provider;
            web3 = web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        // Mock signature
        provider.injectResult(...signTypedDataV4({web3Instance: web3}));
      });

      // Call signAndSendProposal
      const {data, signature, uniqueId} =
        await result.current.signAndSendProposal({
          partialProposalData: {
            name: 'Test Name',
            body: 'Test Body',
            metadata: {},
          },
          adapterName: ContractAdapterNames.onboarding,
          type: SnapshotType.draft,
        });

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
        space: 'tribute',
        timestamp: now,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'draft',
        version: '0.1.2',
      });
      expect(signature).toBe(
        '0x6772656174207369676e61747572650000000000000000000000000000000000'
      );
      expect(uniqueId).toBe(snapshotAPISubmitMessage.uniqueId);
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

    let mockWeb3Provider: any;
    let web3Instance: any;

    await act(async () => {
      const {result} = await renderHook(() => useSignAndSubmitProposal(), {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
        wrapper: Wrapper,
      });

      await waitFor(() => {
        // assert initial state
        expect(result.current.signAndSendProposal).toBeInstanceOf(Function);
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalSignAndSendError).toBe(undefined);
        expect(result.current.proposalSignAndSendStatus).toBe(
          Web3TxStatus.STANDBY
        );
      });

      await waitFor(() => {
        // Mock the RPC calls from `buildProposalMessageHelper`
        mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameter('uint256', 123)
        );
        // Mock signature
        mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
      });

      // Call signAndSendProposal
      const {data, signature, uniqueId, uniqueIdDraft} =
        await result.current.signAndSendProposal({
          partialProposalData: {
            name: 'Test Name',
            body: 'Test Body',
            metadata: {},
            timestamp: '1610981167',
          },
          adapterName: ContractAdapterNames.onboarding,
          type: SnapshotType.proposal,
        });

      // @note Set the timestamp by hand as dates will always be different
      const now = Math.floor(Date.now() / 1000);
      const dataUpdated = {
        ...data,
        timestamp: now.toString(),
        payload: {
          ...data.payload,
          start: now + 60,
          end: now + 180,
        },
      };

      expect(dataUpdated).toStrictEqual({
        payload: {
          body: 'Test Body',
          choices: ['Yes', 'No'],
          metadata: {},
          name: 'Test Name',
          end: now + 180,
          start: now + 60,
          snapshot: 100,
        },
        space: 'tribute',
        timestamp: now.toString(),
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        type: 'proposal',
        version: '0.1.2',
      });
      expect(signature).toBe(
        '0x6772656174207369676e61747572650000000000000000000000000000000000'
      );
      expect(uniqueId).toBe('1234567jkl');
      expect(uniqueIdDraft).toBe(snapshotAPISubmitMessage.uniqueId);
    });
  });
});
