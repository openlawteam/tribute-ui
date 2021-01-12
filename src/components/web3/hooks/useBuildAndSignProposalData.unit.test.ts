import {useBuildAndSignProposalData} from '.';
import {ethBlockNumber} from '../../../test/web3Responses';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';

describe('buildAndSignProposalData unit tests', () => {
  test.skip('should return correct data', async () => {
    // const {web3, mockWeb3Provider} = getWeb3Instance();
    // // Inject fake Web3 eth_blockNumber result for `buildAndSignProposalData`
    // mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance: web3}));
    // const {proposalData, signature} = await buildAndSignProposalData(
    //   {name: 'Test Proposal Name', body: 'Test body.'},
    //   DEFAULT_ETH_ADDRESS,
    //   web3
    // );
    // const proposalDataPartial = {
    //   ...proposalData,
    //   payload: {...proposalData.payload},
    // };
    // // Remove dynamic Date data to test separately.
    // delete (proposalDataPartial as any).payload.end;
    // delete (proposalDataPartial as any).payload.start;
    // delete (proposalDataPartial as any).timestamp;
    // expect(proposalDataPartial).toEqual({
    //   payload: {
    //     body: 'Test body.',
    //     choices: ['yes', 'no'],
    //     name: 'Test Proposal Name',
    //     snapshot: '100',
    //   },
    //   sig: '',
    //   space: 'tributedao',
    //   type: 'proposal',
    // });
    // // Testing dynamic Date timestamps to make sure number > 0
    // expect(proposalData.payload.end).toBeGreaterThan(0);
    // expect(proposalData.payload.start).toBeGreaterThan(0);
    // expect(proposalData.timestamp).toBeGreaterThan(0);
    // expect(signature).toEqual('0x0');
  });
});
