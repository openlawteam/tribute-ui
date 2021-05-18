import {useLocation} from 'react-router-dom';
import {useCallback, useEffect, useState} from 'react';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import RedeemManager from './RedeemManager';
import {useWeb3Modal} from '../../components/web3/hooks';
import {COUPON_API_URL} from '../../config';

export default function RedeemCoupon() {
  const [redeemableCoupon, setReedemableCoupon] = useState<any[]>([]); // @todo typify
  const [isInProcess, setIsInProcess] = useState<boolean>(false);

  const location = useLocation<{coupon: string}>();
  const coupon = new URLSearchParams(location.search).get('coupon');

  const {connected, account} = useWeb3Modal();

  const checkBySigOrAddrCached = useCallback(checkBySigOrAddr, [coupon]);

  /**
   * Effects
   */

  useEffect(() => {
    if (account && connected) {
      checkBySigOrAddrCached();
    }
  }, [account, connected, checkBySigOrAddrCached]);

  /**
   * Functions
   */

  // check using signature or eth addr
  async function checkBySigOrAddr() {
    try {
      setIsInProcess(true);
      // handle adding new authorized user to thee `auth` tbl
      const response = await fetch(`${COUPON_API_URL}/api/coupon/redeem`, {
        method: 'POST',
        body: JSON.stringify({
          // search by signature or eth addr
          // ...(query.coupon === undefined || !query.coupon
          //   ? { recipient: account.toLowerCase() }
          //   : { signature: query.coupon }),

          // @note only checking signature for now
          signature: coupon,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const coupons = await response.json();

      setReedemableCoupon(coupons);
      setIsInProcess(false);
    } catch (error) {
      setIsInProcess(false);
    }
  }

  /**
   * Render
   */

  // check if user doesn't have a connected wallet
  if (!connected) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p className="color-brightsalmon">
            Connect your wallet to redeem a coupon.
          </p>
        </div>
      </RenderWrapper>
    );
  }

  if (connected && isInProcess) {
    return (
      <RenderWrapper>
        <LoaderWithEmoji />
        <p>Checking... please wait</p>
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

  if (
    !redeemableCoupon ||
    !redeemableCoupon.length ||
    redeemableCoupon[0]?.recipient.toLowerCase() !== account?.toLowerCase()
  ) {
    return (
      <RenderWrapper>
        <p className="color-brightsalmon">
          Coupon not found for this connected account.
        </p>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <RedeemManager redeemables={redeemableCoupon} />
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Redeem a Coupon</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            <p>
              Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla
              consectetur id nec massa. Aliquam erat volutpat. Sed ut dui ut
              lacus dictum fermentum vel tincidunt neque. Sed sed lacinia...
            </p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
