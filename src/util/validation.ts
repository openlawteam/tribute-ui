import Web3 from 'web3';

export const hasValue = (value: string) => (value !== '' ? true : false);

export const isEmailValid = (email: string) =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

export const isEthAddressValid = (ethAddress: string) =>
  Web3.utils.isAddress(ethAddress);
