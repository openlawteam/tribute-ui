import {renderHook, act} from '@testing-library/react-hooks';

import {useRedeemCoupon, FetchStatus} from '.';
import {Web3TxStatus} from '../components/web3/types';
// import {waitFor} from '@testing-library/react';
import Wrapper from '../test/Wrapper';

describe('useRedeemCoupon unit tests', () => {
  test('should return correct data when wallet is disconnected', async () => {
    const {result} = renderHook(() => useRedeemCoupon(), {
      initialProps: {
        useInit: true,
      },
      wrapper: Wrapper,
    });

    // Assert initial state
    expect(result.current.isInProcessOrDone).toBe(false);
    expect(result.current.redeemCoupon).toBeInstanceOf(Function);
    expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
    expect(result.current.submitError).toBe(undefined);
    expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(false);
  });
});
