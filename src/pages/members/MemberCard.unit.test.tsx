import {render} from '@testing-library/react';

import {BURN_ADDRESS} from '../../util/constants';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {Member} from './types';
import MemberCard from './MemberCard';
import userEvent from '@testing-library/user-event';
import Wrapper from '../../test/Wrapper';

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

    expect(getByText('100k')).toBeInTheDocument();
  });

  test('should render with member ens address', () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, addressENS: 'cool.eth'}} />
      </Wrapper>
    );

    expect(getByText(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
    expect(getByText(/cool\.eth/i)).toBeInTheDocument();
  });

  test('should render with link', () => {
    const {getByRole} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} to="/some/page" />
      </Wrapper>
    );

    expect(
      getByRole('link', {name: `${DEFAULT_ETH_ADDRESS} 100k`})
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
    // Assert >1 units

    const {getByText, rerender} = render(
      <Wrapper>
        <MemberCard member={DEFAULT_MEMBER} />
      </Wrapper>
    );

    userEvent.hover(getByText(/^100k$/));

    expect(getByText(/^100,000 units$/i)).toBeInTheDocument();

    // Assert 0 units

    rerender(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, units: '0'}} />
      </Wrapper>
    );

    userEvent.hover(getByText(/^0$/));

    expect(getByText(/^0 units$/i)).toBeInTheDocument();

    // Assert 1 unit

    rerender(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, units: '1'}} />
      </Wrapper>
    );

    userEvent.hover(getByText(/^1$/));

    expect(getByText(/^1 unit$/i)).toBeInTheDocument();
  });

  test('should render tooltip with member ens address on eth address hover', async () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, addressENS: 'cool.eth'}} />
      </Wrapper>
    );

    userEvent.hover(getByText(DEFAULT_ETH_ADDRESS));

    expect(getByText(`cool.eth (${DEFAULT_ETH_ADDRESS})`)).toBeInTheDocument();
  });

  test('should render tooltip with member ens address on ens name hover', async () => {
    const {getByText} = render(
      <Wrapper>
        <MemberCard member={{...DEFAULT_MEMBER, addressENS: 'cool.eth'}} />
      </Wrapper>
    );

    userEvent.hover(getByText(/cool\.eth/));

    expect(getByText(`cool.eth (${DEFAULT_ETH_ADDRESS})`)).toBeInTheDocument();
  });
});
