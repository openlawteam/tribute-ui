import {waitFor} from '@testing-library/react';

import {getVotingAdapterABI} from './';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import OffchainVotingContractABI from '../../../abis/tribute-contracts/OffchainVotingContract.json';
import VotingContractABI from '../../../abis/tribute-contracts/VotingContract.json';

describe('getVotingAdapterABI unit tests', () => {
  test('can return off-chain voting abi', async () => {
    const abi = await getVotingAdapterABI(
      VotingAdapterName.OffchainVotingContract
    );

    expect(abi).toMatchObject(OffchainVotingContractABI);
  });

  test('can return on-chain voting abi', async () => {
    const abi = await getVotingAdapterABI(VotingAdapterName.VotingContract);

    expect(abi).toMatchObject(VotingContractABI);
  });

  test('can throw error if bad voting adapter name', async () => {
    let errorToTest: Error;

    try {
      await getVotingAdapterABI('ew' as VotingAdapterName);
    } catch (error) {
      errorToTest = error;
    }

    await waitFor(() => {
      expect(errorToTest.message).toMatch(
        /no voting adapter name was found for "ew"\./i
      );
    });
  });
});
