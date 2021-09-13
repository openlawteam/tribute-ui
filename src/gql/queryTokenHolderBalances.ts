import {gql} from '@apollo/client';

export const GET_TOKEN_HOLDER_BALANCES = gql`
  query GetTokenHolderBalances($tokenAddress: String!) {
    tokens(where: {tokenAddress: $tokenAddress}) {
      symbol
      tokenAddress
      holders {
        balance
        member {
          id
          delegateKey
        }
      }
    }
  }
`;
