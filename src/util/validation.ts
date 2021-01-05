export const isEthAddressValid = (ethAddress: string) =>
  /^0x[a-fA-F0-9]{40}$/i.test(ethAddress);
