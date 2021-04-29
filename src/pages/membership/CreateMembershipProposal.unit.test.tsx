import {render, screen, waitFor, act} from '@testing-library/react';
import React from 'react';

import {signTypedDataV4} from '../../test/web3Responses';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import CreateMembershipProposal from './CreateMembershipProposal';
import userEvent from '@testing-library/user-event';
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
            ),
            {abiMethodName: 'eth_getBalance'}
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
            ),
            {abiMethodName: 'eth_getBalance'}
          );

          // Mock signature
          mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
        }}>
        <CreateMembershipProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/123/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/amount/i), '12', {delay: 100});

    expect(screen.getByDisplayValue(/12/i)).toBeInTheDocument();

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
