import {alchemyFetchAssetTransfers} from './alchemyFetchAssetTransfers';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {getAssetTransfersFixture} from '../../../test/restResponses';
import {rest, server} from '../../../test/server';

describe('alchemyFetchAssetTransfers unit tests', () => {
  test('should return correct result', async () => {
    expect(
      await alchemyFetchAssetTransfers({
        toAddress: DEFAULT_ETH_ADDRESS,
      })
    ).toEqual(getAssetTransfersFixture.result.transfers);
  });

  test('should return correct result with `pageKey`', async () => {
    let paginatedCallCount: number = 0;

    // Setup
    server.use(
      rest.post('https://eth-mainnet.alchemyapi.io/v2/*', (_req, res, ctx) => {
        paginatedCallCount = paginatedCallCount += 1;

        if (paginatedCallCount === 2) {
          server.resetHandlers();

          return;
        }

        return res(
          ctx.json({
            ...getAssetTransfersFixture,
            result: {
              ...getAssetTransfersFixture.result,
              // for testing pagination
              pageKey: 'f2839689-44cf-43ea-b3b5-2efa4de049ae',
            },
          })
        );
      })
    );

    // Assert response
    expect(
      await alchemyFetchAssetTransfers({
        toAddress: DEFAULT_ETH_ADDRESS,
      })
    ).toEqual([
      ...getAssetTransfersFixture.result.transfers,
      ...getAssetTransfersFixture.result.transfers,
    ]);

    expect(paginatedCallCount).toBe(2);
  });

  test('should throw error if no Alchemy API URL', async () => {
    // Setup
    const getAlchemyURL = await import('../../../util/helpers/getAlchemyURL');

    const spy = jest
      .spyOn(getAlchemyURL, 'getAlchemyURL')
      .mockImplementation(() => undefined);

    let e: Error | undefined = undefined;

    try {
      await alchemyFetchAssetTransfers({
        toAddress: DEFAULT_ETH_ADDRESS,
      });
    } catch (error) {
      e = error as Error;
    }

    // Assert error
    expect(e?.message).toMatch(/no alchemy url was found\./i);

    // Cleanup
    spy.mockRestore();
  });

  test('should throw error if bad response', async () => {
    // Setup
    server.use(
      rest.post('https://eth-mainnet.alchemyapi.io/v2/*', (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    let e: Error | undefined = undefined;

    try {
      await alchemyFetchAssetTransfers({
        toAddress: DEFAULT_ETH_ADDRESS,
      });
    } catch (error) {
      e = error as Error;
    }

    // Assert error
    expect(e?.message).toMatch(
      /something went wrong while fetching alchemy_getAssetTransfers\./i
    );
  });
});
