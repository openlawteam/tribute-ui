import {DEFAULT_ETH_ADDRESS, DEFAULT_DAO_NAME} from '../helpers';

export const daoResponse = {
  laolands: [
    {
      id: DEFAULT_ETH_ADDRESS,
      daoAddress: DEFAULT_ETH_ADDRESS,
      name: DEFAULT_DAO_NAME,
      totalShares: null,
      bank: {
        id: DEFAULT_ETH_ADDRESS,
        bankAddress: DEFAULT_ETH_ADDRESS,
      },
      __typename: 'Laoland',
    },
  ],
};
