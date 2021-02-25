import {gql} from '@apollo/client';

export const GET_DAO = gql`
  query GetDao($id: ID) {
    molochv3S(where: {id: $id}) {
      id # dao address
      daoAddress
      name
      totalShares
      bank {
        id
        bankAddress
      }
    }
  }
`;
