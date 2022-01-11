import {act, renderHook} from '@testing-library/react-hooks';

import {
  kycCertificateCheckResponse,
  kycCertificateNotFoundErrorResponse,
  kycCertificatePendingErrorResponse,
} from '../../../test/restResponses';
import {AsyncStatus} from '../../../util/types';
import {CycleEllipsis} from '../../feedback';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {KYC_BACKEND_URL} from '../../../config';
import {server, rest} from '../../../test/server';
import {useVerifyKYCApplicant} from '.';
import Wrapper from '../../../test/Wrapper';

describe('useVerifyKYCApplicant unit tests', () => {
  test('should return correct data when OK', async () => {
    await act(async () => {
      const {result, waitForValueToChange, waitFor} = await renderHook(
        () => useVerifyKYCApplicant(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitFor(() => {
        // Assert initial state
        expect(result.current.kycCheckCertificate).toBe(undefined);
        expect(result.current.kycCheckError).toBe(undefined);
        expect(result.current.kycCheckStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
      });

      // Set address
      result.current.setKYCCheckETHAddress(DEFAULT_ETH_ADDRESS);

      await waitForValueToChange(() => result.current.kycCheckStatus);

      // Assert pending message
      await waitFor(() => {
        expect(result.current.kycCheckMessageJSX).toEqual(
          <>
            Checking your KYC status
            <CycleEllipsis />
          </>
        );
      });

      await waitFor(() => {
        // Assert response state
        expect(result.current.kycCheckCertificate).toEqual(
          kycCertificateCheckResponse
        );
        expect(result.current.kycCheckError).toBe(undefined);
        expect(result.current.kycCheckMessageJSX).toBe(undefined);
        expect(result.current.kycCheckStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
      });
    });
  });

  test('should return correct data when 404 response', async () => {
    const REDIRECT: string = 'https://kyc.reddao.xyz';

    // Navigation isn't defined in JSDOM
    Object.defineProperty(window, 'location', {
      // Just need any valid URL for now
      value: new URL('https://reddao.xyz/join'),
    });

    server.use(
      rest.get(
        `${KYC_BACKEND_URL}/:daoAddress/:ethAddressToCheck`,
        async (_req, res, ctx) =>
          res(ctx.status(404), ctx.json(kycCertificateNotFoundErrorResponse))
      )
    );

    await act(async () => {
      const {result, waitFor, waitForNextUpdate} = await renderHook(
        () => useVerifyKYCApplicant(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitFor(() => {
        // Assert initial state
        expect(result.current.kycCheckCertificate).toBe(undefined);
        expect(result.current.kycCheckError).toBe(undefined);
        expect(result.current.kycCheckMessageJSX).toBe(undefined);
        expect(result.current.kycCheckStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
        expect(result.current.setKYCCheckRedirect).toBeInstanceOf(Function);
      });

      // Set address
      result.current.setKYCCheckETHAddress(DEFAULT_ETH_ADDRESS);

      await waitForNextUpdate();

      // Assert pending message
      await waitFor(() => {
        expect(result.current.kycCheckMessageJSX).toEqual(
          <>
            Checking your KYC status
            <CycleEllipsis />
          </>
        );
      });

      // Set redirect link
      result.current.setKYCCheckRedirect(REDIRECT);

      await waitFor(() => {
        expect(result.current.kycCheckMessageJSX).toEqual(
          <>
            Redirecting you to our KYC form
            <CycleEllipsis />
          </>
        );
      });

      // Assert redirect called
      await waitFor(
        () => {
          expect(window.location.href).toBe(`${REDIRECT}/`);
        },
        {timeout: 2500}
      );
    });
  });

  test('should return correct data when verification pending response', async () => {
    server.use(
      rest.get(
        `${KYC_BACKEND_URL}/:daoAddress/:ethAddressToCheck`,
        async (_req, res, ctx) =>
          res(ctx.status(500), ctx.json(kycCertificatePendingErrorResponse))
      )
    );

    await act(async () => {
      const {result, waitFor} = await renderHook(
        () => useVerifyKYCApplicant(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitFor(() => {
        // Assert initial state
        expect(result.current.kycCheckCertificate).toBe(undefined);
        expect(result.current.kycCheckError).toBe(undefined);
        expect(result.current.kycCheckMessageJSX).toBe(undefined);
        expect(result.current.kycCheckStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
        expect(result.current.setKYCCheckRedirect).toBeInstanceOf(Function);
      });

      // Set address
      result.current.setKYCCheckETHAddress(DEFAULT_ETH_ADDRESS);

      // Assert pending message
      await waitFor(() => {
        expect(result.current.kycCheckMessageJSX).toEqual(
          <>
            Checking your KYC status
            <CycleEllipsis />
          </>
        );
      });

      await waitFor(
        () => {
          // Assert response state
          expect(result.current.kycCheckCertificate).toEqual(undefined);
          expect(result.current.kycCheckError).toBe(undefined);

          expect(result.current.kycCheckMessageJSX).toEqual(
            <>
              KYC verification for the applicant address is pending and must be
              completed first.
              <br />
              Please try again later.
            </>
          );

          expect(result.current.kycCheckStatus).toBe(AsyncStatus.REJECTED);
          expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
          expect(result.current.setKYCCheckRedirect).toBeInstanceOf(Function);
        },
        {timeout: 5000}
      );
    });
  });

  test('should return correct data when whitelist pending response', async () => {
    server.use(
      rest.get(
        `${KYC_BACKEND_URL}/:daoAddress/:ethAddressToCheck`,
        async (_req, res, ctx) =>
          res(
            ctx.json({
              ...kycCertificateCheckResponse,
              isWhitelisted: false,
            })
          )
      )
    );

    await act(async () => {
      const {result, waitFor} = await renderHook(
        () => useVerifyKYCApplicant(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitFor(() => {
        // Assert initial state
        expect(result.current.kycCheckCertificate).toBe(undefined);
        expect(result.current.kycCheckError).toBe(undefined);
        expect(result.current.kycCheckMessageJSX).toBe(undefined);
        expect(result.current.kycCheckStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
        expect(result.current.setKYCCheckRedirect).toBeInstanceOf(Function);
      });

      // Set address
      result.current.setKYCCheckETHAddress(DEFAULT_ETH_ADDRESS);

      // Assert pending message
      await waitFor(() => {
        expect(result.current.kycCheckMessageJSX).toEqual(
          <>
            Checking your KYC status
            <CycleEllipsis />
          </>
        );
      });

      await waitFor(
        () => {
          // Assert response state
          expect(result.current.kycCheckCertificate).toEqual(undefined);
          expect(result.current.kycCheckError).toBe(undefined);

          expect(result.current.kycCheckMessageJSX).toEqual(
            <>
              The applicant address has been KYC verified, but has not been
              authorized to join yet.
            </>
          );

          expect(result.current.kycCheckStatus).toBe(AsyncStatus.FULFILLED);
          expect(result.current.setKYCCheckETHAddress).toBeInstanceOf(Function);
          expect(result.current.setKYCCheckRedirect).toBeInstanceOf(Function);
        },
        {timeout: 5000}
      );
    });
  });
});
