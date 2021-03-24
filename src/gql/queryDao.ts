import {gql} from '@apollo/client';

export const GET_DAO = gql`
  query GetDao($id: ID) {
    tributes(where: {id: $id}) {
      id # dao address
      daoAddress
      name
      totalShares
    }
  }
`;
