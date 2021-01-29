import {renderHook, act} from '@testing-library/react-hooks';

import {isActiveMember} from '../test/web3Responses';
import {useMemberActionDisabled} from '.';
import Wrapper from '../test/Wrapper';

describe('useMemberActionDisabled unit tests', () => {
  test('should return correct data when wallet is disconnected', async () => {
    const {result} = renderHook(() => useMemberActionDisabled(), {
      initialProps: {
        useInit: true,
      },
      wrapper: Wrapper,
    });

    // Assert initial state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(
      /your wallet is not connected\./i
    );
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);
  });

  test('should return correct data when user is not member', async () => {
    const {result, waitForNextUpdate} = renderHook(
      () => useMemberActionDisabled(),
      {
        initialProps: {
          getProps: ({mockWeb3Provider, web3Instance}) => {
            mockWeb3Provider.injectResult(
              ...isActiveMember({result: false, web3Instance})
            );
          },
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      }
    );

    // Assert initial state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(
      /either you are not a member, or your membership is not active\./i
    );
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

    await waitForNextUpdate();

    // Assert post-init state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(
      /either you are not a member, or your membership is not active\./i
    );
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);
  });

  test('should return correct data when user is member', async () => {
    // @note By default <Wrapper /> set the member to active when using `useWallet`
    const {result, waitForNextUpdate} = renderHook(
      () => useMemberActionDisabled(),
      {
        initialProps: {
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      }
    );

    // Assert initial state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(
      /either you are not a member, or your membership is not active\./i
    );
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

    await waitForNextUpdate();

    // Assert post-init state
    expect(result.current.isDisabled).toBe(false);
    expect(result.current.disabledReason).toBe('');
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);
  });

  test('should return correct data when other reason is set', async () => {
    // @note By default <Wrapper /> set the member to active when using `useWallet`
    const {result, waitForNextUpdate} = renderHook(
      () => useMemberActionDisabled(),
      {
        initialProps: {
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      }
    );

    // Assert initial state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(
      /either you are not a member, or your membership is not active\./i
    );
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

    await waitForNextUpdate();

    // Assert post-init state
    expect(result.current.isDisabled).toBe(false);
    expect(result.current.disabledReason).toBe('');
    expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
    expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

    act(() => {
      result.current.setOtherDisabledReasons(['Some other reason!']);
    });

    // Assert post-setOtherDisabledReasons state
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.disabledReason).toMatch(/some other reason!/i);
  });
});
