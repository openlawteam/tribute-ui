import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../../store/types';
import {ERC20RegisterDetails} from '../DaoToken';
import {AsyncStatus} from '../../../util/types';

type UseDaoTokenDetailsReturn = {
  daoTokenDetails: ERC20RegisterDetails | undefined;
  daoTokenDetailsError: Error | undefined;
  daoTokenDetailsStatus: AsyncStatus;
};

/**
 * useDaoTokenDetails
 *
 * Gets DAO token details from ERC20Extension contract.
 *
 * @returns {UseDaoTokenDetailsReturn}
 */
export function useDaoTokenDetails(): UseDaoTokenDetailsReturn {
  /**
   * Selectors
   */

  const ERC20ExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.ERC20ExtensionContract
  );

  /**
   * State
   */

  const [daoTokenDetails, setDaoTokenDetails] =
    useState<ERC20RegisterDetails>();
  const [daoTokenDetailsStatus, setDaoTokenDetailsStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);
  const [daoTokenDetailsError, setDaoTokenDetailsError] = useState<Error>();

  /**
   * Cached callbacks
   */

  const getDaoTokenDetailsCached = useCallback(getDaoTokenDetails, [
    ERC20ExtensionContract,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getDaoTokenDetailsCached();
  }, [getDaoTokenDetailsCached]);

  /**
   * Functions
   */

  async function getDaoTokenDetails() {
    if (!ERC20ExtensionContract) return;

    try {
      setDaoTokenDetailsStatus(AsyncStatus.PENDING);

      const symbol = await ERC20ExtensionContract.instance.methods
        .symbol()
        .call();
      const decimals = await ERC20ExtensionContract.instance.methods
        .decimals()
        .call();

      setDaoTokenDetails({
        address: ERC20ExtensionContract.contractAddress,
        symbol,
        decimals: Number(decimals),
        image: `${window.location.origin}/favicon.ico`,
      });

      setDaoTokenDetailsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      const e = error as Error;

      console.log(e);
      setDaoTokenDetails(undefined);
      setDaoTokenDetailsError(e);
      setDaoTokenDetailsStatus(AsyncStatus.REJECTED);
    }
  }

  return {daoTokenDetails, daoTokenDetailsError, daoTokenDetailsStatus};
}
