import Web3 from 'web3';

import {FormFieldErrors} from '../../../util/enums';
import {useIsDefaultChain} from '../../web3/hooks';

type ValidationType =
  | 'address'
  | 'bytes32'
  | 'bytes32[]'
  | 'uint256'
  | 'uint256[]';

export type ParamInputType = string | string[] | number | number[];

export enum ParamType {
  ADDRESS = 'address',
  BYTES32 = 'bytes32',
  BYTES32_ARRAY = 'bytes32[]',
  UINT256 = 'uint256',
  UINT256_ARRAY = 'uint256[]',
}

type UseValidationReturn = {
  isParamInputValid: (
    paramInput: ParamInputType,
    paramType: ValidationType
  ) => boolean;
  getFormFieldError: (paramType: ValidationType) => string | FormFieldErrors;
  formatInputByType: (inputValue: any, inputType: ParamType) => string;
};

/**
 * useValidation
 *
 * This hook validates the input values for the ABI parameters.
 *
 * @returns {UseValidationReturn}
 */
export function useValidation(): UseValidationReturn {
  /**
   * Hooks
   */
  const {defaultChain} = useIsDefaultChain();

  function isParamInputValid(
    paramInput: ParamInputType,
    paramType: ValidationType
  ): boolean {
    const parameter: string = paramInput.toString();

    const isValid: boolean =
      paramType === ParamType.ADDRESS
        ? isAddressValid(parameter)
        : paramType === ParamType.BYTES32
        ? isBytes32Valid(parameter)
        : paramType === ParamType.BYTES32_ARRAY
        ? isBytes32ArrayValid(parameter)
        : paramType === ParamType.UINT256
        ? isUint256Valid(parameter)
        : paramType === ParamType.UINT256_ARRAY
        ? isUint256ArrayValid(parameter)
        : true;

    return isValid;
  }

  function getFormFieldError(
    paramType: ValidationType
  ): string | FormFieldErrors {
    return paramType === ParamType.ADDRESS
      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
      : paramType === ParamType.BYTES32
      ? FormFieldErrors.INVALID_BYTES32
      : paramType === ParamType.BYTES32_ARRAY
      ? FormFieldErrors.INVALID_BYTES32_ARRAY
      : paramType === ParamType.UINT256
      ? FormFieldErrors.INVALID_NUMBER
      : paramType === ParamType.UINT256_ARRAY
      ? FormFieldErrors.INVALID_NUMBER_ARRAY
      : FormFieldErrors.REQUIRED;
  }

  /**
   * isAddressValid()
   *
   * @returns boolean
   * @param parameter string
   */
  function isAddressValid(parameter: string): boolean {
    try {
      if (!parameter) return false;

      return (
        Web3.utils.checkAddressChecksum(parameter, defaultChain) ||
        Web3.utils.isAddress(parameter, defaultChain)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * isBytes32Valid()
   *
   * @returns boolean
   * @param parameter string
   */
  function isBytes32Valid(parameter: string): boolean {
    try {
      if (!parameter) return false;

      return parameter.length === 66 && Web3.utils.isHex(parameter);
    } catch (error) {
      return false;
    }
  }

  /**
   * isBytes32ArrayValid()
   *
   * @returns boolean
   * @param parameter string
   */
  function isBytes32ArrayValid(parameter: string): boolean {
    try {
      return Array.from(parameter.split(',')).every(
        (p) => p.length === 66 && Web3.utils.isHex(p)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * isUint256Valid
   *
   * @returns boolean
   * @param parameter string
   */
  function isUint256Valid(parameter: string): boolean {
    return !isNaN(Number(parameter));
  }

  /**
   * isUint256ArrayValid()
   *
   * @returns boolean
   * @param parameter string
   */
  function isUint256ArrayValid(parameter: string): boolean {
    return Array.from(parameter.split(',')).every((p) => Number(p));
  }

  function formatInputByType(inputValue: any, inputType: any) {
    const formatBytes32Array = (): string[] =>
      Array.from(inputValue.split(','));
    const formatUint256Array = (): number[] => {
      return Array.from(inputValue.split(',').map((i: string) => Number(i)));
    };

    return inputType === ParamType.BYTES32_ARRAY
      ? formatBytes32Array()
      : inputType === ParamType.UINT256_ARRAY
      ? formatUint256Array()
      : inputType === ParamType.UINT256
      ? Number(inputValue)
      : inputValue;
  }

  return {
    isParamInputValid,
    getFormFieldError,
    formatInputByType,
  };
}
