/**
 * @see https://docs.alchemy.com/alchemy/enhanced-apis/transfers-api
 */
export const getAssetTransfersFixture = {
  id: 0,
  result: {
    transfers: [
      {
        blockNum: '0xcace2e',
        hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
        from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
        to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
        value: 50,
        erc721TokenId: null,
        erc1155Metadata: null,
        asset: 'WETH',
        category: 'token',
        rawContract: {
          value: '0x02b5e3af16b1880000',
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          decimal: '0x12',
        },
      },
      {
        blockNum: '0xcace51',
        hash: '0xae193dfeafd4a2387c119eef43ff5bc82d8a4f19cc40f44e13dd69aa3165e882',
        from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
        to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
        value: 150,
        erc721TokenId: null,
        erc1155Metadata: null,
        asset: 'WETH',
        category: 'token',
        rawContract: {
          value: '0x0821ab0d4414980000',
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          decimal: '0x12',
        },
      },
    ],
  },
  jsonrpc: '2.0',
};
