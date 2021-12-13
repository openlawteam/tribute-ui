import {useCallback, useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../../../util/types';
import {CycleEllipsis} from '../../feedback';
import {featureFlags} from '../../../util/features';
import {KYC_BACKEND_URL} from '../../../config';
import {StoreState} from '../../../store/types';
import {useAbortController} from '../../../hooks';
import {useIsDefaultChain} from '../../web3/hooks';

type KycCertificate = {
  isWhitelisted: boolean;
  signature: string;
  // `entityType` was used before to determine the minimum contribution amount,
  // but is no longer needed in the current implementation.
  // entityType: string;
};

type UseVerifyKYCApplicantReturn = {
  kycCheckCertificate: KycCertificate | undefined;
  kycCheckError: Error | undefined;
  kycCheckMessageJSX: React.ReactElement | undefined;
  kycCheckStatus: AsyncStatus;
  setKYCCheckETHAddress: (a: string) => void;
  setKYCCheckRedirect: (a: string) => void;
};

const CHECK_IN_PROGRESS_JSX = (
  <>
    Checking your KYC status
    <CycleEllipsis />
  </>
);

const REDIRECT_IN_PROGRESS_JSX = (
  <>
    Redirecting you to our KYC form
    <CycleEllipsis />
  </>
);

const NOT_WHITELISTED_JSX = (
  <>
    The applicant address has been KYC verified, but has not been authorized to
    join yet.
  </>
);

const PENDING_VERIFICATION_JSX = (
  <>
    KYC verification for the applicant address is pending and must be completed
    first.
    <br />
    Please try again later.
  </>
);

/**
 * Delays setting React state. Default delay is 2000ms.
 *
 * e.g. Delay updating UI messages which arrive async for better readability.
 *
 * @todo Maybe make into a util.
 *
 * @param setState React set state function
 * @returns (s: T, d: number) => Promise<void>
 */
function setStateWithDelay<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
): (state: T, delay?: number) => Promise<void> {
  return async (state: T, delay: number = 2000) => {
    await new Promise((r) => setTimeout(r, delay));

    setState(state);
  };
}

export function useVerifyKYCApplicant(): UseVerifyKYCApplicantReturn {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  /**
   * State
   */

  const [kycCheckStatus, setKYCCheckStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  const [kycCheckCertificate, setKYCCheckCertificate] =
    useState<KycCertificate>();

  const [kycCheckError, setKYCCheckError] = useState<Error>();

  const [kycCheckMessageJSX, setKYCCheckMessageJSX] =
    useState<React.ReactElement>();

  const [ethAddress, setETHAddress] = useState<string>('');

  const [redirect, setRedirect] = useState<string>('');

  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();
  const {defaultChainError} = useIsDefaultChain();

  /**
   * Cached values
   */

  const setKYCCheckMessageJSXWithDelay = useMemo(
    () => setStateWithDelay<typeof kycCheckMessageJSX>(setKYCCheckMessageJSX),
    []
  );

  const setRedirectWithDelay = useMemo(
    () => setStateWithDelay<typeof redirect>(setRedirect),
    []
  );

  /**
   * Cached callback
   */

  const verifyApplicantKYCCached = useCallback(verifyApplicantKYC, [
    abortController?.signal,
    daoRegistryContract,
    defaultChainError,
    ethAddress,
    isMountedRef,
    setKYCCheckMessageJSXWithDelay,
  ]);

  /**
   * Effects
   */

  // Run verify check
  useEffect(() => {
    verifyApplicantKYCCached();
  }, [verifyApplicantKYCCached]);

  // Redirect to KYC verify form
  useEffect(() => {
    if (!shouldRedirect || !redirect) return;

    window.location.href = redirect;
  }, [kycCheckStatus, redirect, shouldRedirect]);

  // Cleanup async processes
  useEffect(() => {
    return function cleanup() {
      abortController?.abort();
    };
  }, [abortController]);

  /**
   * Functions
   */

  async function verifyApplicantKYC() {
    try {
      if (!abortController?.signal) return;

      if (!daoRegistryContract || !ethAddress || defaultChainError) {
        setKYCCheckCertificate(undefined);
        setKYCCheckError(undefined);
        setKYCCheckStatus(AsyncStatus.STANDBY);

        return;
      }

      setKYCCheckMessageJSX(CHECK_IN_PROGRESS_JSX);
      setKYCCheckStatus(AsyncStatus.PENDING);

      const response = await fetch(
        `${KYC_BACKEND_URL}/${daoRegistryContract.contractAddress}/${ethAddress}`,
        {signal: abortController.signal}
      );

      const responseJSON = await response.json();

      if (response.status === 404) {
        setKYCCheckCertificate(undefined);
        setKYCCheckMessageJSX(REDIRECT_IN_PROGRESS_JSX);
        setKYCCheckStatus(AsyncStatus.REJECTED);
        setShouldRedirect(true);

        return;
      }

      if (!response.ok) {
        if (responseJSON.message.includes('pending verification')) {
          setKYCCheckCertificate(undefined);
          setKYCCheckMessageJSXWithDelay(PENDING_VERIFICATION_JSX);
          setKYCCheckStatus(AsyncStatus.REJECTED);

          return;
        } else {
          throw new Error(responseJSON.message);
        }
      }

      // If the whitelist flag is set, check if the verified address is
      // whitelisted
      if (
        !responseJSON.isWhitelisted &&
        featureFlags?.joinIsWhitelisted &&
        response.ok
      ) {
        setKYCCheckCertificate(undefined);
        setKYCCheckMessageJSXWithDelay(NOT_WHITELISTED_JSX);
        setKYCCheckStatus(AsyncStatus.FULFILLED);

        return;
      }

      if (!isMountedRef.current) return;

      setKYCCheckCertificate(responseJSON);
      setKYCCheckError(undefined);
      setKYCCheckMessageJSX(undefined);
      setKYCCheckStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      if (!isMountedRef.current) return;

      const e = error as Error;

      setKYCCheckCertificate(undefined);
      setKYCCheckError(e);
      setKYCCheckStatus(AsyncStatus.REJECTED);
    }
  }

  return {
    kycCheckCertificate,
    kycCheckError,
    kycCheckMessageJSX,
    kycCheckStatus,
    setKYCCheckETHAddress: setETHAddress,
    setKYCCheckRedirect: setRedirectWithDelay,
  };
}
