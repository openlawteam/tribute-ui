import {
  createVote,
  getVoteResultRootDomainDefinition,
  prepareVoteResult,
  signMessage,
  VoteChoicesIndex,
} from '@openlaw/snapshot-js-erc712';
import {useSelector} from 'react-redux';
import {useState} from 'react';
import {VoteEntry} from '@openlaw/snapshot-js-erc712/dist/types';

import {
  DEFAULT_CHAIN,
  MEMBER_COUNT_ADDRESS,
  TOTAL_ADDRESS,
  UNITS_ADDRESS,
} from '../../../config';
import {
  getAdapterAddressFromContracts,
  multicall,
  MulticallTuple,
} from '../../web3/helpers';
import {BadNodeError} from './types';
import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {getOffchainVotingProof, submitOffchainVotingProof} from '../helpers';
import {normalizeString, numberRangeArray} from '../../../util/helpers';
import {OffchainVotingContract} from '../../../abis/types/OffchainVotingContract';
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

type Node = Parameters<
  OffchainVotingContract['methods']['submitVoteResult']
>['4'];

type OffchainVotingSubmitResultActionProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
};

type SubmitVoteResultArguments = [
  daoAddress: string,
  proposalId: string,
  resultRoot: string,
  reporter: string,
  lastResult: Node,
  rootSig: string
];

export function OffchainOpRollupVotingSubmitResultAction(
  props: OffchainVotingSubmitResultActionProps
) {
  const {
    adapterName,
    proposal: {daoProposalVotingAdapter, snapshotProposal},
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

  const bankExtensionAddress = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.contractAddress
  );

  const bankExtensionMethods = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.instance.methods
  );

  const getPriorAmountABI = useSelector((s: StoreState) =>
    s.contracts.BankExtensionContract?.abi.find(
      (ai) => ai.name === 'getPriorAmount'
    )
  );

  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  const getMemberAddressABI = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  )?.find((ai) => ai.name === 'getMemberAddress');

  const contracts = useSelector((s: StoreState) => s.contracts);

  /**
   * Our hooks
   */

  const {account, provider, web3Instance} = useWeb3Modal();
  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();
  const {average: gasPrice} = useETHGasPrice();

  const {isDisabled, openWhyDisabledModal, WhyDisabledModal} =
    useMemberActionDisabled();

  /**
   * Variables
   */

  const votingAdapterMethods =
    daoProposalVotingAdapter?.getWeb3VotingAdapterContract<OffchainVotingContract>()
      .methods;

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

      if (!bankExtensionAddress) {
        throw new Error('No Bank Extension address was found.');
      }

      if (!getMemberAddressABI) {
        throw new Error('No ABI for `getMemberAddress` was found.');
      }

      if (!getPriorAmountABI) {
        throw new Error('No ABI for `getPriorAmount` was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!snapshotProposal.votes) {
        throw new Error('No Snapshot proposal votes Array was found.');
      }

      if (!votingAdapterMethods) {
        throw new Error('No "OffchainVotingContract" methods were found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!bankExtensionMethods) {
        throw new Error('No BankExtension methods were found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      setSignatureStatus(Web3TxStatus.AWAITING_CONFIRM);

      const {idInDAO: proposalHash} = snapshotProposal;

      const snapshot: string = snapshotProposal.msg.payload.snapshot.toString();

      const adapterAddress = getAdapterAddressFromContracts(
        adapterName,
        contracts
      );

      // Get total number of potential and admitted members in the DAO at the snapshot
      const numberOfDAOMembersAtSnapshot: string = await bankExtensionMethods
        .getPriorAmount(TOTAL_ADDRESS, MEMBER_COUNT_ADDRESS, snapshot)
        .call();

      const getMemberAddressCalls: MulticallTuple[] = numberRangeArray(
        Number(numberOfDAOMembersAtSnapshot) - 1,
        0
      ).map(
        (memberIndex): MulticallTuple => [
          daoRegistryAddress,
          getMemberAddressABI,
          [memberIndex.toString()],
        ]
      );

      // Get all member addresses in the DAO based on the member count
      const memberAddresses: string[] = await multicall({
        calls: getMemberAddressCalls,
        web3Instance,
      });

      const memberBalanceCalls: MulticallTuple[] = memberAddresses.map(
        (m): MulticallTuple => [
          bankExtensionAddress,
          getPriorAmountABI,
          [m, UNITS_ADDRESS, snapshot],
        ]
      );

      // Get all member balances
      const memberBalancesAtSnapshot: string[] = await multicall({
        calls: memberBalanceCalls,
        web3Instance,
      });

      // Create vote entries
      const votes: VoteEntry[] = memberAddresses.map((memberAddress, i) => {
        const voteData = Object.values(
          snapshotProposal.votes?.find(
            (v) =>
              normalizeString(memberAddress) ===
              normalizeString(
                Object.values(v)[0].msg.payload.metadata.memberAddress
              )
          ) || {}
        )[0];

        // Create votes based on whether `voteData` was found for `memberAddress`
        return createVote({
          proposalId: proposalHash,
          sig: voteData?.sig || '0x',
          timestamp: voteData ? Number(voteData.msg.timestamp) : 0,
          voteYes: voteData?.msg.payload.choice === VoteChoicesIndex.Yes,
          weight: voteData ? memberBalancesAtSnapshot[i] : '0',
        });
      });

      // Prepare vote Result
      const {voteResultTree, result} = await prepareVoteResult({
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        daoAddress: daoRegistryAddress,
        votes,
      });

      const voteResultTreeHexRoot: string = voteResultTree.getHexRoot();
      // The last of the result node tree steps
      const resultNodeLast = result[result.length - 1] as any as Node;

      // Validate the vote result node by calling the contract
      const getBadNodeErrorResponse: string = await votingAdapterMethods
        .getBadNodeError(
          daoRegistryAddress,
          proposalHash,
          // `bool submitNewVote`
          true,
          voteResultTreeHexRoot,
          snapshot,
          // `gracePeriodStartingTime` should be `0` as `submitNewVote` is `true`
          0,
          numberOfDAOMembersAtSnapshot,
          resultNodeLast
        )
        .call();

      if (Number(getBadNodeErrorResponse) !== BadNodeError.OK) {
        throw new Error(
          `Cannot submit off-chain voting result. Node has an error: ${BadNodeError[getBadNodeErrorResponse]}.`
        );
      }

      // Prepare to sign root hex result
      const {domain, types} = getVoteResultRootDomainDefinition(
        daoRegistryAddress,
        adapterAddress,
        DEFAULT_CHAIN
      );

      const messageParams: string = JSON.stringify({
        domain,
        message: {root: voteResultTreeHexRoot},
        primaryType: PRIMARY_TYPE_ERC712,
        types,
      });

      // Sign root hex result message
      const signature: string = await signMessage(
        provider,
        account,
        messageParams
      );

      // Check if off-chain proof has already been submitted
      const snapshotOffchainProofExists: boolean =
        ((await getOffchainVotingProof(voteResultTreeHexRoot))?.merkle_root
          .length || '') > 0;

      /**
       * Send off-chain vote proof silently to Snapshot Hub for storage and later use.
       *
       * We're piggy-backing off of the signature async call's status, instead of setting another status.
       * E.g. It may confuse the user if we were to display text saying we're "submitting
       * off-chain proof", or something to this effect, for a second or two.
       */
      if (!snapshotOffchainProofExists) {
        await submitOffchainVotingProof({
          actionId: adapterAddress,
          chainId: DEFAULT_CHAIN,
          steps: result,
          merkleRoot: voteResultTreeHexRoot,
          verifyingContract: daoRegistryAddress,
        });
      }

      setSignatureStatus(Web3TxStatus.FULFILLED);

      const submitVoteResultArguments: SubmitVoteResultArguments = [
        daoRegistryAddress,
        proposalHash,
        voteResultTreeHexRoot,
        account,
        resultNodeLast,
        signature,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Send the tx
      await txSend(
        'submitVoteResult',
        votingAdapterMethods,
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
