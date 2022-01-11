import {AbiItem} from 'web3-utils/types';
import {fromWei, sha3} from 'web3-utils';
import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Web3 from 'web3';

import {alchemyFetchAssetTransfers} from '../../web3/helpers';
import {AsyncStatus} from '../../../util/types';
import {CHAINS, DEFAULT_CHAIN} from '../../../config';
import {ConfigurationUpdated} from '../../../abis/types/DaoRegistry';
import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';
import {useAbortController} from '../../../hooks';
import {useWeb3Modal} from '../../web3/hooks';

type UseTotalAmountContributedReturn = {
  amountContributed: number;
  amountContributedStatus: AsyncStatus;
};

const {FULFILLED, PENDING, REJECTED, STANDBY} = AsyncStatus;

const ALLOWED_ASSETS = ['eth', 'weth'];

const CONFIGURATION_UPDATED_EVENT_SIGNATURE_HASH = sha3(
  'ConfigurationUpdated(bytes32,uint256)'
);

const KYC_ONBOARDING_CHUNK_SIZE_KEY_HASH = sha3('kyc-onboarding.chunkSize');

/**
 * Returns the total amount of ETH, WETH contributed to the DAO's multi-sig
 * via `KycOnboarding` transfers and direct transfers.
 *
 * This hook will only run on mainnet due to constraints from the Alchemy Transfers API.
 */
export function useTotalAmountContributedMultisig(
  multisigAddress: string
): UseTotalAmountContributedReturn {
  /**
   * Selectors
   */

  const daoAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  const daoABI = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  );

  /**
   * State
   */

  const [amountContributed, setAmountContributed] = useState<number>(0);

  const [amountContributedStatus, setAmountContributedStatus] =
    useState<AsyncStatus>(STANDBY);

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();
  const {web3Instance} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const getAmountContributedCached = useCallback(getAmountContributed, [
    abortController,
    isMountedRef,
    multisigAddress,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (
      DEFAULT_CHAIN !== CHAINS.MAINNET ||
      !daoAddress ||
      !daoABI ||
      !web3Instance
    ) {
      return;
    }

    getAmountContributedCached({
      daoABI,
      daoAddress,
      web3Instance,
    });
  }, [daoABI, daoAddress, getAmountContributedCached, web3Instance]);

  /**
   * Functions
   */

  async function getAmountContributed({
    daoABI,
    daoAddress,
    web3Instance,
  }: {
    daoAddress: string;
    daoABI: AbiItem[];
    web3Instance: Web3;
  }) {
    try {
      if (!CONFIGURATION_UPDATED_EVENT_SIGNATURE_HASH) return;
      if (!KYC_ONBOARDING_CHUNK_SIZE_KEY_HASH) return;

      const configurationUpdatedEventInputs = daoABI.find(
        ({name, type}) => type === 'event' && name === 'ConfigurationUpdated'
      )?.inputs;

      if (!configurationUpdatedEventInputs) return;

      setAmountContributedStatus(PENDING);

      const transfers = await alchemyFetchAssetTransfers(
        {
          category: ['external', 'internal', 'token'],
          toAddress: multisigAddress,
        },
        {abortController}
      );

      const daoConfigUpdatedLogs = await web3Instance.eth.getPastLogs({
        fromBlock: 0,
        address: daoAddress,
        topics: [CONFIGURATION_UPDATED_EVENT_SIGNATURE_HASH],
      });

      const chunkSizeValues = daoConfigUpdatedLogs
        // Decode each log
        .map(
          (c) =>
            web3Instance.eth.abi.decodeLog(
              configurationUpdatedEventInputs,
              c.data,
              [CONFIGURATION_UPDATED_EVENT_SIGNATURE_HASH]
            ) as any as ConfigurationUpdated['returnValues']
        )
        // Only take `key`s matching `KYC_ONBOARDING_CHUNK_SIZE_KEY_HASH`
        .filter(
          (d) =>
            normalizeString(d.key) ===
            normalizeString(KYC_ONBOARDING_CHUNK_SIZE_KEY_HASH)
        )
        // Only take the config `value`s, converted to ETH
        .map((c) => fromWei(c.value, 'ether'));

      /**
       * Get amount contributed
       *
       * Assumes we're working with normal `number`s, not big numbers.
       */
      const amountContributed: number = transfers
        // Only take transfers which have assets in `ALLOWED_ASSETS`
        .filter((t) =>
          ALLOWED_ASSETS.some((a) => a === normalizeString(t.asset || ''))
        )
        .map((t) => t.value)
        // Only take values which are multiples of a chunk size config value
        .filter((v) => v && chunkSizeValues.some((c) => v % Number(c) === 0))
        .reduce((acc: number, next) => (acc += next || 0), 0);

      if (!isMountedRef.current) return;

      setAmountContributedStatus(FULFILLED);
      setAmountContributed(amountContributed);
    } catch (error) {
      if (!isMountedRef.current) return;

      setAmountContributedStatus(REJECTED);
    }
  }

  return {
    amountContributed,
    amountContributedStatus,
  };
}
