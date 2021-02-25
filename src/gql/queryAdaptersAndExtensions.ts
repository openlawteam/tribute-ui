import {gql} from '@apollo/client';

export const GET_ADAPTERS_AND_EXTENSIONS = gql`
  query GetAdaptersAndExtensions($daoAddress: String) {
    # adapters: adapters {
    #   id
    #   acl
    #   adapterId
    #   adapterAddress
    # }
    # extensions: extensions {
    #   id
    #   extensionId
    #   extensionAddress
    # }
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
