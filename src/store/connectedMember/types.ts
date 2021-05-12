export type ConnectedMemberState = {
  /**
   * A member's account delegate address (will equal `memberAddress` if not delegated) in the DAO.
   */
  delegateKey: string;
  /**
   * A member has chosen to delegate their address to another address in the DAO.
   */
  isAddressDelegated: boolean;
  /**
   * A member has `UNITS > 0` in the DAO.
   */
  isActiveMember: boolean;
  /**
   * A member's true address in the DAO.
   */
  memberAddress: string;
} | null;
