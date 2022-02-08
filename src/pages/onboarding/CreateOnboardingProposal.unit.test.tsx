import {render, screen, waitFor, act, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {signTypedDataV4} from '../../test/web3Responses';
import CreateOnboardingProposal from './CreateOnboardingProposal';
import Wrapper from '../../test/Wrapper';

describe('CreateOnboardingProposal unit tests', () => {
  test('should not render form if not connected to a wallet', () => {
    render(
      <Wrapper>
        <CreateOnboardingProposal />
      </Wrapper>
    );

    expect(screen.getByText(/Onboard/)).toBeInTheDocument();
    expect(() => screen.getByLabelText(/applicant address/i)).toThrow();
    expect(() => screen.getByLabelText(/amount/i)).toThrow();
    expect(
      screen.getByText(/connect your wallet to submit an onboarding proposal/i)
    ).toBeInTheDocument();
  });

  test('should render form if connected to a wallet', async () => {
    render(
      <Wrapper
        useWallet
        useInit
        getProps={({mockWeb3Provider, web3Instance}) => {
          // Mock RPC call to `eth_getBalance`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter(
              'uint256',
              '123000000000000000000'
            )
          );
        }}>
        <CreateOnboardingProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/onboard/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/applicant address/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
      expect((document.getElementById('ethAddress') as any)?.value).toBe(
        DEFAULT_ETH_ADDRESS
      );
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-slider')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument();
    });
  });

  // @todo Fix text
  test.skip('should submit form', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useWallet
        useInit
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;

          // Mock RPC call to `eth_getBalance`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter(
              'uint256',
              '123000000000000000000'
            )
          );

          // Mock `getConfiguration` call to get `onboarding.chunkSize` config
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter(
              'uint256',
              '100000000000000000'
            )
          );

          // Mock `getConfiguration` call to get `onboarding.maximumChunks` config
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', '10')
          );

          // Mock `getConfiguration` call to get `onboarding.unitsPerChunk` config
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', '100000')
          );

          // Mock `getAddressIfDelegated` call in useCheckApplicant hook
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
          );
        }}>
        <CreateOnboardingProposal />
      </Wrapper>
    );

    const sliderInput = screen.getByTestId('onboarding-slider');
    expect(sliderInput).toBeInTheDocument();

    fireEvent.change(sliderInput, {target: {value: '0.5'}});

    await waitFor(() => {
      expect(screen.getByText(/0.5/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Mock signature
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
    });

    act(() => {
      userEvent.click(screen.getByRole('button', {name: /submit/i}));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /submitting your proposal/i})
      ).toBeDisabled();
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /done/i})).toBeInTheDocument();
    });
  });
});
