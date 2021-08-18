import {
  ethGetBlockByNumberResponse,
  ethGetBlockByNumberResponseLegacy,
} from '../../../test/web3Responses/fixtures';
import {getWeb3Instance} from '../../../test/helpers';
import {isEIP1559Compatible} from './isEIP1559Compatible';

describe('getEIP1559Compatibility unit tests', () => {
  test('should return `true` if network has EIP-1559 support', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    mockWeb3Provider.injectResult(ethGetBlockByNumberResponse);

    expect(await isEIP1559Compatible(web3)).toBe(true);
  });

  test('should return `false` if network does not have EIP-1559 support', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    mockWeb3Provider.injectResult(ethGetBlockByNumberResponseLegacy);

    expect(await isEIP1559Compatible(web3)).toBe(false);
  });
});
