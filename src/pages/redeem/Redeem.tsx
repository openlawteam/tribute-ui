import {useCallback, useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import {COUPON_API_URL} from '../../config';
import {useAbortController} from '../../hooks';
import {useIsDefaultChain, useWeb3Modal} from '../../components/web3/hooks';
import FadeIn from '../../components/common/FadeIn';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import RedeemManager from './RedeemManager';
import Wrap from '../../components/common/Wrap';
import {useDaoTokenDetails} from '../../components/dao-token/hooks';

type RedeemCouponType = {
  amount: number;
  dao: {daoAddress: string};
  isRedeemed: boolean;
  nonce: number;
  recipient: string;
  signature: string;
};

export default function RedeemCoupon() {
  /**
   * State
   */

  const [redeemableCoupon, setReedemableCoupon] = useState<RedeemCouponType[]>(
    []
  );
  const [couponStatus, setCouponStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {connected, account} = useWeb3Modal();
  const {defaultChainError} = useIsDefaultChain();
  const {abortController, isMountedRef} = useAbortController();
  const {daoTokenDetails, daoTokenDetailsStatus} = useDaoTokenDetails();

  /**
   * Their hooks
   */

  const location = useLocation<{coupon: string}>();

  /**
   * Variables
   */

  const coupon = new URLSearchParams(location.search).get('coupon');

  const isInProcess =
    couponStatus === AsyncStatus.STANDBY ||
    couponStatus === AsyncStatus.PENDING ||
    daoTokenDetailsStatus === AsyncStatus.STANDBY ||
    daoTokenDetailsStatus === AsyncStatus.PENDING;

  /**
   * Cached callbacks
   */

  const checkBySigOrAddrCached = useCallback(checkBySigOrAddr, [
    abortController?.signal,
    coupon,
    isMountedRef,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (!account || !connected || defaultChainError) return;

    checkBySigOrAddrCached();
  }, [account, connected, checkBySigOrAddrCached, defaultChainError]);

  /**
   * Functions
   */

  // check using signature or eth addr
  async function checkBySigOrAddr() {
    try {
      if (!abortController?.signal) return;

      setCouponStatus(AsyncStatus.PENDING);

      // handle adding new authorized user to thee `auth` tbl
      const response = await fetch(`${COUPON_API_URL}/api/coupon/redeem`, {
        method: 'POST',
        body: JSON.stringify({
          signature: coupon,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
      });

      if (!isMountedRef.current) return;

      const coupons = await response.json();

      setReedemableCoupon(coupons);
      setCouponStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      if (!isMountedRef.current) return;

      setCouponStatus(AsyncStatus.REJECTED);
    }
  }

  /**
   * Render
   */

  // check if user doesn't have a connected wallet
  if (!connected) {
    return (
      <RenderWrapper>
        <p className="color-brightsalmon">
          Connect your wallet to view the coupon.
        </p>
      </RenderWrapper>
    );
  }

  if (defaultChainError) {
    return (
      <RenderWrapper>
        <p className="color-brightsalmon">{defaultChainError.message}</p>
      </RenderWrapper>
    );
  }

  if (connected && isInProcess) {
    return (
      <RenderWrapper>
        <LoaderWithEmoji emoji={'🎟'} />
        <p>Checking&hellip; please wait.</p>
      </RenderWrapper>
    );
  }

  if (coupon === undefined || !coupon) {
    return (
      <RenderWrapper>
        <p className="color-brightsalmon">Coupon signature missing.</p>
      </RenderWrapper>
    );
  }

  if (!redeemableCoupon || !redeemableCoupon.length) {
    return (
      <RenderWrapper>
        <p className="color-brightsalmon">Coupon not found.</p>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <RedeemManager
        daoTokenDetails={daoTokenDetails}
        redeemables={redeemableCoupon}
      />
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Redeem Coupon</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            <p>Redeem coupon to issue the membership tokens.</p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
