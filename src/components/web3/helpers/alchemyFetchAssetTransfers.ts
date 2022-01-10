import {CHAINS} from '../../../config';
import {getAlchemyURL} from '../../../util/helpers';
import {numberTo0xHexString} from '../../../util/helpers/numberTo0xHexString';

type AlchemyGetAssetTransfersCategories =
  | 'external'
  | 'internal'
  | 'token'
  | 'erc20'
  | 'erc721'
  | 'erc1155';

type GetAssetTransfersParameters = {
  /**
   * Will be converted to hex string
   */
  fromBlock?: number;
  /**
   * Will be converted to hex string
   */
  toBlock?: number;
  fromAddress?: string;
  toAddress?: string;
  contractAddresses?: string[];
  category?: AlchemyGetAssetTransfersCategories;
  excludeZeroValue?: boolean;
  /**
   * Will be converted to hex string
   */
  maxCount?: number;
  pageKey?: string;
};

type AlchemyGetAssetTransfersResult = {
  asset: string | null;
  blockNum: string;
  category: AlchemyGetAssetTransfersCategories;
  erc1155Metadata: {tokenId: string; value: string}[] | null;
  erc721TokenId: string | null;
  from: string;
  hash: string;
  rawContract: {
    address: string | null;
    decimal: string | null;
    value: string | null;
  };
  to: string | null;
  value: number | null;
};

type AlchemyGetAssetTransfersResponse = {
  id: string;
  jsonrpc: number;
  result: {
    pageKey: string;
    transfers: AlchemyGetAssetTransfersResult[];
  };
};

/**
 * Gets asset transfers between addresses via Alchemy API.
 *
 * The Alchemy Transfers API only works on mainnet.
 *
 * @param parameters `GetAssetTransfersParameters`
 * @returns
 * @see https://docs.alchemy.com/alchemy/enhanced-apis/transfers-api
 */
export async function alchemyFetchAssetTransfers(
  parameters: GetAssetTransfersParameters
): Promise<AlchemyGetAssetTransfersResult[]> {
  const ALCHEMY_URL = getAlchemyURL(CHAINS.MAINNET);

  if (!ALCHEMY_URL) {
    throw new Error('No Alchemy URL was found.');
  }

  const requestOptions = {
    id: 0,
    jsonrpc: '2.0',
    method: 'alchemy_getAssetTransfers',
    params: [
      {
        ...parameters,
        fromBlock: parameters.fromBlock
          ? numberTo0xHexString(parameters.fromBlock)
          : undefined,
        maxCount: parameters.maxCount
          ? numberTo0xHexString(parameters.maxCount)
          : undefined,
        toBlock: parameters.toBlock
          ? numberTo0xHexString(parameters.toBlock)
          : undefined,
      },
    ],
  };

  const response = await fetch(ALCHEMY_URL, {
    body: JSON.stringify(requestOptions),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(
      `Something went wrong while fetching alchemy_getAssetTransfers.`
    );
  }

  const {result} = (await response.json()) as AlchemyGetAssetTransfersResponse;

  const t = [...result.transfers];

  // Recurse, if paginated
  if (result.pageKey) {
    t.push(
      ...(await alchemyFetchAssetTransfers({
        ...parameters,
        pageKey: result.pageKey,
      }))
    );
  }

  return t;
}
