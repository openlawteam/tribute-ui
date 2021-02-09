import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  createVote,
  getDomainDefinition,
  getVoteResultRootDomainDefinition,
  prepareVoteResult,
  signMessage,
  SnapshotVoteResponseData,
  toStepNode,
  VoteChoicesIndex,
} from '@openlaw/snapshot-js-erc712';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_CHAIN, SHARES_ADDRESS} from '../../../config';
import {
  getAdapterAddressFromContracts,
  getContractByAddress,
} from '../../web3/helpers';
import {ProposalData} from '../types';
import {StoreState} from '../../../store/types';
import {PRIMARY_TYPE_ERC712, TX_CYCLE_MESSAGES} from '../../web3/config';
import {useMemberActionDisabled} from '../../../hooks';
import {useWeb3Modal, useContractSend, useETHGasPrice} from '../../web3/hooks';
import {
  MessageWithType,
  VoteEntry,
} from '../../../../../snapshot-js-erc712/dist/types';
import CycleMessage from '../../feedback/CycleMessage';
import ErrorMessageWithDetails from '../../common/ErrorMessageWithDetails';
import EtherscanURL from '../../web3/EtherscanURL';
import FadeIn from '../../common/FadeIn';
import Loader from '../../feedback/Loader';

type OffchainVotingSubmitResultActionProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
};

type SubmitVoteResultArguments = [
  string, // `dao`
  string, // `proposalId`
  string, // `proposal data`,
  {
    account: string;
    choice: VoteChoicesIndex;
    index: number;
    nbNo: string;
    nbYes: string;
    proof: string[];
    proposalHash: string;
    rootSig: string;
    sig: string;
    timestamp: number;
  }
];

export function OffchainVotingSubmitResultAction(
  props: OffchainVotingSubmitResultActionProps
) {
  const {
    adapterName,
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Selectors
   */

  const bankExtensionMethods = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.instance.methods
  );
  const offchainVotingMethods = useSelector(
    (s: StoreState) => s.contracts.OffchainVotingContract?.instance.methods
  );
  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );
  const contracts = useSelector((s: StoreState) => s.contracts);

  /**
   * Our hooks
   */

  const {account, provider} = useWeb3Modal();

  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  const gasPrices = useETHGasPrice();

  /**
   * Variables
   */

  const adapterAddress = getAdapterAddressFromContracts(adapterName, contracts);

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Functions
   */

  async function handleSubmit() {
    try {
      if (!daoRegistryAddress) {
        throw new Error('No DAO Registry address was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!snapshotProposal.votes) {
        throw new Error('No Snapshot proposal votes were found.');
      }

      const {idInDAO: proposalHash} = snapshotProposal;

      // 1. Create vote entries
      const voteEntriesPromises: Promise<VoteEntry>[] = snapshotProposal.votes.map(
        async (v) => {
          const voteData: SnapshotVoteResponseData = Object.values(v)[0];

          const vote = createVote({
            proposalHash,
            account: voteData.address,
            voteYes: voteData.msg.payload.choice === VoteChoicesIndex.Yes,
            timestamp: Number(voteData.msg.timestamp),
          });

          const voteEntry = {
            ...vote,
            sig: voteData.sig,
            // @todo use subgraph weight data
            weight: await bankExtensionMethods
              .getPriorAmount(
                vote.payload.account,
                SHARES_ADDRESS,
                snapshotProposal.msg.payload.snapshot
              )
              .call(),
          } as VoteEntry;

          return voteEntry;
        }
      );

      // 2. Prepare vote Result
      const {voteResultTree, votes} = await prepareVoteResult({
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        daoAddress: daoRegistryAddress,
        votes: await Promise.all(voteEntriesPromises),
      });

      const voteResultTreeHexRoot = voteResultTree.getHexRoot();

      const result = toStepNode({
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        merkleTree: voteResultTree,
        // @note Should use last entry
        step: votes[votes.length - 1],
        verifyingContract: daoRegistryAddress,
      });

      // (result as any).nbNo = Number(result.nbNo);
      // (result as any).nbYes = Number(result.nbYes);

      const {domain, types} = getVoteResultRootDomainDefinition(
        daoRegistryAddress,
        adapterAddress,
        DEFAULT_CHAIN
      );

      const messageParams = JSON.stringify({
        domain,
        message: {root: voteResultTreeHexRoot},
        primaryType: PRIMARY_TYPE_ERC712,
        types,
      });

      const signature = await signMessage(provider, account, messageParams);

      const vote = await contracts.OffchainVotingContract?.instance.methods
        .votes(daoRegistryAddress, proposalHash)
        .call();

      console.log('vote', vote);

      // @todo Add type
      const submitVoteResultArguments: SubmitVoteResultArguments = [
        daoRegistryAddress,
        proposalHash,
        voteResultTreeHexRoot,
        {...result, rootSig: signature},
      ];

      console.log('submitVoteResultArguments', submitVoteResultArguments);

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      await txSend(
        'submitVoteResult',
        offchainVotingMethods,
        submitVoteResultArguments,
        txArguments
      );

      // const contract = getContractByAddress(snapshotDraft.actionId, contracts);

      // const {
      //   msg: {
      //     payload: {name, body, metadata},
      //     timestamp,
      //   },
      // } = snapshotDraft;

      // // Sign and submit draft for snapshot-hub
      // const {data, signature} = await signAndSendProposal({
      //   partialProposalData: {
      //     name,
      //     body,
      //     metadata,
      //     timestamp,
      //   },
      //   adapterAddress: contract.contractAddress,
      //   type: SnapshotType.proposal,
      // });

      // /**
      //  * Prepare `data` argument for submission to DAO
      //  *
      //  * For information about which data the smart contract needs for signature verification (e.g. `hashMessage`):
      //  * @link https://github.com/openlawteam/laoland/blob/master/contracts/adapters/voting/OffchainVoting.sol
      //  */
      // const preparedVoteVerificationBytes = prepareVoteProposalData(
      //   {
      //     payload: {
      //       name: data.payload.name,
      //       body: data.payload.body,
      //       choices: data.payload.choices,
      //       snapshot: data.payload.snapshot.toString(),
      //       start: data.payload.start,
      //       end: data.payload.end,
      //     },
      //     sig: signature,
      //     space: data.space,
      //     timestamp: parseInt(data.timestamp),
      //   },
      //   web3Instance
      // );

      // const sponsorArguments: SponsorArguments = [
      //   daoRegistryAddress,
      //   snapshotDraft.idInDAO,
      //   preparedVoteVerificationBytes,
      // ];

      // const txArguments = {
      //   from: account || '',
      //   // Set a fast gas price
      //   ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      // };

      // await txSend(
      //   'sponsorProposal',
      //   contract.instance.methods,
      //   sponsorArguments,
      //   txArguments
      // );
    } catch (error) {
      console.log('error', error);

      setSubmitError(error);
    }
  }

  /* function renderSubmitStatus(): React.ReactNode {
    // Either Snapshot or chain tx
    if (
      txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM
    ) {
      return 'Awaiting your confirmation\u2026';
    }

    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={TX_CYCLE_MESSAGES}
              useFirstItemStart
              render={(message) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>Proposal submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  } */

  /**
   * Render
   */

  return (
    <>
      <div>
        <button
          className="proposaldetails__button"
          disabled={isDisabled || isInProcessOrDone}
          onClick={isDisabled || isInProcessOrDone ? () => {} : handleSubmit}>
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit Vote Result'}
        </button>

        <ErrorMessageWithDetails
          error={submitError}
          renderText="Something went wrong"
        />

        {/* SUBMIT STATUS */}
        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {/* {renderSubmitStatus()} */}
          </div>
        )}

        {isDisabled && (
          <button className="button--help" onClick={openWhyDisabledModal}>
            Why is submitting the vote result disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is this disabled?" />
    </>
  );
}
