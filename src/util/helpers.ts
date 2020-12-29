export const formatEthereumAddress = (addr: string, maxLength: number = 5) => {
  if (addr === null) return '---';

  if (typeof addr !== 'undefined' && addr.length > 9) {
    const firstSegment = addr.substring(0, maxLength);
    const secondPart = addr.substring(addr.length - 3);
    return firstSegment + '...' + secondPart;
  } else {
    return '---';
  }
};

/**
 * disableReactDevTools
 *
 * Run before the app mounts to disable React dev tools.
 * Ideally, this is run conditionally based on environment.
 *
 * @see: https://github.com/facebook/react-devtools/issues/191#issuecomment-443607190
 */
export function disableReactDevTools() {
  const noop = (): void => undefined;
  const DEV_TOOLS = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (typeof DEV_TOOLS === 'object') {
    for (const [key, value] of Object.entries(DEV_TOOLS)) {
      DEV_TOOLS[key] = typeof value === 'function' ? noop : null;
    }
  }
}
