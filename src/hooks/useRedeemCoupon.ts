import {useState} from 'react';
import {AbiItem} from 'web3-utils/types';
import {toChecksumAddress} from 'web3-utils';
import {getAdapterAddress} from '../components/web3/helpers';
import {ContractAdapterNames, Web3TxStatus} from '../components/web3/types';
import {COUPON_API_URL} from '../config';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../components/web3/hooks';
import {ERC20RegisterDetails} from '../components/dao-token/DaoToken';

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
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();
  const [submitStatus, setSubmitStatus] = useState<FetchStatus>(
    FetchStatus.STANDBY
  );

  /**
   * Hooks
   */

  const gasPrices = useETHGasPrice();
  const {account, web3Instance} = useWeb3Modal();
  const {defaultChainError} = useIsDefaultChain();

  const {txError, txEtherscanURL, txIsPromptOpen, txSend, txStatus} =
    useContractSend();

  /**
   * Variables
   */

  const isInProcessOrDone =
    submitStatus === FetchStatus.PENDING ||
    submitStatus === FetchStatus.FULFILLED;

  /**
   * Effects
   */

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

      setSubmitStatus(FetchStatus.PENDING);

      const {
        dao: {daoAddress: daoRegistryAddress},
      } = redeemableCoupon;

      const {default: lazyDaoRegistryABI} = await import(
        '../truffle-contracts/DaoRegistry.json'
      );
      const {default: lazyCouponOnboardingABI} = await import(
        '../truffle-contracts/CouponOnboardingContract.json'
      );

      const daoRegistryContractABI: AbiItem[] = lazyDaoRegistryABI as any;
      const couponOnboardingContractABI: AbiItem[] =
        lazyCouponOnboardingABI as any;

      const daoRegistryInstance = new web3Instance.eth.Contract(
        daoRegistryContractABI,
        daoRegistryAddress
      );

      const couponOnboardingAddress = await getAdapterAddress(
        ContractAdapterNames.coupon_onboarding,
        daoRegistryInstance
      );

      const couponOnboardingInstance = new web3Instance.eth.Contract(
        couponOnboardingContractABI,
        couponOnboardingAddress
      );

      const applicantAddressToChecksum = toChecksumAddress(
        redeemableCoupon.recipient
      );

      // initiate tx
      const redeemCouponArguments: RedeemCouponArguments = [
        daoRegistryAddress,
        applicantAddressToChecksum,
        String(redeemableCoupon.amount),
        Number(redeemableCoupon.nonce),
        redeemableCoupon.signature,
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `redeemCoupon`
      const tx = await txSend(
        'redeemCoupon',
        couponOnboardingInstance.methods,
        redeemCouponArguments,
        txArguments
      );

      if (tx) {
        // update the db and send email
        await fetch(`${COUPON_API_URL}/api/coupon/redeem`, {
          method: 'PATCH',
          body: JSON.stringify({
            // search by signature
            signature: redeemableCoupon.signature,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      setSubmitStatus(FetchStatus.FULFILLED);

      // suggest adding DAO token to wallet
      await addTokenToWallet(erc20Details);
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
