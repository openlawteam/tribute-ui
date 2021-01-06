import Web3 from 'web3';

export const isEthAddressValid = (ethAddress: string) =>
  Web3.utils.isAddress(ethAddress);
