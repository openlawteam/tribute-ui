import {render, screen, waitFor} from '@testing-library/react';
import React from 'react';

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
      screen.getByText(/connect your wallet to submit a member proposal/i)
    ).toBeInTheDocument();
  });

  test('should render form if connected to a wallet', () => {
    render(
      <Wrapper useWallet useInit>
        <CreateMembershipProposal />
      </Wrapper>
    );

    expect(screen.getByText(/join/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/applicant address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument();
  });

  test('should render connected address as applicant address default', () => {
    render(
      <Wrapper useWallet useInit>
        <CreateMembershipProposal />
      </Wrapper>
    );

    expect(screen.getByDisplayValue(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
    expect((document.getElementById('ethAddress') as any)?.value).toBe(
      DEFAULT_ETH_ADDRESS
    );
  });

  // test('should submit form', async () => {
  //   render(
  //     <Wrapper
  //       useWallet
  //       useInit
  //       getProps={({mockWeb3Provider, web3Instance}) => {
  //         /**
  //          * Mock RPC call to `onboard`
  //          * @note The signature interaction is already mocked by default inside of `Wrapper`
  //          */
  //         mockWeb3Provider.injectResult(web3Instance.eth.abi.decodeParameter);
  //         /**
  //          * Mock RPC call to `onboard`
  //          * @note The signature interaction is already mocked by default inside of `Wrapper`
  //          */
  //         // mockWeb3Provider.injectResult(web3Instance.eth.abi.decodeParameter);
  //       }}>
  //       <CreateMembershipProposal />
  //     </Wrapper>
  //   );

  //   userEvent.click(screen.getByRole('button', {name: /submit/i}));

  //   await waitFor(() => {
  //     expect(screen.getByRole('button', {name: /sbmit/i})).toBeInTheDocument();
  //   });
  // });
});
