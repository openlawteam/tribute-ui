import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {toChecksumAddress} from 'web3-utils';

import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../components/web3/hooks';
import {COUPON_API_URL} from '../config';
import {ERC20RegisterDetails} from '../components/dao-token/DaoToken';
import {getConnectedMember} from '../store/actions';
import {ReduxDispatch, StoreState} from '../store/types';
import {Web3TxStatus} from '../components/web3/types';
import {normalizeString} from '../util/helpers';

export enum FetchStatus {
  STANDBY = 'STANDBY',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}

type RedeemCouponArguments = [
  string, // `dao`
  string, // `authorizedMember`
  string, // `amount`
  number, // `nonce`
  string // `signature`
];

type ReturnUseRedeemCoupon = {
  isInProcessOrDone: boolean;
  redeemCoupon: (
    {redeemableCoupon}: Record<string, any>,
    erc20Details?: ERC20RegisterDetails
  ) => Promise<void>;
  submitStatus: FetchStatus;
  submitError: Error | undefined;
  txStatus: Web3TxStatus;
  txError: Error | undefined;
  txEtherscanURL: string;
  txIsPromptOpen: boolean;
};

export function useRedeemCoupon(): ReturnUseRedeemCoupon {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  const couponOnboardingContract = useSelector(
    (s: StoreState) => s.contracts.CouponOnboardingContract
  );

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();
  const [submitStatus, setSubmitStatus] = useState<FetchStatus>(
    FetchStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();
  const {defaultChainError} = useIsDefaultChain();
  const {average: gasPrice} = useETHGasPrice();

  const {txError, txEtherscanURL, txIsPromptOpen, txSend, txStatus} =
    useContractSend();

  /**
   * Their hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Variables
   */

  const isInProcessOrDone =
    submitStatus === FetchStatus.PENDING ||
    submitStatus === FetchStatus.FULFILLED;

  /**
   * Functions
   */

  async function handleRedeemCoupon(
    redeemableCoupon: Record<string, any>,
    erc20Details?: ERC20RegisterDetails
  ) {
    try {
      if (defaultChainError) {
        throw new Error('Wrong network connected.');
      }

      if (!redeemableCoupon) {
        throw new Error('No coupon data was found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!couponOnboardingContract) {
        throw new Error('No Coupon Onboarding contract was found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      setSubmitStatus(FetchStatus.PENDING);

      const applicantAddressToChecksum = toChecksumAddress(
        redeemableCoupon.recipient
      );

      // initiate tx
      const redeemCouponArguments: RedeemCouponArguments = [
        daoRegistryContract.contractAddress,
        applicantAddressToChecksum,
        String(redeemableCoupon.amount),
        Number(redeemableCoupon.nonce),
        redeemableCoupon.signature,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call for `redeemCoupon`
      const txReceipt = await txSend(
        'redeemCoupon',
        couponOnboardingContract.instance.methods,
        redeemCouponArguments,
        txArguments
      );

      if (txReceipt) {
        // update the db and send email
        const response = await fetch(`${COUPON_API_URL}/api/coupon/redeem`, {
          method: 'PATCH',
          body: JSON.stringify({
            // search by signature
            signature: redeemableCoupon.signature,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Something went wrong while updating the coupon.');
        }

        setSubmitStatus(FetchStatus.FULFILLED);

        // if connected account is the coupon recipient
        if (
          normalizeString(redeemableCoupon.recipient) ===
          normalizeString(account)
        ) {
          // re-fetch member
          await dispatch(
            getConnectedMember({
              account,
              daoRegistryContract,
              web3Instance,
            })
          );

          // suggest adding DAO token to wallet
          await addTokenToWallet(erc20Details);
        }
      }
    } catch (error) {
      setSubmitError(error);
      setSubmitStatus(FetchStatus.REJECTED);
    }
  }

  async function addTokenToWallet(erc20Details?: ERC20RegisterDetails) {
    if (!erc20Details) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: erc20Details,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  return {
    isInProcessOrDone,
    redeemCoupon: handleRedeemCoupon,
    submitError,
    submitStatus,
    txStatus,
    txError,
    txEtherscanURL,
    txIsPromptOpen,
  };
}
