export enum SubgraphNetworkStatus {
  OK = 'OK',
  ERR = 'ERR',
}

export type SubgraphNetworkStatusState = {
  status: SubgraphNetworkStatus;
};
