import {render, waitFor} from '@testing-library/react';
import {Store} from 'redux';

import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import Wrapper from '../../test/Wrapper';

describe('connectedMember int tests', () => {
  test('connectedMember should be set when using <Init /> with a connected wallet (defaults to member wallet)', async () => {
    let wrapperStore: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({store}) => {
          wrapperStore = store;
        }}
      />
    );

    await waitFor(() => {
      expect(wrapperStore.getState().connectedMember).toBe(null);
    });

    await waitFor(() => {
      expect(wrapperStore.getState().connectedMember).toMatchObject({
        delegateKey: DEFAULT_ETH_ADDRESS,
        isActiveMember: true,
        memberAddress: DEFAULT_ETH_ADDRESS,
      });
    });
  });
});
