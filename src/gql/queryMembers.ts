import {gql} from '@apollo/client';

export const GET_MEMBERS = gql`
  query GetMembers($daoAddress: String) {
    tributeDaos(where: {daoAddress: $daoAddress}) {
      members(orderBy: createdAt, orderDirection: desc) {
        createdAt
        address: memberAddress
        delegateKey
        isDelegated
        units
        didFullyRagequit
      }
    }
  }
`;
