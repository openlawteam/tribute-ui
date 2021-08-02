import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * signTypedDataV4
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<string>}
 * @see https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4
 */
export const signTypedDataV4 = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => [
  result ??
    web3Instance.eth.abi.encodeParameter(
      'bytes32',
      web3Instance.utils.toHex('great signature')
    ),
  {debugName: '`signTypedDataV4` helper'},
];
