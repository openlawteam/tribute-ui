import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  createVote,
  getVoteResultRootDomainDefinition,
  prepareVoteResult,
  signMessage,
  SnapshotVoteResponseData,
  toStepNode,
  VoteChoicesIndex,
} from '@openlaw/snapshot-js-erc712';
import {VoteEntry} from '@openlaw/snapshot-js-erc712/dist/types';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {getAdapterAddressFromContracts} from '../../web3/helpers';
import {DEFAULT_CHAIN, SHARES_ADDRESS} from '../../../config';
import {PRIMARY_TYPE_ERC712, TX_CYCLE_MESSAGES} from '../../web3/config';
import {ProposalData} from '../types';
import {StoreState} from '../../../store/types';
import {useMemberActionDisabled} from '../../../hooks';
import {useWeb3Modal, useContractSend, useETHGasPrice} from '../../web3/hooks';
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

export function OffchainOpRollupVotingSubmitResultAction(
  props: OffchainVotingSubmitResultActionProps
) {
  const {
    adapterName,
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [signatureStatus, setSignatureStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );
  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Selectors
   */

  const bankExtensionMethods = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.instance.methods
  );
  const offchainVotingMethods = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.instance.methods
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

  const isInProcess =
    signatureStatus === Web3TxStatus.AWAITING_CONFIRM ||
    signatureStatus === Web3TxStatus.PENDING ||
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;

  const isDone =
    txStatus === Web3TxStatus.FULFILLED &&
    signatureStatus === Web3TxStatus.FULFILLED;

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

      setSignatureStatus(Web3TxStatus.AWAITING_CONFIRM);

      const {idInDAO: proposalHash} = snapshotProposal;
      const adapterAddress = getAdapterAddressFromContracts(
        adapterName,
        contracts
      );

      // 1. Create vote entries
      const voteEntriesPromises: Promise<VoteEntry>[] = snapshotProposal.votes.map(
        async (v) => {
          const voteData: SnapshotVoteResponseData = Object.values(v)[0];

          return createVote({
            proposalHash,
            account: voteData.address,
            voteYes: voteData.msg.payload.choice === VoteChoicesIndex.Yes,
            timestamp: Number(voteData.msg.timestamp),
            sig: voteData.sig,
            // @todo conditionally use subgraph weight data
            weight: await bankExtensionMethods
              .getPriorAmount(
                voteData.address,
                SHARES_ADDRESS,
                snapshotProposal.msg.payload.snapshot
              )
              .call(),
          });
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

      // 3. Sign message
      const signature = await signMessage(provider, account, messageParams);

      setSignatureStatus(Web3TxStatus.FULFILLED);

      const submitVoteResultArguments: SubmitVoteResultArguments = [
        daoRegistryAddress,
        proposalHash,
        voteResultTreeHexRoot,
        {...result, rootSig: signature},
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // 4. Send the tx
      await txSend(
        'submitVoteResult',
        offchainVotingMethods,
        submitVoteResultArguments,
        txArguments
      );
    } catch (error) {
      setSubmitError(error);
      setSignatureStatus(Web3TxStatus.REJECTED);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // Either Snapshot or chain tx
    if (
      txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      signatureStatus === Web3TxStatus.AWAITING_CONFIRM
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
            <div>Result submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
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
            {renderSubmitStatus()}
          </div>
        )}

        {isDisabled && (
          <button
            className="button--help-centered"
            onClick={openWhyDisabledModal}>
            Why is submitting disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is this disabled?" />
    </>
  );
}
