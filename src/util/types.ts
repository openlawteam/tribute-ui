/**
 * FOR HIGH REUSE TYPES
 *
 * For any other more specific types, co-locate them in either:
 *
 * 1) The actual code file.
 * 2) In a type file in the location of the code files which mainly use the types.
 *
 * @see https://kentcdodds.com/blog/colocation
 */

export type EnvironmentName = 'localhost' | 'development' | 'production';

export enum AsyncStatus {
  STANDBY = 'STANDBY',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}

export interface MetaMaskRPCError extends Error {
  code: number;
}
