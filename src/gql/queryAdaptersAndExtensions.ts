import {gql} from '@apollo/client';

export const GET_ADAPTERS_AND_EXTENSIONS = gql`
  query GetAdaptersAndExtensions($daoAddress: String) {
    tributeDaos(where: {daoAddress: $daoAddress}) {
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

export const GET_ADAPTERS_EXTENSIONS_AND_DAO = gql`
  query GetAdaptersExtensionsAndDao($daoAddress: String) {
    tributeDaos(where: {daoAddress: $daoAddress}) {
      id # dao address
      daoAddress
      name
      totalUnits

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
