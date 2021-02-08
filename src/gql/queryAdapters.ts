import {gql} from '@apollo/client';

export const GET_ADAPTERS = gql`
  query GetAdapters {
    adapters {
      id
      acl
      adapterId
      adapterAddress
    }
  }
`;
