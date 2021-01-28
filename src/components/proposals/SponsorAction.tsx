import {useSelector} from 'react-redux';

import {getContractByAddress} from '../web3/helpers';
import {
  prepareVoteProposalData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {useSignAndSubmitProposal} from './hooks';
import {ProposalOrDraftSnapshotData, ProposalCombined} from './types';
import {SPACE} from '../../config';
import {StoreState} from '../../store/types';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {lchmod} from 'fs';

type SponsorArguments = [
  string, // `dao`
  string, // `proposalId`
  string // `proposal data`
];

type SponsorActionProps<T extends ProposalOrDraftSnapshotData> = {
  proposal: ProposalCombined<T>;
};

export default function SponsorAction<T extends ProposalOrDraftSnapshotData>(
  props: SponsorActionProps<T>
) {
  const {proposal} = props;

  /**
   * Selectors
   */

  const contracts = useSelector((s: StoreState) => s.contracts);
  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();

  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  const {
    proposalData,
    proposalSignAndSendStatus,
    signAndSendProposal,
  } = useSignAndSubmitProposal<SnapshotType.draft>();

  const gasPrices = useETHGasPrice();

  /**
   * Functions
   */

  async function handleSubmit() {
    try {
      if (!daoRegistryAddress) {
        throw new Error('No DAO Registry address was found.');
      }

      const contract = getContractByAddress(
        proposal.snapshotProposal.actionId,
        contracts
      );

      const {
        snapshotProposal: {
          msg: {
            payload: {name, body, metadata},
            timestamp,
          },
        },
      } = proposal;

      // Sign and submit draft for snapshot-hub
      const {data, signature} = await signAndSendProposal({
        partialProposalData: {
          name,
          body,
          metadata,
          timestamp,
        },
        adapterAddress: contract.contractAddress,
        type: SnapshotType.proposal as any,
      });

      // Prepare data for submission to DAO
      const dataToPrepare = {
        payload: {
          name: data.payload.name,
          body: data.payload.body,
          choices: data.payload.choices,
          snapshot: (data.payload as any).snapshot.toString(),
          start: (data.payload as any).start,
          end: (data.payload as any).end,
        },
        sig: signature,
        space: data.space,
        timestamp: parseInt(data.timestamp),
      };

      console.log('dataToPrepare', dataToPrepare);

      const sponsorArguments: SponsorArguments = [
        daoRegistryAddress,
        // @todo Change how we access the proposal ID
        proposal.snapshotProposal.authorIpfsHash,
        prepareVoteProposalData(dataToPrepare, web3Instance),
      ];

      console.log(
        'sponsorArguments',
        JSON.stringify(sponsorArguments, null, 2)
      );

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      const receipt = await txSend(
        'sponsorProposal',
        contract.instance.methods,
        sponsorArguments,
        txArguments
      );

      console.log('receipt', receipt);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Render
   */

  return (
    <>
      <div>
        <button
          className="proposaldetails__button"
          disabled={isDisabled}
          onClick={isDisabled ? () => {} : handleSubmit}>
          Sponsor
        </button>

        {isDisabled && (
          <button className="button--help" onClick={openWhyDisabledModal}>
            Why is sponsoring disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is sponsoring disabled?" />
    </>
  );
}
