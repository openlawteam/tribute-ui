export type FakeMemberProposals = {
  name: string;
  body: string;
  snapshotProposal: {
    start: number;
    end: number;
    yesShares: number;
    noShares: number;
  };
};

export const fakeMemberProposalsVoting: FakeMemberProposals[] = [
  {
    name: '0xA089E0684BD87Be6e3F343e224Da191C500883Ec',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 0,
      noShares: 0,
    },
  },
  {
    name: '0xE7deBE6565CD01b6152B345B689A15Eb710D21e6',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 4500000,
      noShares: 0,
    },
  },
  {
    name: '0x80C6CF52720BeD578D3E446199516CB816F67e37',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 0,
      noShares: 3500000,
    },
  },
  {
    name: '0xE00BcCddD33E9578904570409E0283C0ef511472',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 7000000,
      noShares: 2500000,
    },
  },
  {
    name: '0x3D1AaFD15850544b358738c89afC4608F8351D2C',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 3500000,
      noShares: 5500000,
    },
  },
  {
    name: '0x9b5D3d12055B7b70E839e12417a2B9cE5ED9965c',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610610010,
      yesShares: 5000000,
      noShares: 5000000,
    },
  },
];

export const fakeMemberProposalsPassed = [
  {
    name: '0xc7B5d4391313E018F8BA1059E72659e306AA7276',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 100000,
      noShares: 0,
    },
  },
  {
    name: '0x9dA14D4F9789FA87A9A8cA3b8A309121F32f4dB3',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 7000000,
      noShares: 3000000,
    },
  },
  {
    name: '0x273C63Cdd8Bb808550177d0b45De19cC763897E1',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 5000000,
      noShares: 2500000,
    },
  },
  {
    name: '0x88870d439b899a7A50D6d1371cAD5558608F366e',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 7500000,
      noShares: 2500000,
    },
  },
  {
    name: '0xbD63DB043c53f3C42c8D3Dd3AC17F31d7fcBF2Ab',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 5500000,
      noShares: 4500000,
    },
  },
  {
    name: '0x9Ed4a0711DDF777084CC1623f6d8D4Ef9e328EF9',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
    snapshotProposal: {
      start: 1610350810,
      end: 1610352716,
      yesShares: 10000000,
      noShares: 0,
    },
  },
];
