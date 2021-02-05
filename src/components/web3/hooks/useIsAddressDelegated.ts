import {useSelector} from 'react-redux';

import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from './useWeb3Modal';

export function useIsAddressDelegated(): boolean {
  /**
   * Selectors
   */

  const delegateKey =
    useSelector((s: StoreState) => s.connectedMember?.delegateKey) || '';
  const memberAddress =
    useSelector((s: StoreState) => s.connectedMember?.memberAddress) || '';

  /**
   * Our hooks
   */

  const {account = ''} = useWeb3Modal();

  return (
    normalizeString(account) === normalizeString(memberAddress) &&
    normalizeString(account) !== normalizeString(delegateKey)
  );
}
