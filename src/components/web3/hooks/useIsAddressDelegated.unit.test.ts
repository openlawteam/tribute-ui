import {renderHook, act} from '@testing-library/react-hooks';

import {setConnectedMember} from '../../../store/actions';
import {useIsAddressDelegated} from './';
import Wrapper from '../../../test/Wrapper';

describe('useIsAddressDelegated unit tests', () => {
  test('should return correct result when address not delegated', async () => {
    await act(async () => {
      const {result} = await renderHook(() => useIsAddressDelegated(), {
        initialProps: {
          useInit: true,
          useWallet: true,
        },
        wrapper: Wrapper,
      });

      expect(result.current).toBe(false);
    });
  });

  test('should return correct result when address delegated', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useIsAddressDelegated(),
        {
          initialProps: {
            getProps: ({store}) => {
              setTimeout(() => {
                store.dispatch(
                  setConnectedMember({
                    ...store.getState().connectedMember,
                    delegateKey: '0xc3C966D3B7b085d0fF936ed772Ac38b2A347836F',
                  })
                );
              }, 1000);
            },
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      expect(result.current).toBe(false);

      await waitForNextUpdate();

      expect(result.current).toBe(false);

      await waitForNextUpdate();

      expect(result.current).toBe(true);
    });
  });
});
