import {useCallback, useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import {ERC20RegisterDetails} from '../../components/dao-token/DaoToken';
import RedeemManager from './RedeemManager';
import {useWeb3Modal} from '../../components/web3/hooks';
import {COUPON_API_URL} from '../../config';
import {AsyncStatus} from '../../util/types';

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
   * Selectors
   */

  const ERC20ExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.ERC20ExtensionContract
  );

  /**
   * State
   */

  const [redeemableCoupon, setReedemableCoupon] = useState<RedeemCouponType[]>(
    []
  );
  const [couponStatus, setCouponStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );
  const [erc20Details, setERC20Details] = useState<ERC20RegisterDetails>();
  const [erc20DetailsStatus, setERC20DetailsStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {connected, account} = useWeb3Modal();

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
    erc20DetailsStatus === AsyncStatus.STANDBY ||
    erc20DetailsStatus === AsyncStatus.PENDING;

  /**
   * Cached callbacks
   */

  const checkBySigOrAddrCached = useCallback(checkBySigOrAddr, [coupon]);
  const getERC20DetailsCached = useCallback(getERC20Details, [
    ERC20ExtensionContract,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (account && connected) {
      checkBySigOrAddrCached();
    }
  }, [account, connected, checkBySigOrAddrCached]);

  useEffect(() => {
    getERC20DetailsCached();
  }, [getERC20DetailsCached]);

  /**
   * Functions
   */

  // check using signature or eth addr
  async function checkBySigOrAddr() {
    try {
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
      });

      const coupons = await response.json();

      setReedemableCoupon(coupons);
      setCouponStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setCouponStatus(AsyncStatus.REJECTED);
    }
  }

  async function getERC20Details() {
    if (!ERC20ExtensionContract) return;

    try {
      setERC20DetailsStatus(AsyncStatus.PENDING);
      const address = ERC20ExtensionContract.contractAddress;
      const symbol = await ERC20ExtensionContract.instance.methods
        .symbol()
        .call();
      const decimals = await ERC20ExtensionContract.instance.methods
        .decimals()
        .call();
      const image = `${window.location.origin}/favicon.ico`;
      setERC20Details({
        address,
        symbol,
        decimals: Number(decimals),
        image,
      });
      setERC20DetailsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      console.log(error);
      setERC20Details(undefined);
      setERC20DetailsStatus(AsyncStatus.REJECTED);
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
            Connect your wallet to view coupon.
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
        redeemables={redeemableCoupon}
        erc20Details={erc20Details}
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
