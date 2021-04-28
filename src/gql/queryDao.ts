import {gql} from '@apollo/client';

export const GET_DAO = gql`
  query GetDao($id: ID) {
    tributeDaos(where: {id: $id}) {
      id # dao address
      daoAddress
      name
      totalUnits
    }
  }
`;
