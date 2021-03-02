import {gql} from '@apollo/client';

export const GET_ADAPTERS_AND_EXTENSIONS = gql`
  query GetAdaptersAndExtensions($daoAddress: String) {
    molochv3S(where: {daoAddress: $daoAddress}) {
      adapters {
        id
        acl
        adapterId
        adapterAddress
      }
      extensions {
        id
        extensionId
        extensionAddress
      }
    }
  }
`;
