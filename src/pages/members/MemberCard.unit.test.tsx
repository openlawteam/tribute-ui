import {render, waitFor} from '@testing-library/react';

import {BURN_ADDRESS} from '../../util/constants';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {Member} from './types';
import MemberCard from './MemberCard';
import Wrapper from '../../test/Wrapper';
import userEvent from '@testing-library/user-event';

describe('MemberCard unit tests', () => {
  const DEFAULT_MEMBER: Member = {
    address: DEFAULT_ETH_ADDRESS,
    delegateKey: BURN_ADDRESS,
    isDelegated: false,
    units: '100000',
  };

  test('should render with member address', () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} />
      </Wrapper>
    );

    expect(getByText(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
  });

  test('should render with units', () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} />
      </Wrapper>
    );

    expect(getByText('100,000')).toBeInTheDocument();
  });

  test('should render with member ens address', () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, addressENS: 'cool.eth'}} />
      </Wrapper>
    );

    expect(getByText(/cool.eth/i)).toBeInTheDocument();
  });

  test('should render with link', () => {
    const {getByRole} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} to="/some/page" />
      </Wrapper>
    );

    expect(
      getByRole('link', {name: `${DEFAULT_ETH_ADDRESS} 100,000`})
    ).toBeInTheDocument();
  });

  test('should render tooltip with member address', async () => {
    const {getAllByText, getByText} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} />
      </Wrapper>
    );

    userEvent.hover(getByText(DEFAULT_ETH_ADDRESS));

    expect(getAllByText(DEFAULT_ETH_ADDRESS).length === 2).toBe(true);
  });

  test('should render tooltip with member units', async () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} />
      </Wrapper>
    );

    userEvent.hover(getByText('100,000'));

    expect(getByText(/100,000 units/i)).toBeInTheDocument();
  });

  test('should render tooltip with member ens address', async () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, addressENS: 'cool.eth'}} />
      </Wrapper>
    );

    userEvent.hover(getByText(/cool\.eth/));

    expect(getByText(`cool.eth (${DEFAULT_ETH_ADDRESS})`)).toBeInTheDocument();
  });
});
