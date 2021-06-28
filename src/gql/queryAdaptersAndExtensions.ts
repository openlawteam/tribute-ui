import {gql} from '@apollo/client';

export const GET_ADAPTERS_AND_EXTENSIONS = gql`
  query GetAdaptersAndExtensions($daoAddress: String) {
    tributeDaos(where: {daoAddress: $daoAddress}) {
      daoAddress
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
