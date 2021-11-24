import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {useLazyQuery} from '@apollo/react-hooks';
import {AbiItem, toBN, toChecksumAddress} from 'web3-utils';

import {StoreState} from '../../../store/types';
import {GET_TOKEN_HOLDER_BALANCES} from '../../../gql';
import {useWeb3Modal} from '../../../components/web3/hooks';
import {SubgraphNetworkStatus} from '../../../store/subgraphNetworkStatus/types';
import {multicall, MulticallTuple} from '../../../components/web3/helpers';

type UseTokenHolderBalancesReturn = {
  tokenHolderBalances: Record<string, any> | undefined;
  tokenHolderBalancesError: Error | undefined;
};

/**
 * useTokenHolderBalances
 *
 * This component queries The Graph API to get data on the token holders with
 * direct onchain fallback.
 *
 * @returns {UseTokenHolderBalancesReturn}
 */
export function useTokenHolderBalances(): UseTokenHolderBalancesReturn {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract
  );

  const erc20ExtensionContract = useSelector(
    (s: StoreState) => s.contracts?.ERC20ExtensionContract
  );

  const connectedMember = useSelector((s: StoreState) => s.connectedMember);

  const subgraphNetworkStatus = useSelector(
    (state: StoreState) => state.subgraphNetworkStatus.status
  );

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * GQL Query
   */

  const [
    getTokenHolderBalancesFromSubgraphResult,
    {called, loading, data, error, startPolling, stopPolling},
  ] = useLazyQuery(GET_TOKEN_HOLDER_BALANCES, {
    variables: {
      tokenAddress: erc20ExtensionContract?.contractAddress.toLowerCase(),
    },
  });

  /**
   * State
   */

  const [tokenHolderBalances, setTokenHolderBalances] = useState<
    Record<string, any> | undefined
  >();

  const [tokenHolderBalancesError, setTokenHolderBalancesError] =
    useState<Error>();

  /**
   * Cached callbacks
   */

  const getTokenHolderBalancesFromExtensionCached = useCallback(
    getTokenHolderBalancesFromExtension,
    [daoRegistryContract, erc20ExtensionContract, web3Instance]
  );

  const getTokenHolderBalancesFromSubgraphCached = useCallback(
    getTokenHolderBalancesFromSubgraph,
    [
      data,
      erc20ExtensionContract?.contractAddress,
      error,
      getTokenHolderBalancesFromExtensionCached,
      loading,
    ]
  );

  /**
   * Effects
   */

  useEffect(() => {
    if (!called && erc20ExtensionContract?.contractAddress) {
      getTokenHolderBalancesFromSubgraphResult();
    }
  }, [
    called,
    erc20ExtensionContract?.contractAddress,
    getTokenHolderBalancesFromSubgraphResult,
  ]);

  useEffect(() => {
    if (subgraphNetworkStatus === SubgraphNetworkStatus.OK) {
      if (!loading && erc20ExtensionContract?.contractAddress) {
        getTokenHolderBalancesFromSubgraphCached();
      }
    } else {
      // If there is a subgraph network error fallback to fetching token holder
      // info directly from smart contract
      getTokenHolderBalancesFromExtensionCached();
    }
  }, [
    erc20ExtensionContract?.contractAddress,
    getTokenHolderBalancesFromExtensionCached,
    getTokenHolderBalancesFromSubgraphCached,
    loading,
    subgraphNetworkStatus,
  ]);

  // When the `SET_CONNECTED_MEMBER` redux action is dispatched in other
  // components (to refetch the connected user's member status info) the
  // `useSelector` hook above will return a new `connectedMember` object. By
  // default, the `useEffect` hook uses a strict equality comparison which will
  // consider the new object a changed value (even if the individual fields are
  // the same from the previous `connectedMember` store state). This change is
  // used to trigger a refresh of the `GET_TOKEN_HOLDER_BALANCES` query result
  // so any change to the connected token holder's balance can be shown in the
  // nav badge without having to do a page reload.
  useEffect(() => {
    // a single refetch may not be enough to catch any token balance change so
    // we poll but only for a short time period
    connectedMember && startPolling && startPolling(2000);

    const pollingTimeoutId = stopPolling && setTimeout(stopPolling, 8000);

    return function cleanup() {
      pollingTimeoutId && clearTimeout(pollingTimeoutId);
    };
  }, [connectedMember, startPolling, stopPolling]);

  /**
   * Functions
   */

  function getTokenHolderBalancesFromSubgraph() {
    try {
      if (!loading && data) {
        if (data.tokens.length === 0) {
          throw new Error(
            `"${erc20ExtensionContract?.contractAddress}" erc20 address not found.`
          );
        }

        setTokenHolderBalances(data.tokens[0]);
      } else {
        if (error) {
          throw new Error(
            `"${erc20ExtensionContract?.contractAddress}" is not a valid erc20 address.`
          );
        }
      }
    } catch (error) {
      // If there is a subgraph query error fallback to fetching token holder
      // info directly from smart contract
      console.log(`subgraph query error: ${error.message}`);
      getTokenHolderBalancesFromExtensionCached();
    }
  }

  async function getTokenHolderBalancesFromExtension() {
    if (!daoRegistryContract || !erc20ExtensionContract || !web3Instance) {
      return;
    }

    try {
      const {
        abi: daoRegistryABI,
        contractAddress: daoRegistryAddress,
        instance: {methods: daoRegistryMethods},
      } = daoRegistryContract;

      const nbMembers = await daoRegistryMethods.getNbMembers().call();

      if (Number(nbMembers) > 0) {
        // Build calls to get list of member addresses
        const getMemberAddressABI = daoRegistryABI.find(
          (item) => item.name === 'getMemberAddress'
        );
        const getMemberAddressCalls = [...Array(Number(nbMembers)).keys()].map(
          (index): MulticallTuple => [
            daoRegistryAddress,
            getMemberAddressABI as AbiItem,
            [index.toString()],
          ]
        );
        const memberAddresses: string[] = await multicall({
          calls: getMemberAddressCalls,
          web3Instance,
        });

        // Build calls to get member balances in DAO ERC20 token
        const {abi: erc20ExtensionABI, contractAddress: erc20ExtensionAddress} =
          erc20ExtensionContract;

        const balanceOfABI = erc20ExtensionABI.find(
          (item) => item.name === 'balanceOf'
        );
        const erc20ExtensionBalanceOfCalls = memberAddresses.map(
          (address): MulticallTuple => [
            erc20ExtensionAddress,
            balanceOfABI as AbiItem,
            [address],
          ]
        );
        const erc20ExtensionBalances: string[] = await multicall({
          calls: erc20ExtensionBalanceOfCalls,
          web3Instance,
        });

        const holdersWithDetails = memberAddresses.map((address, index) => ({
          member: {
            id: address,
          },
          balance: erc20ExtensionBalances[index],
        }));

        // Filter out any member addresses that don't have a positive balance in
        // DAO ERC20 token
        const filteredHoldersWithDetails = holdersWithDetails.filter((holder) =>
          toBN(holder.balance).gt(toBN(0))
        );

        // DAO ERC20 token info
        const tokenAddress = toChecksumAddress(
          erc20ExtensionContract.contractAddress
        );

        const tokenSymbol = await erc20ExtensionContract.instance.methods
          .symbol()
          .call();

        setTokenHolderBalances({
          holders: filteredHoldersWithDetails,
          symbol: tokenSymbol,
          tokenAddress,
        });
      }
    } catch (error) {
      setTokenHolderBalances(undefined);
      setTokenHolderBalancesError(error);
    }
  }

  return {
    tokenHolderBalances,
    tokenHolderBalancesError,
  };
}
