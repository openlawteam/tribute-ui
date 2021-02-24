import {gql} from '@apollo/client';

export const GET_ADAPTERS_AND_EXTENSIONS = gql`
  query GetAdaptersAndExtensions {
    adapters: adapters {
      id
      acl
      adapterId
      adapterAddress
    }
    extensions: extensions {
      id
      extensionId
      extensionAddress
    }
  }
`;
