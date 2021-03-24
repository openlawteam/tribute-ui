import {gql} from '@apollo/client';

export const GET_MEMBERS = gql`
  query GetMembers($daoAddress: String) {
    molochv3S(where: {daoAddress: $daoAddress}) {
      members(orderBy: createdAt, orderDirection: desc) {
        createdAt
        address: memberAddress
        delegateKey
        isDelegated
        shares
        loot
        lockedLoot
        isJailed
        didFullyRagequit
      }
    }
  }
`;
