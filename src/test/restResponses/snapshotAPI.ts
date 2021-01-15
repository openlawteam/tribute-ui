export const snapshotAPIRootResponse = {
  name: 'snapshot-hub',
  network: 'testnet',
  version: '0.1.2',
  tag: 'alpha',
  relayer: '0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0',
};

export const snapshotAPISpaceResponse = {
  token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
  name: 'Tribute',
  network: '1',
  symbol: 'TRIBE',
  skin: 'tribute',
  strategies: [
    {
      name: 'moloch',
      params: {
        address: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        symbol: 'TRIBE',
        decimals: 18,
      },
    },
  ],
  filters: {defaultTab: 'all', minScore: 1},
};
