import {useLocation} from 'react-router-dom';
import {useCallback, useEffect, useState} from 'react';
import {toChecksumAddress} from 'web3-utils';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import RedeemManager from './RedeemManager';
import {useWeb3Modal} from '../../components/web3/hooks';
import {COUPON_API_URL} from '../../config';
import {truncateEthAddress} from '../../util/helpers/truncateEthAddress';

type RedeemCouponType = {
  amount: number;
  dao: {daoAddress: string};
  isRedeemed: boolean;
  nonce: number;
  recipient: string;
  signature: string;
};

export default function RedeemCoupon() {
  const [redeemableCoupon, setReedemableCoupon] = useState<RedeemCouponType[]>(
    []
  );
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
            Connect your wallet to redeem coupon.
          </p>
        </div>
      </RenderWrapper>
    );
  }

  if (connected && isInProcess) {
    return (
      <RenderWrapper>
        <LoaderWithEmoji emoji={'🎟'} />
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
          {redeemableCoupon[0].recipient ? (
            <>
              Connect with{' '}
              <span className="redeemcard__address">
                {truncateEthAddress(
                  toChecksumAddress(redeemableCoupon[0].recipient),
                  7
                )}
              </span>{' '}
              account to view coupon.
            </>
          ) : (
            'Coupon not found for this connected account.'
          )}
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
          <h2 className="titlebar__title">Redeem Coupon</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            <p>Redeem your coupon to get your membership units.</p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
