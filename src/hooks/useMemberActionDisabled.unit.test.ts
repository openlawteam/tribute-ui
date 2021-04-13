import {renderHook, act} from '@testing-library/react-hooks';

import {SET_CONNECTED_MEMBER} from '../store/actions';
import {useMemberActionDisabled} from '.';
import {waitFor} from '@testing-library/react';
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
    await act(async () => {
      let reduxStore: any;

      const {result} = await renderHook(() => useMemberActionDisabled(), {
        initialProps: {
          getProps: ({store}) => {
            reduxStore = store;
          },
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      });

      // Assert initial state
      expect(result.current.isDisabled).toBe(true);
      expect(result.current.disabledReason).toMatch(
        /either you are not a member, or your membership is not active\./i
      );
      expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

      await waitFor(() => {
        expect(reduxStore.getState().connectedMember).not.toBeNull();
      });

      reduxStore.dispatch({
        type: SET_CONNECTED_MEMBER,
        ...reduxStore.getState().connectedMember,
        isActiveMember: false,
      });

      // Assert post-init state
      expect(result.current.isDisabled).toBe(true);
      expect(result.current.disabledReason).toMatch(
        /either you are not a member, or your membership is not active\./i
      );
      expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);
    });
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

  test('should skip member check when "props.skipIsActiveMemberCheck" is "true"', async () => {
    await act(async () => {
      let reduxStore: any;

      // @note By default <Wrapper /> set the member to active when using `useWallet`
      const {result} = await renderHook(
        () => useMemberActionDisabled({skipIsActiveMemberCheck: true}),
        {
          initialProps: {
            getProps: ({store}) => {
              reduxStore = store;
            },
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      // Assert initial state
      expect(result.current.isDisabled).toBe(false);
      expect(result.current.disabledReason).toMatch('');
      expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);

      await waitFor(() => {
        expect(reduxStore.getState().connectedMember).not.toBeNull();
      });

      reduxStore.dispatch({
        type: SET_CONNECTED_MEMBER,
        ...reduxStore.getState().connectedMember,
        isActiveMember: false,
      });

      // await waitForNextUpdate();

      // Assert post-init state
      expect(result.current.isDisabled).toBe(false);
      expect(result.current.disabledReason).toBe('');
      expect(result.current.openWhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.WhyDisabledModal).toBeInstanceOf(Function);
      expect(result.current.setOtherDisabledReasons).toBeInstanceOf(Function);
    });
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

  test('should not be disabled if provided other reasons are empty strings', async () => {
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
      result.current.setOtherDisabledReasons(['', '', '']);
    });

    // Assert post-setOtherDisabledReasons state
    expect(result.current.isDisabled).toBe(false);
    expect(result.current.disabledReason).toBe('');
  });
});
