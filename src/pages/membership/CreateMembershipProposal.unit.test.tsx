import {render, screen, waitFor, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {signTypedDataV4} from '../../test/web3Responses';
import CreateMembershipProposal from './CreateMembershipProposal';
import Wrapper from '../../test/Wrapper';

describe('CreateMembershipProposal unit tests', () => {
  test('should not render form if not connected to a wallet', () => {
    render(
      <Wrapper>
        <CreateMembershipProposal />
      </Wrapper>
    );

    expect(screen.getByText(/join/i)).toBeInTheDocument();
    expect(() => screen.getByLabelText(/applicant address/i)).toThrow();
    expect(() => screen.getByLabelText(/amount/i)).toThrow();
    expect(
      screen.getByText(/connect your wallet to submit a membership proposal/i)
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
        <CreateMembershipProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/join/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/applicant address/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
      expect((document.getElementById('ethAddress') as any)?.value).toBe(
        DEFAULT_ETH_ADDRESS
      );
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/123/i)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument();
    });
  });

  test('should submit form', async () => {
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

          // Mock `multicall` in useCheckApplicant hook
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameters(
              ['uint256', 'bytes[]'],
              [
                0,
                [
                  // For `isNotReservedAddress` call
                  web3Instance.eth.abi.encodeParameter('bool', true),
                  // For `isNotZeroAddress` call
                  web3Instance.eth.abi.encodeParameter('bool', true),
                  // For `getAddressIfDelegated` call
                  web3Instance.eth.abi.encodeParameter(
                    'address',
                    DEFAULT_ETH_ADDRESS
                  ),
                ],
              ]
            )
          );
        }}>
        <CreateMembershipProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/123/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/amount/i), '12', {delay: 100});

    expect(screen.getByDisplayValue(/12/i)).toBeInTheDocument();

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
